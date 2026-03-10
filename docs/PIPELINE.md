# CI/CD Pipeline

## Overview

Every pull request gets its own isolated PostgreSQL schema in the Aurora DSQL sandbox cluster. This means migrations and Lambda deploys for PR #42 write to schema `pr_42` and never touch another PR's data. On merge, production deploys to the `public` schema. On PR close, the sandbox stage and schema are torn down.

## Prerequisites

### GitHub Environment Variables

Set these in your GitHub repository's **Environments** settings (Settings > Environments).

| Variable                 | Environment         | Description                                                                                                                         | Example                        |
| ------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `DEPLOY_ENABLED`         | sandbox, production | Gate flag. Must be `'true'` for any deploy job to run.                                                                              | `true`                         |
| `DSQL_CLUSTER_ENDPOINT`  | sandbox             | Aurora DSQL cluster endpoint hostname. Fetched from SSM Parameter Store (`/armoury/sandbox/{service}/dsql-cluster-endpoint`) during the deploy job — not stored as a GitHub Environment variable. Used by `dbSchema.ts` for schema operations. | `abc123.dsql.us-east-1.on.aws` |
| `AWS_REGION`             | sandbox, production | AWS region. Also used as `DSQL_REGION` during schema operations.                                                                    | `us-east-1`                    |
| `DOMAIN_NAME`            | production          | Custom domain name for API Gateway.                                                                                                 | `api.armoury.example.com`      |
| `ROUTE53_HOSTED_ZONE_ID` | production          | Route 53 hosted zone ID for custom domain DNS.                                                                                      | `Z1D633PJN98FT9`               |

### AWS Secrets Manager Secrets

These secrets must exist in AWS Secrets Manager before deploying. Production Lambda functions read them at runtime via `SECRET_NAME`. Sandbox deploys use the shared `armoury/sandbox` secret.

> **Note:** DSQL cluster endpoints are the source of truth in SSM Parameter Store (provisioned by CDK at `/armoury/{env}/{service}/dsql-cluster-endpoint`). Secrets Manager stores runtime credentials that Lambda reads at startup. For sandbox schema operations (create/drop), the pipeline fetches `DSQL_CLUSTER_ENDPOINT` directly from SSM during the deploy/cleanup job — not from GitHub Environment variables or Secrets Manager.

| Secret Name                     | Used By                        | Expected JSON Structure                               |
| ------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `armoury/sandbox`               | All sandbox Lambda instances   | `{"dsqlClusterEndpoint": "...", "dsqlRegion": "..."}` |
| `armoury/production/campaigns`  | Campaigns Lambda (production)  | `{"dsqlClusterEndpoint": "...", "dsqlRegion": "..."}` |
| `armoury/production/users`      | Users Lambda (production)      | `{"dsqlClusterEndpoint": "...", "dsqlRegion": "..."}` |
| `armoury/production/friends`    | Friends Lambda (production)    | `{"dsqlClusterEndpoint": "...", "dsqlRegion": "..."}` |
| `armoury/production/matches`    | Matches Lambda (production)    | `{"dsqlClusterEndpoint": "...", "dsqlRegion": "..."}` |
| `armoury/production/authorizer` | Authorizer Lambda (production) | Auth-specific secrets (no DSQL fields)                |

### GitHub Secrets

Set these in Settings > Secrets and variables > Actions.

| Secret                | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `ACM_CERTIFICATE_ARN` | ACM certificate ARN for custom domain TLS (production only) |

> **Note:** AWS credentials currently use static access keys (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) stored as GitHub repository secrets. Migration to OIDC federation (`role-to-assume` with `permissions: id-token: write`) is planned but not yet implemented. When OIDC is adopted, the `CDK_DEPLOY_ROLE_ARN` variable will be configured per-environment (Settings > Environments).

## Pipeline Architecture

The pipeline uses three reusable workflow files in `.github/workflows/`:

**`_deploy-service.yml`** handles the full deploy lifecycle for a single service. It defines three jobs: `ci` (typecheck, lint, format, test), `deploy-sandbox` (runs on pull requests), and `deploy-production` (runs on push to `main`). Both deploy jobs depend on `ci` passing first.

