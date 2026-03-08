import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';

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
 * Returns an array of absolute paths.
 */
function getComposeFiles(repoRoot: string): string[] {
    const servicesDir = join(repoRoot, 'src', 'services');
    const files: string[] = [];

    for (const entry of readdirSync(servicesDir)) {
        const entryPath = join(servicesDir, entry);
        const composePath = join(entryPath, 'docker-compose.yml');

        if (statSync(entryPath).isDirectory() && existsSync(composePath)) {
            files.push(composePath);
        }
    }

    if (files.length === 0) {
        throw new Error('No docker-compose.yml files found under src/services/');
    }

    return files;
}

/**
 * Vitest globalSetup — starts Docker Compose e2e containers before all tests.
 *
 * Each service's docker-compose.yml is launched independently with
 * `--project-directory` set to its own directory. This ensures relative
 * paths (e.g. volume mounts for seed.sql) resolve correctly per-service,
 * avoiding the Docker Compose bug where multiple `-f` flags cause all
 * relative paths to resolve relative to the first file's directory.
 */
export async function setup(): Promise<void> {
    const cwd = getRepoRoot();
    const files = getComposeFiles(cwd);

    console.log(`[e2e] Starting ${files.length} Docker Compose services...`);

    for (const file of files) {
        const projectDir = dirname(file);
        const serviceName = projectDir.split('/').pop() ?? projectDir;

        console.log(`[e2e] Starting ${serviceName}...`);

        execSync(`docker compose -f "${file}" --project-directory "${projectDir}" up -d --wait`, {
            cwd,
            stdio: 'inherit',
            timeout: 120_000,
        });
    }

    console.log('[e2e] All Docker containers ready.');
}

/**
 * Vitest globalTeardown — stops and removes Docker Compose e2e containers.
 * Uses `-v` flag to remove volumes for clean state.
 */
export async function teardown(): Promise<void> {
    const cwd = getRepoRoot();
    const files = getComposeFiles(cwd);

    console.log('[e2e] Stopping Docker containers...');

    for (const file of files) {
        const projectDir = dirname(file);

        execSync(`docker compose -f "${file}" --project-directory "${projectDir}" down -v`, {
            cwd,
            stdio: 'inherit',
            timeout: 30_000,
        });
    }

    console.log('[e2e] Docker containers stopped.');
}
