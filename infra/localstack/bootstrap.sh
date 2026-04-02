#!/usr/bin/env bash
# infra/localstack/bootstrap.sh
#
# Builds, packages, and deploys Lambda functions to LocalStack.
# Creates REST API Gateways with {proxy+} routes for each service.
# Reads service definitions from services.json.
#
# Prerequisites: jq, awslocal, zip, npm
# Runs from the monorepo root directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SERVICES_FILE="${SCRIPT_DIR}/services.json"
REGION="us-east-1"
STAGE="local"
LAMBDA_RUNTIME="nodejs22.x"
LAMBDA_HANDLER="handler.handler"
LOCALSTACK_ENDPOINT="http://localhost:4566"

# ---------------------------------------------------------------------------
# Step 1: Create IAM execution role (shared across all Lambdas)
# ---------------------------------------------------------------------------
echo "[bootstrap] Creating IAM execution role..."

ROLE_NAME="lambda-execution-role"
TRUST_POLICY='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

awslocal iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --region "$REGION" \
    2>/dev/null || true

awslocal iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
    --region "$REGION" \
    2>/dev/null || true

echo "[bootstrap] IAM role ready."

# ---------------------------------------------------------------------------
# Step 2: Build all services in parallel via turbo
# ---------------------------------------------------------------------------
echo "[bootstrap] Building Lambda functions..."

cd "$REPO_ROOT"
npx turbo run build --filter='./src/services/*'

echo "[bootstrap] Build complete."

# Helper: wait for a Lambda function to reach Active state before updating.
# LocalStack can leave functions in Pending state briefly after creation,
# causing UpdateFunctionCode to fail with InternalError.
wait_for_active() {
    local fn_name="$1"
    local max_attempts=10
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        state=$(awslocal lambda get-function --function-name "$fn_name" --region "$REGION" --query 'Configuration.State' --output text 2>/dev/null || echo "NotFound")
        if [ "$state" = "Active" ] || [ "$state" = "NotFound" ]; then
            return 0
        fi
        echo "[bootstrap]   Waiting for ${fn_name} to become Active (currently: ${state})..."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo "[bootstrap]   WARNING: ${fn_name} did not reach Active state after ${max_attempts}s"
    return 1
}

