/**
 * Playwright configuration for the Armoury web application e2e tests.
 *
 * Configures browser projects (setup + authenticated + public), webServer
 * for local dev, timeouts, retries, and CI-specific optimisations.
 *
 * @requirements
 * 1. Must define a "setup" project that performs Auth0 login and saves storageState.
 * 2. Must define a "chromium-authenticated" project that depends on setup.
 * 3. Must define a "chromium-public" project for unauthenticated tests (no storageState).
 * 4. Must configure webServer to start the Next.js dev server.
 * 5. Must use Chromium only in CI for speed.
 * 6. Must set sensible timeouts and retry policies.
 * 7. Must conditionally include authenticated projects only when Auth0 is configured.
 */

import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to the monorepo root (two levels up from e2e/web/). */
const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Directory where authenticated session state is persisted. */
const AUTH_STATE_DIR = './.auth';

/** Path to the authenticated user's storage state file. */
const AUTH_STATE_PATH = `${AUTH_STATE_DIR}/user.json`;

/** Whether Auth0 environment variables are present (controls authenticated test inclusion). */
const hasAuth0 = Boolean(
    process.env['AUTH0_DOMAIN'] && process.env['E2E_USER_EMAIL'] && process.env['E2E_USER_PASSWORD'],
);

export default defineConfig({
    testDir: './tests',
    fullyParallel: !process.env['CI'],
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    workers: process.env['CI'] ? 1 : undefined,
    reporter: process.env['CI'] ? 'github' : 'html',

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
        // Auth0 setup + authenticated tests — only when credentials are available.
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
        command: 'npm run dev -w @armoury/web',
        cwd: ROOT_DIR,
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
        env: {
            AUTH0_DOMAIN: process.env['AUTH0_DOMAIN'] ?? '',
            AUTH0_CLIENT_ID: process.env['AUTH0_CLIENT_ID'] ?? '',
            AUTH0_CLIENT_SECRET: process.env['AUTH0_CLIENT_SECRET'] ?? '',
            AUTH0_SECRET: process.env['AUTH0_SECRET'] ?? 'e2e-test-secret',
            APP_BASE_URL: 'http://localhost:3000',
        },
    },
});