**`_cleanup-service.yml`** tears down a sandbox stage when a PR closes. It drops the PR's database schema (if the service has migrations) and removes the Serverless stage.

**Service workflows** (e.g., `campaigns.yml`, `campaigns-cleanup.yml`) are thin callers that pass service-specific inputs to the reusables:

```yaml
# campaigns.yml
jobs:
    deploy:
        uses: ./.github/workflows/_deploy-service.yml
        with:
            service-name: '@armoury/campaigns'
            working-directory: src/services/campaigns
            needs-shared-build: true
            has-migrations: true
        secrets: inherit
```

```yaml
# campaigns-cleanup.yml
on:
    pull_request:
        types: [closed]
        branches: [main]
        paths:
            - 'src/services/campaigns/**'
            - 'src/shared/**'
jobs:
    cleanup:
        uses: ./.github/workflows/_cleanup-service.yml
        with:
            working-directory: src/services/campaigns
            has-migrations: true
        secrets: inherit
```

## Per-PR Schema Isolation

### How It Works

When a PR opens, the pipeline creates a dedicated PostgreSQL schema named `pr_<number>` in the sandbox DSQL cluster. Migrations run against that schema. The deployed Lambda receives `DB_SCHEMA=pr_<number>` as an environment variable and scopes every database connection to that schema via PostgreSQL's `search_path`. When the PR closes, the schema is dropped and the Serverless stage is removed.

### Schema Naming Convention

PR schemas follow the pattern `pr_<github PR number>` (e.g., `pr_42`, `pr_137`). The `dbSchema.ts` tool validates schema names against `/^[a-z][a-z0-9_]*$/` with a 63-character maximum. Dropping the `public` schema is explicitly refused.

### Runtime Schema Selection

`DSQLAdapter.initialize()` reads `process.env['DB_SCHEMA']` and passes it as a PostgreSQL connection option:

```typescript
const dbSchema = process.env['DB_SCHEMA'];
client = new Client({
    host: this.config.clusterEndpoint,
    user: 'admin',
    password: token,
    database: 'postgres',
    port: this.config.port ?? 5432,
    ssl: this.config.ssl ?? true,
    ...(dbSchema ? { options: `-c search_path=${dbSchema}` } : {}),
});
```

This applies to both IAM token auth and raw credential branches. If `DB_SCHEMA` is absent, PostgreSQL uses the connection's default `search_path`, which resolves to `public`.

### DSQL Config Resolution Order

`dbSchema.ts` and `DSQLAdapter` both resolve DSQL connection config in this order:

1. Check `DSQL_CLUSTER_ENDPOINT` and `DSQL_REGION` environment variables (set by the deploy workflow after fetching from SSM Parameter Store).
2. If those are absent and a `SECRET_NAME` is provided, fetch the secret from AWS Secrets Manager (production runtime path).

Sandbox deploys always have `DSQL_CLUSTER_ENDPOINT` and `DSQL_REGION` set by the deploy workflow (fetched from SSM at `/armoury/sandbox/{service}/dsql-cluster-endpoint`), so they never need Secrets Manager for schema operations. Production Lambdas omit those env vars and use `SECRET_NAME` to read credentials from Secrets Manager at runtime.

## Sandbox Deploy Flow

Triggered by any pull request event.

1. **CI** runs typecheck, lint, format check, and tests for the service.
2. If `has-migrations` is true: create the PR schema.
    ```sh
    node --import=tsx src/services/__testing__/dbSchema.ts create "pr_42"
    # env: DSQL_CLUSTER_ENDPOINT, DSQL_REGION set from GitHub vars
    ```
3. If `has-migrations` is true: generate `DATABASE_URL` for the PR schema.
    ```sh
    DATABASE_URL=$(node --import=tsx src/services/__testing__/dbSchema.ts url "pr_42")
    # outputs: postgresql://...?options=-c search_path=pr_42
    ```
4. Run migrations with the generated URL.
    ```sh
    npm run db:migrate -w @armoury/campaigns
    # DATABASE_URL from step 3 is set in env
    ```
