import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Resolves the compose file for the calling service.
 *
 * Uses `process.cwd()` which vitest/turbo sets to the service workspace
 * directory (e.g. src/services/users). If no docker-compose.yml exists
 * in the cwd, the service is assumed to not need Docker (e.g. PGlite).
 */
function getServiceComposeFile(): string | null {
    const composePath = join(process.cwd(), 'docker-compose.yml');

    return existsSync(composePath) ? composePath : null;
}

/**
 * Vitest globalSetup — starts the Docker Compose container for the
 * calling service only.
 *
 * Each service's vitest.e2e.config.ts references this shared globalSetup.
 * When turbo runs `test:e2e` in parallel across services, each vitest
 * instance only starts its own container, avoiding race conditions from
 * multiple processes managing the same Docker resources.
 *
 * `--project-directory` is set to the compose file's parent so that
 * relative volume mounts (e.g. `./__fixtures__/seed.sql`) resolve
 * correctly.
 */
export async function setup(): Promise<void> {
    const composeFile = getServiceComposeFile();

    if (!composeFile) {
        console.log('[e2e] No docker-compose.yml found in cwd — skipping Docker setup.');

        return;
    }

    const projectDir = dirname(composeFile);
    const serviceName = projectDir.split('/').pop() ?? projectDir;

    console.log(`[e2e] Starting Docker for ${serviceName}...`);

    execSync(`docker compose -f "${composeFile}" --project-directory "${projectDir}" up -d --wait`, {
        cwd: projectDir,
        stdio: 'inherit',
        timeout: 120_000,
    });

    console.log(`[e2e] Docker container for ${serviceName} ready.`);
}

/**
 * Vitest globalTeardown — stops and removes the Docker Compose container
 * for the calling service. Uses `-v` to remove volumes for clean state.
 */
export async function teardown(): Promise<void> {
    const composeFile = getServiceComposeFile();

    if (!composeFile) {
        return;
    }

    const projectDir = dirname(composeFile);
    const serviceName = projectDir.split('/').pop() ?? projectDir;

    console.log(`[e2e] Stopping Docker for ${serviceName}...`);

    execSync(`docker compose -f "${composeFile}" --project-directory "${projectDir}" down -v`, {
        cwd: projectDir,
        stdio: 'inherit',
        timeout: 30_000,
    });

    console.log(`[e2e] Docker container for ${serviceName} stopped.`);
}
