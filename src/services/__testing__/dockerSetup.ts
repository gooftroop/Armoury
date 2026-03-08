import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

/**
 * Resolves the monorepo root directory (contains turbo.json).
 * Walks up from the current file until it finds the marker.
 */
function getRepoRoot(): string {
    let dir = resolve(import.meta.dirname ?? __dirname);

    for (let i = 0; i < 10; i++) {
        if (existsSync(join(dir, 'turbo.json'))) {
            return dir;
        }

        dir = resolve(dir, '..');
    }

    throw new Error('Could not find monorepo root (turbo.json) in any parent directory');
}

/**
 * Discovers all per-service docker-compose.yml files under src/services/.
 * Returns the `-f` flags for `docker compose` to merge them all.
 */
function getComposeFlags(repoRoot: string): string {
    const servicesDir = join(repoRoot, 'src', 'services');
    const flags: string[] = [];

    for (const entry of readdirSync(servicesDir)) {
        const composePath = join(servicesDir, entry, 'docker-compose.yml');

        if (statSync(join(servicesDir, entry)).isDirectory() && existsSync(composePath)) {
            flags.push(`-f ${composePath}`);
        }
    }

    if (flags.length === 0) {
        throw new Error('No docker-compose.yml files found under src/services/');
    }

    return flags.join(' ');
}

/**
 * Vitest globalSetup — starts Docker Compose e2e containers before all tests.
 * Dynamically discovers per-service compose files so adding a new service
 * automatically includes it in the e2e environment.
 */
export async function setup(): Promise<void> {
    const cwd = getRepoRoot();
    const flags = getComposeFlags(cwd);

    console.log('[e2e] Starting Docker containers...');

    execSync(`docker compose ${flags} up -d --wait`, {
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
    const flags = getComposeFlags(cwd);

    console.log('[e2e] Stopping Docker containers...');

    execSync(`docker compose ${flags} down -v`, {
        cwd,
        stdio: 'inherit',
        timeout: 30_000,
    });

    console.log('[e2e] Docker containers stopped.');
}