5. Deploy the Serverless stage for this PR, passing `SECRET_NAME` and `DB_SCHEMA`.
    ```sh
    # env: SECRET_NAME=armoury/sandbox, DB_SCHEMA=pr_42
    serverless deploy --stage pr-42
    ```
6. The Lambda reads `SECRET_NAME=armoury/sandbox` at startup to fetch DSQL credentials, and reads `DB_SCHEMA=pr_42` to scope connections to the PR schema.

## Production Deploy Flow

Triggered by a push to `main`.

1. **CI** runs typecheck, lint, format check, and tests.
2. If `has-migrations` is true: generate `DATABASE_URL` for the `public` schema using the production secret.
    ```sh
    SERVICE_SHORT_NAME=$(basename "src/services/campaigns")  # → "campaigns"
    DATABASE_URL=$(node --import=tsx src/services/__testing__/dbSchema.ts url "public" "armoury/production/campaigns")
    # DSQL_CLUSTER_ENDPOINT is not set, so dbSchema.ts fetches credentials from Secrets Manager
    ```
3. Run migrations against the `public` schema.
    ```sh
    npm run db:migrate -w @armoury/campaigns
    # DATABASE_URL from step 2 is set in env
    ```
4. Deploy to the production stage. No `SECRET_NAME` override is set, so `serverless.yml` falls back to `armoury/production/campaigns`. No `DB_SCHEMA` override is set, so Lambda defaults to `public`.
    ```sh
    serverless deploy --stage production
    ```

## Cleanup Flow

Triggered when a pull request targeting `main` is closed.

1. Drop the PR schema from the sandbox DSQL cluster.
    ```sh
    node --import=tsx src/services/__testing__/dbSchema.ts drop "pr_42"
    # env: DSQL_CLUSTER_ENDPOINT, DSQL_REGION set from GitHub vars
    ```
2. Remove the Serverless stage.
    ```sh
    serverless remove --stage pr-42
    ```

Both steps run only if `DEPLOY_ENABLED == 'true'`. The schema drop step runs only if `has-migrations` is true.

## dbSchema.ts CLI Reference

**Location:** `src/services/__testing__/dbSchema.ts`

**Usage:**

```sh
node --import=tsx src/services/__testing__/dbSchema.ts <command> <SCHEMA_NAME> [SECRET_NAME]
```

**Commands:**

| Command  | Description                                                                              |
| -------- | ---------------------------------------------------------------------------------------- |
| `create` | Runs `CREATE SCHEMA IF NOT EXISTS <SCHEMA_NAME>`                                         |
| `drop`   | Runs `DROP SCHEMA IF EXISTS <SCHEMA_NAME> CASCADE`. Refuses to drop `public`.            |
| `url`    | Outputs a `postgresql://` connection URL with `search_path=<SCHEMA_NAME>` in the options |

**Environment variables:**

| Variable                | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `DSQL_CLUSTER_ENDPOINT` | Aurora DSQL cluster hostname. Checked first for config resolution.          |
| `DSQL_REGION`           | AWS region for the DSQL cluster. Checked alongside `DSQL_CLUSTER_ENDPOINT`. |

The `SECRET_NAME` argument is optional. Supply it only when `DSQL_CLUSTER_ENDPOINT` is not set and the tool should fetch credentials from Secrets Manager (production migrations).

## Service Configuration

Each service's `serverless.yml` declares `SECRET_NAME` and `DB_SCHEMA` with fallback defaults:

```yaml
provider:
    environment:
        SECRET_NAME: ${env:SECRET_NAME, 'armoury/${self:provider.stage}/<service>'}
        DB_SCHEMA: ${env:DB_SCHEMA, 'public'}
```

- **Sandbox deploy** sets `SECRET_NAME=armoury/sandbox` in the deploy step's env, overriding the default. Sets `DB_SCHEMA=pr_<number>`.
- **Production deploy** sets neither. `SECRET_NAME` falls back to `armoury/production/<service>`. `DB_SCHEMA` defaults to `public`.

Services using this pattern:

