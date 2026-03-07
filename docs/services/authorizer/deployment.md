# Deployment

The authorizer service is deployed via Serverless Framework v4. It is deployed independently from the campaigns service and referenced by ARN.

## Serverless Configuration

- **Service name**: `armoury-authorizer`
- **Runtime**: `nodejs22.x`
- **Memory**: 128 MB
- **Timeout**: 10 seconds
- **Architecture**: ARM64 (Graviton2)
- **Bundler**: esbuild (SFv4 native, ES2022 target, ESM format)
- **External packages**: `@aws-sdk/client-secrets-manager` (provided by Lambda runtime)

## CI/CD Workflows

### authorizer.yml

Triggers on push to main or pull requests targeting main (scoped to `src/services/authorizer/**`).

**Jobs**:

1. **ci**: Checkout, Node 24, `npm ci`, typecheck, lint, format check, test
2. **deploy-sandbox** (PR only): Deploys stage `pr-<number>`
3. **deploy-production** (main push only): Deploys stage `production`

### authorizer-cleanup.yml

Triggers when a PR is closed. Removes the sandbox stage.

## IAM Permissions

The Lambda function is granted `secretsmanager:GetSecretValue` to fetch Auth0 configuration from AWS Secrets Manager.

## SSM Parameter Output

The deployment creates an SSM Parameter at `/armoury/{stage}/authorizer-arn` containing the Lambda function ARN. This is used by the campaigns service for cross-stack reference.

## Prerequisites

Before deploying, ensure the following exist in AWS:

1. **Secrets Manager secret** named `armoury/{stage}/authorizer` containing JSON:
    ```json
    {
        "auth0Domain": "myapp.auth0.com",
        "auth0Audience": "https://api.myapp.com"
    }
    ```

## Required GitHub Secrets

| Secret                  | Description        |
| ----------------------- | ------------------ |
| `AWS_ACCESS_KEY_ID`     | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |

## Deployment Order

The authorizer must be deployed before the campaigns service (for production), since the campaigns service reads the authorizer's ARN from SSM. Deploy order:

1. Deploy `armoury-authorizer` (creates SSM parameter with Lambda ARN)
2. Deploy `armoury-campaigns` (reads SSM parameter for authorizer reference)