# ---------------------------------------------------------------------------
# Step 3: Package, deploy, and wire API Gateway for each Lambda service
# ---------------------------------------------------------------------------
jq -c '.services[] | select(.hasLambda == true)' "$SERVICES_FILE" | while IFS= read -r svc; do
    name=$(echo "$svc" | jq -r '.name')
    rest_api_id=$(echo "$svc" | jq -r '.restApiId // empty')

    SERVICE_DIR="${REPO_ROOT}/src/services/${name}"
    DIST_DIR="${SERVICE_DIR}/dist"
    ZIP_FILE="/tmp/${name}-lambda.zip"

    # -------------------------------------------------------------------------
    # Step 3a: Package Lambda
    # -------------------------------------------------------------------------
    echo "[bootstrap] Packaging ${name}..."

    # Remove stale zip if present so we get a clean archive
    rm -f "$ZIP_FILE"

    # Zip from inside dist/ so handler.js sits at the root of the archive
    (cd "$DIST_DIR" && zip -qr "$ZIP_FILE" .)

    # -------------------------------------------------------------------------
    # Step 3b: Deploy Lambda function (idempotent: create or update)
    # -------------------------------------------------------------------------
    echo "[bootstrap] Deploying Lambda: ${name}..."

    # If function already exists, wait for Active state before updating
    if awslocal lambda get-function --function-name "$name" --region "$REGION" >/dev/null 2>&1; then
        wait_for_active "$name"
        awslocal lambda update-function-code \
            --function-name "$name" \
            --zip-file "fileb://${ZIP_FILE}" \
            --region "$REGION"
    else
        awslocal lambda create-function \
            --function-name "$name" \
            --runtime "$LAMBDA_RUNTIME" \
            --handler "$LAMBDA_HANDLER" \
            --role "arn:aws:iam::000000000000:role/${ROLE_NAME}" \
            --zip-file "fileb://${ZIP_FILE}" \
            --region "$REGION" \
            --timeout 30 \
            --environment "Variables={IS_LOCAL=true,AWS_ENDPOINT_URL=${LOCALSTACK_ENDPOINT},SECRET_NAME=armoury/${name}/config}"
    fi

    echo "[bootstrap] Lambda deployed: ${name}"

    # -------------------------------------------------------------------------
    # Step 3c: Create REST API Gateway (only for services with restApiId)
    # -------------------------------------------------------------------------
    if [ -n "$rest_api_id" ]; then
        echo "[bootstrap] Creating API Gateway: ${rest_api_id}..."

        # Create REST API with _custom_id_ tag for deterministic ID in LocalStack
        awslocal apigateway create-rest-api \
            --name "${name}-api" \
            --region "$REGION" \
            --tags "{\"_custom_id_\":\"${rest_api_id}\"}" \
            2>/dev/null || true

        # Get the root resource ID (path == "/")
        ROOT_RESOURCE_ID=$(awslocal apigateway get-resources \
            --rest-api-id "$rest_api_id" \
            --region "$REGION" \
            --query 'items[?path==`/`].id' \
            --output text)

        # Create {proxy+} resource, fall back to existing if already present
        PROXY_RESOURCE_ID=$(awslocal apigateway create-resource \
            --rest-api-id "$rest_api_id" \
            --parent-id "$ROOT_RESOURCE_ID" \
            --path-part "{proxy+}" \
            --region "$REGION" \
            --query 'id' \
            --output text 2>/dev/null \
        || awslocal apigateway get-resources \
            --rest-api-id "$rest_api_id" \
            --region "$REGION" \
            --query 'items[?pathPart==`{proxy+}`].id' \
            --output text)

        LAMBDA_ARN="arn:aws:lambda:${REGION}:000000000000:function:${name}"
        LAMBDA_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

        # ANY method + Lambda proxy integration on {proxy+}
        awslocal apigateway put-method \
            --rest-api-id "$rest_api_id" \
            --resource-id "$PROXY_RESOURCE_ID" \
            --http-method ANY \
            --authorization-type NONE \
            --region "$REGION" \
            2>/dev/null || true

        awslocal apigateway put-integration \
            --rest-api-id "$rest_api_id" \
            --resource-id "$PROXY_RESOURCE_ID" \
            --http-method ANY \
            --type AWS_PROXY \
            --integration-http-method POST \
            --uri "$LAMBDA_URI" \
            --region "$REGION"

        # ANY method + Lambda proxy integration on root resource (/) so
        # requests without a path segment also reach the Lambda
        awslocal apigateway put-method \
            --rest-api-id "$rest_api_id" \
            --resource-id "$ROOT_RESOURCE_ID" \
            --http-method ANY \
            --authorization-type NONE \
            --region "$REGION" \
            2>/dev/null || true

        awslocal apigateway put-integration \
            --rest-api-id "$rest_api_id" \
            --resource-id "$ROOT_RESOURCE_ID" \
            --http-method ANY \
            --type AWS_PROXY \
            --integration-http-method POST \
            --uri "$LAMBDA_URI" \
            --region "$REGION"

        # Deploy the API to the stage
        awslocal apigateway create-deployment \
            --rest-api-id "$rest_api_id" \
            --stage-name "$STAGE" \
            --region "$REGION"

        echo "[bootstrap]   → ${LOCALSTACK_ENDPOINT}/_aws/execute-api/${rest_api_id}/${STAGE}"
    fi
done

# ---------------------------------------------------------------------------
# Step 4: Generate .env.local with API Gateway URLs for app clients
# ---------------------------------------------------------------------------
ENV_LOCAL_FILE="${REPO_ROOT}/.env.local"

echo "# Generated by infra/localstack/bootstrap.sh — do not edit manually." > "$ENV_LOCAL_FILE"
echo "# Re-run 'npm run localstack:bootstrap' to regenerate." >> "$ENV_LOCAL_FILE"
echo "" >> "$ENV_LOCAL_FILE"

jq -r '
    .services[]
    | select(.restApiId != null)
    | "NEXT_PUBLIC_\(.name | ascii_upcase)_BASE_URL=http://localhost:4566/_aws/execute-api/\(.restApiId)/local"
' "$SERVICES_FILE" >> "$ENV_LOCAL_FILE"

echo "[bootstrap] Generated ${ENV_LOCAL_FILE}"

# ---------------------------------------------------------------------------
# Step 5: Summary
# ---------------------------------------------------------------------------
echo ""
echo "[bootstrap] ✓ All Lambda functions deployed."
echo "[bootstrap] API Gateway URLs:"
jq -r '.services[] | select(.restApiId != null) | "  \(.name): http://localhost:4566/_aws/execute-api/\(.restApiId)/local"' "$SERVICES_FILE"
