/**
 * Playwright configuration for the Armoury web app.
 *
 * Projects are split into:
 *   - setup: Creates auth state once per run
 *   - authenticated: Tests requiring a logged-in user
 *   - unauthenticated: Public pages (auth wall, landing)
 *
 * @requirements
 * 1. Must define setup project that runs auth/setup.ts once.
 * 2. Must define authenticated projects that depend on setup and load storageState.
 * 3. Must define unauthenticated project that runs without storageState.
 * 4. Must start Next.js dev server automatically via webServer config.
 * 5. Must support CI and local modes (retries, workers, reporter, reuseExistingServer).
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    workers: process.env['CI'] ? 4 : undefined,
    reporter: [['html', { open: 'never' }], process.env['CI'] ? ['github'] : ['list']],

    use: {
        baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'setup',
            testMatch: /auth\/setup\.ts/,
        },

        {
            name: 'chromium-authenticated',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/web/.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },
        {
            name: 'firefox-authenticated',
            use: {
                ...devices['Desktop Firefox'],
                storageState: 'e2e/web/.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },
        {
            name: 'mobile-chromium-authenticated',
            use: {
                ...devices['Pixel 7'],
                storageState: 'e2e/web/.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },

        {
            name: 'chromium-unauthenticated',
            use: { ...devices['Desktop Chrome'] },
            testMatch: /unauthenticated\//,
        },
    ],

    webServer: {
        command: 'npm run dev -w @armoury/web',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
        env: {
            DATABASE_URL: process.env['E2E_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '',
        },
    },
});
