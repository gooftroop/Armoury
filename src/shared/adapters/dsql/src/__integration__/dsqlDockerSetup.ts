/**
 * Vitest globalSetup/globalTeardown for DSQL adapter integration tests.
 *
 * Starts the trust-auth PostgreSQL container defined in
 * `infra/dsql-mock/docker-compose.yml` before tests run, and tears it
 * down afterwards. This container listens on port 5440 and accepts any
 * password (POSTGRES_HOST_AUTH_METHOD=trust), which lets the mocked
 * DsqlSigner token pass through without real IAM credentials.
 *
 * @requirements
 * - REQ-DSQL-DOCKER: Start dsql-mock container before integration tests
 * - REQ-DSQL-CLEANUP: Tear down container and volumes after tests complete
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const COMPOSE_REL = 'infra/dsql-mock/docker-compose.yml';

/**
 * Walk up from `startDir` until we find the repo root (identified by
 * the presence of `turbo.json`).
 */
function findRepoRoot(startDir: string): string {
    let dir = startDir;

     
    while (true) {
        if (existsSync(resolve(dir, 'turbo.json'))) {
            return dir;
        }

        const parent = resolve(dir, '..');

        if (parent === dir) {
            throw new Error('Could not find repo root (no turbo.json found in any ancestor)');
        }

        dir = parent;
    }
}

export async function setup(): Promise<void> {
    const root = findRepoRoot(process.cwd());
    const composeFile = resolve(root, COMPOSE_REL);

    console.log('[dsql-integration] Starting dsql-mock container...');

    execSync(`docker compose -f "${composeFile}" up -d --wait`, {
        cwd: root,
        stdio: 'inherit',
        timeout: 120_000,
    });

    console.log('[dsql-integration] dsql-mock container ready (port 5440).');
}

export async function teardown(): Promise<void> {
    const root = findRepoRoot(process.cwd());
    const composeFile = resolve(root, COMPOSE_REL);

    console.log('[dsql-integration] Stopping dsql-mock container...');

    execSync(`docker compose -f "${composeFile}" down -v`, {
        cwd: root,
        stdio: 'inherit',
        timeout: 30_000,
    });

    console.log('[dsql-integration] dsql-mock container stopped.');
}
