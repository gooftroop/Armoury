# Deployment

The campaigns service is deployed via Serverless Framework v4 with esbuild bundling. CI/CD is handled by GitHub Actions with per-PR sandbox stages and production deployment on main.

## Serverless Configuration

- **Service name**: `armoury-campaigns`
- **Runtime**: `nodejs22.x`
- **Memory**: 256 MB
- **Timeout**: 29 seconds
- **Bundler**: esbuild (SFv4 native, ES2022 target, ESM format)
- **Architecture**: ARM64 (Graviton2)
- **External packages**: `@aws-sdk/dsql-signer`, `@aws-sdk/client-secrets-manager`, `pg` (excluded from bundle, provided by Lambda runtime)

## IAM Permissions

The Lambda function is granted:

- `dsql:DbConnectAdmin` -- generate IAM auth tokens for Aurora DSQL database connections
- `secretsmanager:GetSecretValue` -- fetch service configuration from AWS Secrets Manager

## API Gateway

The service uses REST API (not HTTP API) with proxy integration. Four route patterns are configured:

- `/campaigns` (ANY)
- `/campaigns/{id}` (ANY)
- `/campaigns/{id}/participants` (ANY)
- `/campaigns/{id}/participants/{pid}` (ANY)

Sandbox stages have no authorizer configured (not publicly accessible). Production stages use a TOKEN authorizer referenced via SSM parameter (`/armoury/production/authorizer-arn`).

## Environment Variables

| Variable      | Source         | Description                                               |
| ------------- | -------------- | --------------------------------------------------------- |
| `SECRET_NAME` | serverless.yml | Secrets Manager secret name (`armoury/{stage}/campaigns`) |

All sensitive configuration (DSQL cluster endpoint, region) is stored in AWS Secrets Manager and fetched at Lambda cold start. No secrets are passed as environment variables.

## CI/CD Workflows

### campaigns.yml

Triggers on push to main or pull requests targeting main (scoped to `src/services/campaigns/**` and `src/shared/**`).

**Jobs**:

1. **ci**: Checkout, Node 24, `npm ci`, build shared, typecheck, lint, format check, test
2. **deploy-sandbox** (PR only): Deploys stage `pr-<number>` to sandbox environment
3. **deploy-production** (main push only): Deploys stage `production`

### campaigns-cleanup.yml

Triggers when a PR is closed. Runs `serverless remove --stage pr-<number>` to tear down the sandbox environment.

## Manual Deployment

```bash
# From src/services/campaigns/
npx serverless deploy --stage dev --region us-east-1
```

## Prerequisites

Before deploying, ensure the following exist in AWS:

1. **Secrets Manager secret** named `armoury/{stage}/campaigns` containing JSON:
    ```json
    {
        "dsqlClusterEndpoint": "your-cluster.dsql.us-east-1.on.aws",
        "dsqlRegion": "us-east-1"
    }
    ```
2. **Aurora DSQL cluster** accessible from the Lambda execution role

## Required GitHub Secrets

| Secret                  | Description        |
| ----------------------- | ------------------ |
| `AWS_ACCESS_KEY_ID`     | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
