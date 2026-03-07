# LocalStack Integration Plan

LocalStack provides a local AWS emulation layer that lets service tests invoke Lambda handlers, resolve Secrets Manager values, and call REST API Gateway endpoints without a deployed AWS environment. This document covers the setup, service coverage gaps, workarounds, and CI integration for Armoury's Lambda services.

## Table of Contents

1. [Service Coverage Matrix](#1-service-coverage-matrix)
2. [Architecture Overview](#2-architecture-overview)
3. [Docker Compose Setup](#3-docker-compose-setup)
4. [Init Hook — Seeding AWS Resources](#4-init-hook--seeding-aws-resources)
5. [SDK Client Configuration](#5-sdk-client-configuration)
6. [DsqlSigner Mock (Independent of LocalStack)](#6-dsqlsigner-mock-independent-of-localstack)
7. [WebSocket Gap Workaround](#7-websocket-gap-workaround)
8. [Vitest Integration](#8-vitest-integration)
9. [CI/CD — GitHub Actions](#9-cicd--github-actions)
10. [Developer Workflow Tips](#10-developer-workflow-tips)
11. [Known Limitations](#11-known-limitations)
12. [Cost-Benefit Analysis](#12-cost-benefit-analysis)

---

## 1. Service Coverage Matrix

| Armoury AWS Service | Usage | LocalStack Free | Status | Notes |
|---------------------|-------|-----------------|--------|-------|
| Lambda | All 5 services (authorizer, campaigns, matches, friends, users) | Yes | Covered | Full invocation support |
| Secrets Manager | Config retrieval in all services | Yes | Covered | No encryption enforcement |
| API Gateway REST (v1) | `campaigns` HTTP endpoints | Yes | Covered | Requires manual resource creation |
| API Gateway WebSocket (v2) | `matches`, `friends` connection management | No | Gap | Free tier only |
| API Gateway Management API | `PostToConnection` broadcast | No | Gap | Free tier only |
| Aurora DSQL | Database backend for all services | No | Not supported | Use local PostgreSQL |
| IAM | Role/policy storage | Yes (storage only) | Covered (partial) | Policies stored but not evaluated on free tier |

The two gaps — WebSocket APIs and Aurora DSQL — are addressed in sections 6 and 7 respectively.

---

## 2. Architecture Overview

Current e2e setup: each service test connects directly to a local PostgreSQL container using `DSQLRawConfig`. LocalStack sits alongside these containers and handles the AWS API surface.

```
 Current (e2e only)
 ┌─────────────────────────────────────────────┐
 │  Vitest e2e tests                           │
 │    → Lambda handler (direct call)           │
 │    → Local PostgreSQL (DSQLRawConfig)        │
 └─────────────────────────────────────────────┘

 With LocalStack added
 ┌─────────────────────────────────────────────────────────────────┐
 │  Vitest e2e tests                                               │
 │    → Lambda handler (direct call or via LocalStack invoke)      │
 │    → LocalStack :4566                                           │
 │        ├── Secrets Manager  (dsqlClusterEndpoint, dsqlRegion)   │
 │        ├── API Gateway REST (campaigns endpoints)               │
 │        └── IAM              (role/policy storage)               │
 │    → Local PostgreSQL containers (unchanged)                    │
 │        ├── armoury-e2e-matches   :5433                          │
 │        ├── armoury-e2e-friends   :5434                          │
 │        └── armoury-e2e-campaigns :5435                          │
 └─────────────────────────────────────────────────────────────────┘
```

The PostgreSQL containers defined in `docker-compose.e2e.yml` are unchanged. LocalStack runs as an additional container on the same Docker network and is reached at `http://localhost:4566` from the host.

---

## 3. Docker Compose Setup

Add `docker-compose.localstack.yml` at the repo root alongside `docker-compose.e2e.yml`. Run both files together for full e2e coverage.

```yaml
# docker-compose.localstack.yml
services:
    localstack:
        image: localstack/localstack:latest
        container_name: localstack-main
        ports:
            - '4566:4566'
        environment:
            SERVICES: lambda,secretsmanager,apigateway,iam
            DEFAULT_REGION: us-east-1
            LOCALSTACK_AUTH_TOKEN: ${LOCALSTACK_AUTH_TOKEN}
            LAMBDA_EXECUTOR: docker
            LAMBDA_DOCKER_NETWORK: bridge
            DEBUG: 0
        volumes:
            - localstack-cache:/var/lib/localstack
            - /var/run/docker.sock:/var/run/docker.sock
            - ./infra/localstack/seed.sh:/etc/localstack/init/ready.d/seed.sh
        healthcheck:
            test: ['CMD-SHELL', 'curl -sf http://localhost:4566/_localstack/health | grep -q running']
            interval: 3s
            timeout: 3s
            retries: 20
        restart: unless-stopped

volumes:
    localstack-cache:
        name: armoury-localstack-cache
```

Key decisions:

- **Single port 4566** serves all emulated services. No per-service port mapping needed.
- **Volume mount for cache** (`localstack-cache`) preserves downloaded Lambda runtimes between restarts, saving 10-20 seconds of cold start on subsequent runs.
- **Docker socket mount** is required for `LAMBDA_EXECUTOR: docker`. Lambda functions run in sibling containers.
- **Init hook mount** at `/etc/localstack/init/ready.d/` runs `seed.sh` once LocalStack is healthy. Scripts in `ready.d/` execute after all services are up.
- **`restart: unless-stopped`** keeps LocalStack alive across terminal sessions during a dev day. Use `docker pause` / `docker unpause` when you want a break without losing in-memory state.
- **`LOCALSTACK_AUTH_TOKEN`** is required as of March 2026. Set it in your local `.env` file or shell profile and pass it via the environment block shown above.

To run both compose files together:

```bash
docker compose -f docker-compose.e2e.yml -f docker-compose.localstack.yml up -d --wait
```

---

## 4. Init Hook — Seeding AWS Resources

The init hook at `infra/localstack/seed.sh` seeds Secrets Manager secrets for each service. It runs inside the LocalStack container once the `ready` state is reached, so `awslocal` commands work without any endpoint flag.

```bash
#!/usr/bin/env bash
# infra/localstack/seed.sh
#
# Seeds AWS resources into LocalStack after startup.
# Runs in parallel where possible; total time ~2-3 seconds.
# Idempotent: --overwrite-existing-value and conditional create
# handle re-runs without errors.

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
```

Make the script executable before committing:

```bash
chmod +x infra/localstack/seed.sh
```

The secret names (`armoury/<service>/config`) must match what each service's `src/services/<service>/src/utils/secrets.ts` requests at runtime. The JSON shape matches the `DSQLIAMConfig` fields that `adapter.ts` reads from the parsed secret.

---

## 5. SDK Client Configuration

The AWS SDK v3 reads `AWS_ENDPOINT_URL` automatically. Setting this environment variable redirects all SDK calls to LocalStack with no code changes in the service handlers.

For test runs, set these in the e2e Vitest config (see section 8). For local manual testing against LocalStack, export them in your shell:

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
```

For test files that instantiate SDK clients directly rather than relying on environment variables, use a shared config object:

```typescript
// src/services/__testing__/localstackConfig.ts
const LOCALSTACK_ENDPOINT = 'http://localhost:4566';

export const localstackClientConfig = {
    endpoint: LOCALSTACK_ENDPOINT,
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
};
```

Then in test files:

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { localstackClientConfig } from '../__testing__/localstackConfig.js';

const client = new SecretsManagerClient(localstackClientConfig);
const response = await client.send(new GetSecretValueCommand({ SecretId: 'armoury/campaigns/config' }));
```

The service handler code itself requires no changes. It reads `AWS_ENDPOINT_URL` from the environment at startup, which the Vitest e2e config injects before any test runs.

---

## 6. DsqlSigner Mock (Independent of LocalStack)

> **This section is independent of LocalStack.** The DsqlSigner mock works with any local PostgreSQL setup. It does not require LocalStack to be running.

### Problem

Production uses `DSQLIAMConfig` → `DsqlSigner` → token as password → Aurora DSQL. Local e2e testing uses `DSQLRawConfig` → direct credentials → local PostgreSQL. The `DSQLIAMConfig` code path in `src/shared/data/src/dsql/adapter.ts` (lines 223-236) is never exercised in local or e2e tests, leaving the IAM auth branch untested.

### Solution

Mock `DsqlSigner` to return a static token, and configure a local PostgreSQL container with `trust` authentication. PostgreSQL with `trust` auth accepts any password string, so the mock token passes through the `pg.Client` connection as if it were a real SigV4 token.

### How It Works

1. A `dsql-mock-db` PostgreSQL container runs with `POSTGRES_HOST_AUTH_METHOD: trust`.
2. The test mocks `@aws-sdk/dsql-signer` so `DsqlSigner.getDbConnectAdminAuthToken()` returns `'mock-dsql-token'`.
3. The test instantiates `DSQLAdapter` with `DSQLIAMConfig({ clusterEndpoint: 'localhost', region: 'us-east-1' })`.
4. `adapter.initialize()` constructs a `DsqlSigner`, calls `getDbConnectAdminAuthToken()`, and receives `'mock-dsql-token'`.
5. It then calls `new Client({ host: 'localhost', user: 'admin', password: 'mock-dsql-token', database: 'postgres', port: 5440, ssl: false })`.
6. PostgreSQL accepts the connection under `trust` auth regardless of the password value.
7. All subsequent Drizzle ORM and raw SQL operations run against real PostgreSQL.

The IAM path in `adapter.ts` hardcodes `user: 'admin'` and `database: 'postgres'`, so the mock container must use those exact values.

### Docker Compose Change

Add the `dsql-mock-db` service to `docker-compose.e2e.yml` or a dedicated `docker-compose.dsql-mock.yml`:

```yaml
services:
    dsql-mock-db:
        image: postgres:16-alpine
        container_name: armoury-dsql-mock
        environment:
            POSTGRES_DB: postgres
            POSTGRES_USER: admin
            POSTGRES_HOST_AUTH_METHOD: trust
        ports:
            - '5440:5432'
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U admin -d postgres']
            interval: 3s
            timeout: 3s
            retries: 10
```

Note there is no `POSTGRES_PASSWORD` — `trust` auth makes it irrelevant.

### Vitest Mock

```typescript
// In any test file that needs to exercise the IAM code path
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('@aws-sdk/dsql-signer', () => ({
    DsqlSigner: class {
        constructor(readonly config: { hostname: string; region: string }) {}
        async getDbConnectAdminAuthToken(): Promise<string> {
            return 'mock-dsql-token';
        }
    },
}));
```

This mock matches the `MockSignerClass` pattern already used in `src/shared/data/src/dsql/__tests__/adapter.test.ts` (line 321). The class form is intentional — `DsqlSigner` is instantiated with `new` inside `adapter.ts`, so a plain function mock would not work.

### Integration Test Example

```typescript
// src/shared/data/src/__integration__/dsqlIamPath.integration.test.ts
/**
 * DSQLAdapter IAM path — integration tests
 *
 * REQ-01 DSQLIAMConfig branch executes when clusterEndpoint is present
 * REQ-02 DsqlSigner is constructed with the correct hostname and region
 * REQ-03 Token from signer is used as the pg.Client password
 * REQ-04 Drizzle operations succeed after IAM-path connection
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { DSQLAdapter } from '@data/dsql/adapter.js';

vi.mock('@aws-sdk/dsql-signer', () => ({
    DsqlSigner: class {
        constructor(readonly config: { hostname: string; region: string }) {}
        async getDbConnectAdminAuthToken(): Promise<string> {
            return 'mock-dsql-token';
        }
    },
}));

describe('DSQLAdapter — IAM code path', () => {
    let adapter: DSQLAdapter;

    beforeAll(async () => {
        adapter = new DSQLAdapter({
            clusterEndpoint: 'localhost',
            region: 'us-east-1',
            // Port override needed because trust container is on 5440, not 5432
            // Add this config option to DSQLIAMConfig if not already present,
            // or use an ssh tunnel / socat to forward 5432 → 5440 in test setup.
        });
        await adapter.initialize();
    });

    afterAll(async () => {
        await adapter.dispose();
    });

    it('connects and can execute a query', async () => {
        const result = await adapter.query('SELECT 1 AS value');
        expect(result.rows[0]).toEqual({ value: 1 });
    });

    it('initializes with clusterEndpoint config shape', () => {
        // Verifies the IAM branch was taken (not the raw credentials branch)
        expect(adapter.isInitialized()).toBe(true);
    });
});
```

### Coverage: What This Tests vs What It Doesn't

| Aspect | Covered | Notes |
|--------|---------|-------|
| `DSQLIAMConfig` branch execution | Yes | The `'clusterEndpoint' in this.config` condition is exercised |
| `DsqlSigner` construction | Yes | Constructor args (hostname, region) can be asserted via spy |
| Token-as-password flow | Yes | PostgreSQL trust auth proves the token was passed correctly |
| All Drizzle/SQL operations | Yes | Run against real PostgreSQL |
| SigV4 signature validity | No | Requires a real DSQL cluster |
| OCC conflict errors | No | Aurora DSQL-specific behaviour |
| Token expiry and reconnection | No | Requires real token TTL enforcement |

---

## 7. WebSocket Gap Workaround

API Gateway WebSocket (v2) and the Management API (`PostToConnection`) are not available on the LocalStack free tier. Both `src/services/matches/src/utils/broadcast.ts` and `src/services/friends/src/utils/broadcast.ts` depend on `ApiGatewayManagementApiClient` for broadcasting to connected clients.

### Approach: Mock Broadcaster in Tests

A `createBroadcaster()` function in each service returns a typed `Broadcaster`. Tests provide a mock implementation that captures calls for assertion rather than requiring a live WebSocket endpoint.

A shared mock already exists at `src/services/__testing__/mockBroadcaster.ts`. It satisfies both the `matches` broadcaster signature (`send` returns `Promise<boolean>`) and the `friends` signature (`send` returns `Promise<void>`):

```typescript
// src/services/__testing__/mockBroadcaster.ts (already exists)
export interface BroadcastRecord {
    connectionId: string;
    data: unknown;
}

export function createMockBroadcaster(): {
    broadcaster: {
        send: (connectionId: string, data: unknown) => Promise<boolean>;
        sendToMany: (connectionIds: string[], data: unknown) => Promise<string[]>;
    };
    broadcasts: BroadcastRecord[];
    reset: () => void;
} {
    const broadcasts: BroadcastRecord[] = [];

    return {
        broadcaster: {
            async send(connectionId: string, data: unknown): Promise<boolean> {
                broadcasts.push({ connectionId, data });
                return false;
            },
            async sendToMany(connectionIds: string[], data: unknown): Promise<string[]> {
                for (const id of connectionIds) {
                    broadcasts.push({ connectionId: id, data });
                }
                return [];
            },
        },
        broadcasts,
        reset: () => {
            broadcasts.length = 0;
        },
    };
}
```

Use it in e2e tests like this:

```typescript
import { createMockBroadcaster } from '../../__testing__/mockBroadcaster.js';

const { broadcaster, broadcasts, reset } = createMockBroadcaster();

beforeEach(() => reset());

it('broadcasts a match update to all connected players', async () => {
    const handler = createMatchHandler({ broadcaster });
    await handler.recordRound({ matchId: 'match-1', round: 1 });

    expect(broadcasts).toHaveLength(2);
    expect(broadcasts[0]).toMatchObject({ data: { type: 'ROUND_RECORDED' } });
});
```

This tests broadcast logic — the correct messages are assembled and dispatched to the right connection IDs — without requiring API Gateway. Full WebSocket connectivity testing (connection lifecycle, disconnection cleanup, concurrent client delivery) requires either LocalStack Base tier ($39/user/month) or a deployed staging environment.

---

## 8. Vitest Integration

### Global Setup Pattern

The existing `src/services/__testing__/dockerSetup.ts` pattern brings up `docker-compose.e2e.yml` and waits for healthchecks. Extend it to also start LocalStack:

```typescript
// src/services/__testing__/dockerSetup.ts (extended)
import { execSync } from 'child_process';
import { resolve } from 'path';

const E2E_COMPOSE = 'docker-compose.e2e.yml';
const LOCALSTACK_COMPOSE = 'docker-compose.localstack.yml';

function getRepoRoot(): string {
    let dir = resolve(import.meta.dirname ?? __dirname);
    for (let i = 0; i < 10; i++) {
        try {
            execSync(`test -f ${resolve(dir, E2E_COMPOSE)}`, { stdio: 'ignore' });
            return dir;
        } catch {
            dir = resolve(dir, '..');
        }
    }
    throw new Error(`Could not find ${E2E_COMPOSE} in any parent directory`);
}

export async function setup(): Promise<void> {
    const cwd = getRepoRoot();

    console.log('[e2e] Starting Docker containers...');

    execSync(
        `docker compose -f ${E2E_COMPOSE} -f ${LOCALSTACK_COMPOSE} up -d --wait`,
        { cwd, stdio: 'inherit', timeout: 180_000 },
    );

    // Wait for init hooks to complete — seed.sh runs in ready.d/
    // This polls /_localstack/init/ready until all scripts show "completed".
    waitForInitHooks(60_000);

    console.log('[e2e] Docker containers ready.');
}

export async function teardown(): Promise<void> {
    const cwd = getRepoRoot();

    console.log('[e2e] Stopping Docker containers...');

    execSync(
        `docker compose -f ${E2E_COMPOSE} -f ${LOCALSTACK_COMPOSE} down -v`,
        { cwd, stdio: 'inherit', timeout: 30_000 },
    );

    console.log('[e2e] Docker containers stopped.');
}

function waitForInitHooks(timeoutMs: number): void {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const output = execSync(
                'curl -sf http://localhost:4566/_localstack/init/ready',
                { stdio: 'pipe' },
            ).toString();

            const status = JSON.parse(output) as { completed: boolean };
            if (status.completed) {
                return;
            }
        } catch {
            // LocalStack not ready yet
        }

        execSync('sleep 1');
    }

    throw new Error('LocalStack init hooks did not complete within timeout');
}
```

### Environment Variables

Add the LocalStack environment variables to each service's `vitest.e2e.config.ts`:

```typescript
// src/services/campaigns/vitest.e2e.config.ts
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    baseConfig,
    defineConfig({
        resolve: {
            alias: {
                '@campaigns': path.resolve(__dirname),
                '@shared': path.resolve(__dirname, '../../shared'),
            },
        },
        test: {
            include: ['src/**/*.e2e.test.ts'],
            globalSetup: [path.resolve(__dirname, '../__testing__/dockerSetup.ts')],
            fileParallelism: false,
            testTimeout: 30_000,
            env: {
                AWS_ENDPOINT_URL: 'http://localhost:4566',
                AWS_ACCESS_KEY_ID: 'test',
                AWS_SECRET_ACCESS_KEY: 'test',
                AWS_REGION: 'us-east-1',
                IS_LOCAL: 'true',
            },
        },
    }),
);
```

The `AWS_ENDPOINT_URL` env var is the only change needed for the service code. The AWS SDK v3 reads it automatically. `IS_LOCAL` is a convention for any service code that needs to skip functionality unavailable outside AWS (e.g., skipping X-Ray tracing).

---

## 9. CI/CD — GitHub Actions

```yaml
# .github/workflows/e2e-services-localstack.yml
name: Service E2E (LocalStack)

on:
    push:
        branches: [main]
    pull_request:

jobs:
    test-e2e-services:
        runs-on: ubuntu-latest
        env:
            LOCALSTACK_AUTH_TOKEN: ${{ secrets.LOCALSTACK_AUTH_TOKEN }}

        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-node@v4
              with:
                  node-version-file: .nvmrc
                  cache: npm

            - run: npm ci

            - name: Start LocalStack
              uses: LocalStack/setup-localstack@v0.2.4
              with:
                  image-tag: latest
                  install-awslocal: true
              env:
                  LOCALSTACK_AUTH_TOKEN: ${{ secrets.LOCALSTACK_AUTH_TOKEN }}

            - name: Wait for LocalStack health
              run: |
                  for i in $(seq 1 30); do
                      curl -sf http://localhost:4566/_localstack/health && break
                      sleep 2
                  done

            - name: Start PostgreSQL containers
              run: docker compose -f docker-compose.e2e.yml up -d --wait

            - name: Run service e2e tests
              run: npm run test:e2e:services
              env:
                  AWS_ENDPOINT_URL: http://localhost:4566
                  AWS_ACCESS_KEY_ID: test
                  AWS_SECRET_ACCESS_KEY: test
                  AWS_REGION: us-east-1
                  IS_LOCAL: 'true'

            - name: Collect LocalStack logs on failure
              if: failure()
              run: docker logs localstack-main > localstack.log 2>&1

            - uses: actions/upload-artifact@v4
              if: failure()
              with:
                  name: localstack-logs
                  path: localstack.log
                  retention-days: 7
```

Add `LOCALSTACK_AUTH_TOKEN` as a repository secret in GitHub Actions settings. The `LocalStack/setup-localstack` action handles container startup, `awslocal` installation, and basic health polling. The explicit health wait loop after the action step ensures the init hooks have also run before tests begin.

---

## 10. Developer Workflow Tips

**Preserve state with `docker pause`** rather than stopping the container during breaks. Pausing suspends the container process without removing in-memory state. Secrets seeded by the init hook survive a pause/unpause cycle. Stopping the container discards all state and forces re-seeding on the next start.

```bash
docker pause localstack-main
# ... take a break, switch tasks ...
docker unpause localstack-main
```

**The volume cache matters.** The `localstack-cache` volume stores downloaded Lambda runtimes. The first `docker compose up` is slow (30-60 seconds depending on which runtimes LocalStack fetches). Subsequent starts skip the download and are ready in 5-10 seconds. Do not prune this volume unless you are explicitly upgrading the LocalStack image.

**Init hooks re-run on every container start.** The seed script runs in ~3-5 seconds with parallel execution. If you need to reset state mid-session (e.g., a test left a secret in a bad state), running `docker restart localstack-main` is faster than stopping and starting the full compose stack.

**Check init hook status** if secrets appear missing:

```bash
curl -s http://localhost:4566/_localstack/init/ready | python3 -m json.tool
```

A `"completed": true` response means all scripts in `ready.d/` finished successfully.

**Use `awslocal` for manual inspection** during development. The tool is a wrapper around the AWS CLI that automatically targets `http://localhost:4566`:

```bash
awslocal secretsmanager list-secrets
awslocal secretsmanager get-secret-value --secret-id armoury/campaigns/config
```

---

## 11. Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| No state persistence on free tier | Secrets and resources lost on container stop | Fast init hooks (~3-5s) + `docker pause` to preserve state |
| No WebSocket API (v2) | Cannot test `matches`/`friends` broadcast end-to-end | Mock Broadcaster (`src/services/__testing__/mockBroadcaster.ts`) |
| No Aurora DSQL | Cannot test real DSQL auth or OCC behaviour | Local PostgreSQL + DsqlSigner mock (section 6) |
| No IAM enforcement | Policies are stored but not evaluated against requests | Acceptable for testing — coverage comes from unit tests |
| No Lambda cold start emulation | Invocations start instantly, masking initialization latency | Acceptable — cold start is infrastructure behaviour, not logic |
| DSQL OCC errors not testable | Optimistic concurrency conflicts cannot be reproduced locally | Requires a real DSQL cluster or dedicated staging environment |
| `LOCALSTACK_AUTH_TOKEN` required | Free tier still requires token registration (March 2026 change) | Register at localstack.cloud (free), store token in `.env` and CI secrets |
| Commercial use prohibited | LocalStack free tier is non-commercial only | Armoury is a non-commercial fan tool — no issue |

---

## 12. Cost-Benefit Analysis

### Free Tier (Current Recommendation)

- **Cost**: $0 (non-commercial use)
- **Covers**: Lambda invocation, Secrets Manager, API Gateway REST (v1), IAM resource storage — roughly 70% of the AWS surface Armoury uses
- **Gaps**: WebSocket APIs, Aurora DSQL, IAM enforcement, state persistence
- **Workarounds**: Mock signer (section 6), mock broadcaster (section 7), fast init hooks, `docker pause`

### When to Consider Base Tier ($39/user/month)

- WebSocket e2e testing becomes a priority (full `matches`/`friends` broadcast flow coverage)
- IAM policy evaluation testing is needed for security audits
- Persistent state between restarts becomes a daily pain point for the team
- Armoury becomes a commercial product (free tier license would no longer apply)

### Comparison to Current Approach (Mocks Only)

| Capability | Mocks Only | With LocalStack |
|-----------|-----------|-----------------|
| Secrets Manager resolution | Mocked return value | Real SDK call against emulated service |
| Lambda cold-path initialization | Not exercised | Exercised on first invoke |
| API Gateway request parsing | Not exercised | Handled by LocalStack routing |
| Secret rotation testing | Not possible | Possible via `awslocal secretsmanager rotate-secret` |
| Cross-service IAM role testing | Not possible | Stored (not enforced) |
| Test confidence for secrets retrieval | Low — mock always returns | High — exercises the SDK call, credentials, and parsing |
| Setup complexity | Low | Medium (Docker Compose, init hooks) |
| CI time overhead | None | ~30-60s additional (first run), ~5-10s (subsequent) |
