/**
 * Shared Docker Compose lifecycle for E2E integration tests.
 *
 * Provides Vitest globalSetup/globalTeardown hooks that start and stop
 * the Docker Compose container for the calling service. Each service's
 * vitest.e2e.config.ts references these hooks so that turbo can run
 * `test:e2e` in parallel without race conditions.
 *
 * @requirements
 * - REQ-DOCKER-ISOLATION: Each service starts only its own Docker container
 * - REQ-DOCKER-DISCOVERY: Compose file resolved from the service workspace cwd
 * - REQ-DOCKER-OPTIONAL: Services without docker-compose.yml skip Docker setup gracefully
 * - REQ-DOCKER-CLEANUP: Teardown removes containers and volumes for clean state
 * - REQ-CROSS-PLATFORM: Path handling must work on both Unix and Windows
 * - REQ-DOCKER-SETUP: Shared globalSetup for all service e2e tests
 * - REQ-LOCALSTACK-SINGLETON: Start LocalStack once, skip if already running (turbo parallelism)
 * - REQ-LOCALSTACK-WAIT: Poll until LocalStack init hooks complete before proceeding
 * - REQ-PER-SERVICE-DB: Start each service's DB container independently via process.cwd()
 * - REQ-TEARDOWN-SCOPE: Only tear down per-service DB; leave LocalStack running for dev workflow
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { fileURLToPath } from 'url';

/** Name assigned to the LocalStack container via infra/localstack/docker-compose.yml. */
const LOCALSTACK_CONTAINER = 'localstack-main';

/** LocalStack health endpoint. */
const LOCALSTACK_HEALTH_URL = 'http://localhost:4566/_localstack/health';

/** Maximum time (ms) to wait for LocalStack to become healthy and complete init hooks. */
const LOCALSTACK_STARTUP_TIMEOUT = 120_000;

/** Polling interval (ms) when waiting for LocalStack health/init. */
const POLL_INTERVAL = 2_000;

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
 * Finds the monorepo root by walking up from this file's directory
 * until `infra/localstack/docker-compose.yml` is found.
 *
 * @returns Absolute path to the repo root, or `null` if not found.
 */
function findRepoRoot(): string | null {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    let dir = resolve(__dirname);

    // Walk up at most 10 levels to avoid infinite loop on misconfigured systems.
    for (let i = 0; i < 10; i++) {
        if (existsSync(join(dir, 'infra', 'localstack', 'docker-compose.yml'))) {
            return dir;
        }

        const parent = dirname(dir);

        if (parent === dir) {
            break;
        }

        dir = parent;
    }

    return null;
}

/**
 * Checks whether the LocalStack container is currently running.
 *
 * Uses `docker inspect` to query the container state. Returns `false`
 * if the container does not exist or is not in a running state.
 */
function isLocalStackRunning(): boolean {
    try {
        const output = execSync(`docker inspect --format="{{.State.Running}}" ${LOCALSTACK_CONTAINER}`, {
            stdio: 'pipe',
            timeout: 10_000,
        });

        return output.toString().trim() === 'true';
    } catch {
        return false;
    }
}

/**
 * Polls the LocalStack health endpoint until all services report as
 * "running" or "available", which indicates init hooks have completed.
 *
 * @throws If the timeout is exceeded before LocalStack becomes healthy.
 */
async function waitForLocalStackReady(): Promise<void> {
    const deadline = Date.now() + LOCALSTACK_STARTUP_TIMEOUT;

    while (Date.now() < deadline) {
        try {
            const result = execSync(`curl -sf ${LOCALSTACK_HEALTH_URL}`, {
                stdio: 'pipe',
                timeout: 5_000,
            });

            const health = JSON.parse(result.toString());

            // All requested services must be "running" or "available".
            const services = health.services ?? {};
            const allReady = Object.values(services).every((status) => status === 'running' || status === 'available');

            if (allReady && Object.keys(services).length > 0) {
                return;
            }
        } catch {
            // LocalStack not ready yet — keep polling.
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }

    throw new Error(`[e2e] LocalStack did not become healthy within ${LOCALSTACK_STARTUP_TIMEOUT}ms.`);
}

/**
 * Ensures LocalStack is running. If already running (e.g. another turbo
 * task started it), skips the startup. Otherwise starts it via
 * docker-compose file at infra/localstack/docker-compose.yml and waits for init hooks to complete.
 *
 * @param repoRoot - Absolute path to the monorepo root.
 */
async function ensureLocalStack(repoRoot: string): Promise<void> {
    if (isLocalStackRunning()) {
        console.log('[e2e] LocalStack already running — skipping startup.');
        await waitForLocalStackReady();

        return;
    }

    const composeFile = join(repoRoot, 'infra', 'localstack', 'docker-compose.yml');

    console.log('[e2e] Starting LocalStack...');

    execSync(`docker compose -f "${composeFile}" up -d --wait`, {
        cwd: repoRoot,
        stdio: 'inherit',
        timeout: LOCALSTACK_STARTUP_TIMEOUT,
    });

    console.log('[e2e] LocalStack container started. Waiting for init hooks...');

    await waitForLocalStackReady();

    console.log('[e2e] LocalStack healthy and init hooks complete.');
}

/**
 * Vitest globalSetup — starts LocalStack (once, shared) then the Docker
 * Compose container for the calling service.
 *
 * Each service's vitest.e2e.config.ts references this shared globalSetup.
 * When turbo runs `test:e2e` in parallel across services, each vitest
 * instance only starts its own DB container, while LocalStack startup is
 * guarded by an "already running" check to avoid race conditions.
 *
 * `--project-directory` is set to the compose file's parent so that
 * relative volume mounts (e.g. `./__fixtures__/seed.sql`) resolve
 * correctly.
 */
export async function setup(): Promise<void> {
    // --- LocalStack (shared singleton) ---
    const repoRoot = findRepoRoot();

    if (repoRoot) {
        await ensureLocalStack(repoRoot);
    } else {
        console.warn(
            '[e2e] Could not locate infra/localstack/docker-compose.yml — ' +
                'LocalStack will not be started. AWS-dependent tests may fail.',
        );
    }

    // --- Per-service DB container ---
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
 *
 * LocalStack is intentionally NOT stopped here. It stays running across
 * parallel turbo tasks and across dev sessions. Use `npm run e2e:cleanup`
 * to stop everything including LocalStack.
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
