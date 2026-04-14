/**
 * Playwright configuration for the Armoury web application e2e tests.
 *
 * Configures browser projects (setup + authenticated + public), webServer
 * for local dev, timeouts, retries, and CI-specific optimisations.
 *
 * @requirements
 * 1. Must define a "setup" project that forges an Auth0 session via generateSessionCookie.
 * 2. Must define a "chromium-authenticated" project that depends on setup.
 * 3. Must define a "chromium-public" project for unauthenticated tests (no storageState).
 * 4. Must configure webServer to start the Next.js production server in CI, dev server locally.
 * 5. Must use Chromium only in CI for speed.
 * 6. Must set sensible timeouts and retry policies.
 * 7. Must conditionally include authenticated projects only when AUTH0_SECRET is set.
 */

import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the monorepo root (three levels up from src/web/e2e/). */
const ROOT_DIR = resolve(CONFIG_DIR, '../../..');

/** Absolute path to the authenticated user's storage state file. */
const AUTH_STATE_PATH = resolve(CONFIG_DIR, '.auth', 'user.json');

/**
 * hasAuth0 checks raw env vars (no fallback) — when any are missing (CI without
 * configured secrets), authenticated Playwright projects are skipped to avoid
 * AggregateError from Auth0 handshake failures.
 */
const hasAuth0 =
    Boolean(process.env['AUTH0_SECRET']) &&
    Boolean(process.env['AUTH0_CLIENT_ID']) &&
    Boolean(process.env['AUTH0_CLIENT_SECRET']);

/** Whether we are running in a CI environment. */
const isCI = Boolean(process.env['CI']);

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 1 : 0,
    workers: isCI ? 2 : undefined,
    reporter: isCI ? 'github' : 'html',

    /* Cap total suite time to 15 min so CI fails fast instead of burning 59+ min on serial timeouts. */
    globalTimeout: process.env['CI'] ? 900_000 : 0,
    timeout: 30_000,
    expect: {
        timeout: 10_000,
    },

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },

    projects: [
        // Auth0 setup + authenticated tests — only when AUTH0_SECRET is available.
        ...(hasAuth0
            ? [
                  {
                      name: 'setup' as const,
                      testMatch: /auth\/setup\.ts/,
                      testDir: '.',
                  },
                  {
                      name: 'chromium-authenticated' as const,
                      use: {
                          ...devices['Desktop Chrome'],
                          storageState: AUTH_STATE_PATH,
                      },
                      dependencies: ['setup' as const],
                      testIgnore: /unauthenticated\//,
                  },
              ]
            : []),
        {
            name: 'chromium-public',
            use: {
                ...devices['Desktop Chrome'],
            },
            testMatch: /unauthenticated\//,
        },
    ],

    webServer: {
        command: isCI ? 'npm run start -w @armoury/web' : 'npm run dev -w @armoury/web',
        cwd: ROOT_DIR,
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        timeout: isCI ? 30_000 : 120_000,
        env: {
            // Spread process.env so the spawned server inherits PATH, system vars,
            // and any CI-injected secrets (AUTH0_* from GitHub Actions env block).
            // Without this, Playwright replaces the entire env — breaking npm/node
            // resolution and dropping CI secrets.
            ...process.env,
            // NODE_ENV=test makes Next.js load .env.test instead of .env.development.
            // This ensures the dev server always has the correct Auth0 e2e values
            // (AUTH0_SECRET, domain, client IDs) without requiring manual env setup.
            NODE_ENV: 'test',
        },
    },
});