| Service    | Has DB_SCHEMA | Notes                                                |
| ---------- | ------------- | ---------------------------------------------------- |
| campaigns  | Yes           | `has-migrations: true`                               |
| users      | Yes           | `has-migrations: true`                               |
| friends    | Yes           | `has-migrations: true`                               |
| matches    | Yes           | `has-migrations: true`                               |
| authorizer | No            | Doesn't connect to DSQL directly; `SECRET_NAME` only |

## Adding a New Service

1. Create `serverless.yml` with `SECRET_NAME` and `DB_SCHEMA` environment variable patterns as shown above. Omit `DB_SCHEMA` if the service doesn't use DSQL.
2. Create a service workflow (e.g., `myservice.yml`) that calls `_deploy-service.yml`. Pass `has-migrations: true` if the service has a `db:migrate` script.
3. Create a cleanup workflow (e.g., `myservice-cleanup.yml`) that calls `_cleanup-service.yml`. Pass `has-migrations: true` if the service has migrations.
4. Add a `db:migrate` script to the service's `package.json` if it has migrations.
5. Read `DB_SCHEMA` at runtime through `DSQLAdapter` — the adapter handles `search_path` injection automatically.
6. Create the corresponding AWS Secrets Manager secret: `armoury/production/<service>` with `dsqlClusterEndpoint` and `dsqlRegion` fields (if using DSQL).

## CDK Infrastructure

Aurora DSQL clusters are provisioned via AWS CDK, not by the service pipelines. CDK manages the long-lived database infrastructure that all services share.

### Project Location

```
infra/cdk/
├── bin/app.ts              → CDK app entry point
├── lib/
│   ├── dsql-cluster.ts     → Reusable L3 DSQL Construct (grant helpers, removal policy)
│   └── dsql-stack.ts       → Deployment stack (one per environment)
├── cdk.json                → App config and environment context
├── package.json            → CDK dependencies
└── tsconfig.json           → TypeScript config
```

### Architecture

The CDK code follows a Construct-over-Stack pattern:

- **`DsqlCluster`** (L3 Construct) — Reusable, testable unit. Wraps the L1 `dsql.CfnCluster` with typed properties (`clusterIdentifier`, `clusterEndpoint`, `clusterArn`), `grantConnect()` / `grantConnectAdmin()` IAM helpers, and CDK removal-policy-to-deletion-protection mapping.
- **`DsqlStack`** (Stack) — Thin deployment unit. Instantiates `DsqlCluster`, creates an IAM role for Lambda, calls `cluster.grantConnectAdmin(lambdaRole)`, and publishes CloudFormation outputs.

### What CDK Provisions

Per environment (sandbox, production):

- **Aurora DSQL Cluster** — One cluster per environment. All services share the same cluster; isolation is by schema (`pr_<number>` for sandboxes, `public` for production).
- **IAM Role** — `armoury-<env>-lambda-dsql` with `dsql:DbConnectAdmin` permission scoped to that cluster via the `DsqlCluster.grantConnectAdmin()` helper. Lambda functions assume this role for IAM-based database authentication.

### Stack Naming

| Environment | Stack Name                | Deletion Protection          |
| ----------- | ------------------------- | ---------------------------- |
| sandbox     | `Armoury-Dsql-Sandbox`    | No (`RemovalPolicy.DESTROY`) |
| production  | `Armoury-Dsql-Production` | Yes (`RemovalPolicy.RETAIN`) |

### Environment Configuration

Stack parameters are defined in `infra/cdk/cdk.json` under the `armoury:environments` context key:

```json
{
    "context": {
        "armoury:environments": {
            "sandbox": {
                "region": "us-east-1"
            },
            "production": {
                "region": "us-east-1"
            }
        }
    }
}
```

Deletion protection is derived from the environment name — `production` maps to `RemovalPolicy.RETAIN` (deletion protection enabled), all others map to `RemovalPolicy.DESTROY`. This is not configurable in `cdk.json`.

### Stack Outputs

Each stack exports four values:

