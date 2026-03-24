/**
 * Docker Compose lifecycle for E2E tests that only need a per-service
 * database container — no LocalStack dependency.
 *
 * Identical to dockerSetup.ts but skips the LocalStack singleton startup.
 * Use this for services that only need PostgreSQL / PGlite and do not
 * interact with AWS services.
 *
 * @requirements
 * - REQ-DOCKER-DB-ONLY: Start only the per-service DB container, skip LocalStack
 * - REQ-DOCKER-DISCOVERY: Compose file resolved from the service workspace cwd
 * - REQ-DOCKER-OPTIONAL: Services without docker-compose.yml skip Docker setup gracefully
 * - REQ-DOCKER-CLEANUP: Teardown removes containers and volumes for clean state
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname, basename } from 'path';

/**
 * Resolves the compose file for the calling service.
 *
 * Uses `process.cwd()` which vitest/turbo sets to the service workspace
 * directory (e.g. src/shared/data/dao). If no docker-compose.yml exists
 * in the cwd, the service is assumed to not need Docker.
 */
function getServiceComposeFile(): string | null {
    const composePath = join(process.cwd(), 'docker-compose.yml');

    return existsSync(composePath) ? composePath : null;
}

/**
 * Vitest globalSetup — starts only the per-service Docker container.
 * Does NOT start or depend on LocalStack.
 */
export async function setup(): Promise<void> {
    const composeFile = getServiceComposeFile();

    if (!composeFile) {
        console.log('[e2e] No docker-compose.yml found in cwd — skipping per-service Docker setup.');

        return;
    }

    const projectDir = dirname(composeFile);
    const serviceName = basename(projectDir);

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
    const serviceName = basename(projectDir);

    console.log(`[e2e] Stopping Docker for ${serviceName}...`);

    execSync(`docker compose -f "${composeFile}" --project-directory "${projectDir}" down -v`, {
        cwd: projectDir,
        stdio: 'inherit',
        timeout: 30_000,
    });

    console.log(`[e2e] Docker container for ${serviceName} stopped.`);
}
