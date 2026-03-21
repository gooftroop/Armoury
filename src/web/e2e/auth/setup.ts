/**
 * Auth setup — saves browser auth state for all authenticated E2E tests.
 *
 * Runs once per Playwright suite. Logs in via Auth0 Universal Login and persists
 * the session to `.auth/user.json` so individual tests skip login.
 *
 * Auth0 Next.js SDK routes:
 *   - /auth/login → redirects to Auth0 Universal Login page
 *   - Auth0 callback → redirects to APP_BASE_URL (landing page)
 *
 * @requirements
 * - REQ-E2E-AUTH-01: Authenticate once per suite via Auth0 Universal Login flow
 * - REQ-E2E-AUTH-02: Persist storageState to .auth/user.json
 * - REQ-E2E-AUTH-03: Require E2E_USER_EMAIL and E2E_USER_PASSWORD env vars
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.resolve(__dirname, '..', '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
    // Navigate to the Auth0 login route — the SDK redirects to the Auth0 Universal Login page.
    await page.goto('/auth/login');

    // Fill credentials on the Auth0 Universal Login page.
    await page.getByLabel('Email address').fill(process.env['E2E_USER_EMAIL']!);
    await page.getByLabel('Password').fill(process.env['E2E_USER_PASSWORD']!);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Wait for the Auth0 callback to redirect back to the app landing page.
    // The SDK redirects to APP_BASE_URL (/) which the i18n middleware rewrites to /en.
    await page.waitForURL(/\/en\/?$/);

    // Save auth state — all authenticated tests will load this file.
    await page.context().storageState({ path: authFile });
});
