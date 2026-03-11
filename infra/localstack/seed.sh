#!/usr/bin/env bash
# infra/localstack/seed.sh
#
# Seeds AWS resources into LocalStack after startup.
# Dynamically reads service names and secret paths from services.json.
# Runs in parallel where possible; total time ~2-3 seconds.
# Idempotent: create-secret || put-secret-value handles re-runs
# without errors.

set -euo pipefail

REGION="us-east-1"

# Lambdas inside LocalStack reach the host PostgreSQL containers
# via host.docker.internal. The clusterEndpoint value here is what
# gets passed to DSQLAdapter — it must resolve from inside Docker.
DSQL_ENDPOINT="host.docker.internal"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICES_FILE="${SCRIPT_DIR}/services.json"

create_secret() {
    local name="$1"
    local value="$2"

    awslocal secretsmanager create-secret \
        --name "$name" \
        --region "$REGION" \
        --secret-string "$value" 2>/dev/null \
    || awslocal secretsmanager put-secret-value \
        --secret-id "$name" \
        --region "$REGION" \
        --secret-string "$value"
}

echo "[seed] Seeding Secrets Manager..."

# Read services from services.json and iterate over those with non-null secretPath
while IFS= read -r secret_path; do
    create_secret "$secret_path" \
        "{\"dsqlClusterEndpoint\":\"${DSQL_ENDPOINT}\",\"dsqlRegion\":\"${REGION}\"}" &
done < <(jq -r '.services[] | select(.secretPath != null) | .secretPath' "$SERVICES_FILE")

wait

echo "[seed] Secrets Manager ready."
