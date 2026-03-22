/**
 * Playwright configuration for the Armoury web app.
 *
 * Projects are split into:
 *   - setup: Creates auth state once per run
 *   - authenticated: Tests requiring a logged-in user
 *   - unauthenticated: Public pages (auth wall, landing)
 *
 * @requirements
 * - REQ-E2E-CONFIG-01: Configure Playwright with project-based auth state
 * - REQ-E2E-CONFIG-02: Support CI and local dev modes
 * - REQ-E2E-CONFIG-03: Auto-start Next.js dev server
 * - REQ-E2E-CONFIG-04: Multi-browser coverage (Chromium, Firefox, Mobile)
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
        // --- Setup project: runs once, saves auth cookies ---
        {
            name: 'setup',
            testMatch: /auth\/setup\.ts/,
        },

        // --- Authenticated tests (most tests) ---
        {
            name: 'chromium-authenticated',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },
        {
            name: 'firefox-authenticated',
            use: {
                ...devices['Desktop Firefox'],
                storageState: '.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },
        {
            name: 'mobile-chromium-authenticated',
            use: {
                ...devices['Pixel 7'],
                storageState: '.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /unauthenticated\//,
        },

        // --- Unauthenticated tests (login wall, public pages) ---
        {
            name: 'chromium-unauthenticated',
            use: { ...devices['Desktop Chrome'] },
            testMatch: /unauthenticated\//,
        },
    ],

    // Start Next.js dev server automatically in CI and local runs
    webServer: {
        command: 'npm run dev -w @armoury/web',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
        env: {
            // Use a test-specific database so e2e runs don't touch real data
            DATABASE_URL: process.env['E2E_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '',
            // Auth0 SDK reads these from process.env automatically
            AUTH0_SECRET: process.env['AUTH0_SECRET'] ?? 'e2e-test-secret',
            APP_BASE_URL: 'http://localhost:3000',
        },
    },
});
