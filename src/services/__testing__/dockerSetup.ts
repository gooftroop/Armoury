import { execSync } from 'child_process';
import { resolve } from 'path';

const COMPOSE_FILE = 'docker-compose.e2e.yml';

/**
 * Resolves the monorepo root directory (where docker-compose.e2e.yml lives).
 * Walks up from the current file until it finds the compose file.
 */
function getRepoRoot(): string {
    let dir = resolve(import.meta.dirname ?? __dirname);

    // Walk up to find the repo root (max 10 levels)
    for (let i = 0; i < 10; i++) {
        try {
            execSync(`test -f ${resolve(dir, COMPOSE_FILE)}`, { stdio: 'ignore' });

            return dir;
        } catch {
            dir = resolve(dir, '..');
        }
    }

    throw new Error(`Could not find ${COMPOSE_FILE} in any parent directory`);
}

/**
 * Vitest globalSetup — starts Docker Compose e2e containers before all tests.
 * Uses `--wait` flag to block until all healthchecks pass.
 */
export async function setup(): Promise<void> {
    const cwd = getRepoRoot();

    console.log('[e2e] Starting Docker containers...');

    execSync(`docker compose -f ${COMPOSE_FILE} up -d --wait`, {
        cwd,
        stdio: 'inherit',
        timeout: 120_000,
    });

    console.log('[e2e] Docker containers ready.');
}

/**
 * Vitest globalTeardown — stops and removes Docker Compose e2e containers.
 * Uses `-v` flag to remove volumes for clean state.
 */
export async function teardown(): Promise<void> {
    const cwd = getRepoRoot();

    console.log('[e2e] Stopping Docker containers...');

    execSync(`docker compose -f ${COMPOSE_FILE} down -v`, {
        cwd,
        stdio: 'inherit',
        timeout: 30_000,
    });

    console.log('[e2e] Docker containers stopped.');
}