| Output              | Export Name                          | Description                                          |
| ------------------- | ------------------------------------ | ---------------------------------------------------- |
| `ClusterIdentifier` | `armoury-<env>-dsql-cluster-id`      | DSQL cluster ID                                      |
| `ClusterEndpoint`   | `armoury-<env>-dsql-endpoint`        | Full endpoint hostname (`<id>.dsql.<region>.on.aws`) |
| `ClusterArn`        | `armoury-<env>-dsql-cluster-arn`     | Cluster ARN (used in IAM policies)                   |
| `LambdaDsqlRoleArn` | `armoury-<env>-lambda-dsql-role-arn` | IAM role ARN for Lambda DSQL access                  |

### GitHub OIDC Setup

The CDK workflow authenticates to AWS using OpenID Connect (OIDC) federation — no static access keys are stored in GitHub. This requires a one-time IAM setup in the AWS account:

1. **Create an OIDC identity provider** for `token.actions.githubusercontent.com` in IAM.
2. **Create an IAM role** (`armoury-github-cdk-deploy` or similar) that trusts the GitHub OIDC provider, scoped to your repository:
    ```json
    {
        "Effect": "Allow",
        "Principal": {
            "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
            "StringEquals": {
                "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
            },
            "StringLike": {
                "token.actions.githubusercontent.com:sub": "repo:<OWNER>/<REPO>:*"
            }
        }
    }
    ```
3. **Attach permissions** to the role: CloudFormation, DSQL, IAM, and `sts:AssumeRole` for CDK bootstrap roles.
4. **Set `CDK_DEPLOY_ROLE_ARN`** as an environment variable in GitHub Environments (Settings > Environments > sandbox/production) — not as a repository secret.

### CI/CD Workflow

CDK changes are handled by `.github/workflows/infra.yml`. The workflow triggers **only** when files under `infra/cdk/**` change (or via manual dispatch).

| Trigger             | Job      | Action                                                                             |
| ------------------- | -------- | ---------------------------------------------------------------------------------- |
| Pull request        | `diff`   | `cdk diff --all` — posts the diff as a PR comment (find-and-update, no spam)       |
| Push to `main`      | `deploy` | `cdk deploy` — deploys stacks to production (requires GitHub Environment approval) |
| `workflow_dispatch` | `deploy` | Manual deploy — choose `all`, `sandbox`, or `production`                           |

**Security features:**

- OIDC authentication via `aws-actions/configure-aws-credentials@v4` (no static keys).
- Minimal job-level permissions (`contents: read`, `id-token: write`, `pull-requests: write` for diff only).
- Concurrency group `infra-cdk-${{ github.ref }}` with `cancel-in-progress: false` (never abort a running deploy).
- Timeout: 15 min for diff, 30 min for deploy.
- `NODE_OPTIONS: --max-old-space-size=4096` for large CDK apps.

**Deployment ordering:** CDK changes should be merged independently of service changes. If both change in the same commit, CDK and service workflows run in parallel — this is safe because the infrastructure already exists from a prior deploy. For the initial bootstrap or breaking infrastructure changes, merge CDK first.

### Running CDK Locally

```sh
cd infra/cdk
npm ci

# Preview changes
npx cdk diff --all

# Synthesize CloudFormation templates (no deploy)
npx cdk synth

# Deploy both stacks
npx cdk deploy --all

# Deploy a single stack
npx cdk deploy Armoury-Dsql-Sandbox

# Destroy (sandbox only — production has deletion protection)
npx cdk destroy Armoury-Dsql-Sandbox
```

Requires AWS credentials with permissions for CloudFormation, DSQL, and IAM. The CDK bootstrap stack must exist in the target account/region (`npx cdk bootstrap` on first use).

### Relationship to Service Pipelines

CDK provisions the **cluster**. Service pipelines provision the **schemas and Lambdas**.

```
CDK (infra/cdk/)                    Service Pipeline (_deploy-service.yml)
─────────────────                   ─────────────────────────────────────
DSQL Cluster (long-lived)     →     Schema creation (pr_N / public)
IAM Role (long-lived)         →     Lambda deploy with SECRET_NAME + DB_SCHEMA
```

Services never create or destroy DSQL clusters. They only create/drop schemas within the existing cluster.
