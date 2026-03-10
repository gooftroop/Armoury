#!/usr/bin/env bash
# infra/localstack/seed.sh
#
# Seeds AWS resources into LocalStack after startup.
# Runs in parallel where possible; total time ~2-3 seconds.
# Idempotent: create-secret || put-secret-value handles re-runs
# without errors.

set -euo pipefail

REGION="us-east-1"

# Lambdas inside LocalStack reach the host PostgreSQL containers
# via host.docker.internal. The clusterEndpoint value here is what
# gets passed to DSQLAdapter — it must resolve from inside Docker.
DSQL_ENDPOINT="host.docker.internal"

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

create_secret "armoury/campaigns/config" \
    "{\"dsqlClusterEndpoint\":\"${DSQL_ENDPOINT}\",\"dsqlRegion\":\"${REGION}\"}" &

create_secret "armoury/matches/config" \
    "{\"dsqlClusterEndpoint\":\"${DSQL_ENDPOINT}\",\"dsqlRegion\":\"${REGION}\"}" &

create_secret "armoury/friends/config" \
    "{\"dsqlClusterEndpoint\":\"${DSQL_ENDPOINT}\",\"dsqlRegion\":\"${REGION}\"}" &

create_secret "armoury/users/config" \
    "{\"dsqlClusterEndpoint\":\"${DSQL_ENDPOINT}\",\"dsqlRegion\":\"${REGION}\"}" &

wait

echo "[seed] Secrets Manager ready."
