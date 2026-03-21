/**
 * Auth setup — saves browser auth state for all authenticated E2E tests.
 *
 * Runs once per Playwright suite. Logs in via Auth0 and persists the
 * session to `e2e/web/.auth/user.json` so individual tests skip login.
 *
 * @requirements
 * - REQ-E2E-AUTH-01: Authenticate once per suite via Auth0 sign-in flow
 * - REQ-E2E-AUTH-02: Persist storageState to .auth/user.json
 * - REQ-E2E-AUTH-03: Require E2E_USER_EMAIL and E2E_USER_PASSWORD env vars
 */

import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.resolve('e2e/web/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // Navigate to the auth page and complete the Auth0 sign-in flow.
    await page.goto('/auth/signin');
    await page.getByLabel('Email').fill(process.env['E2E_USER_EMAIL']!);
    await page.getByLabel('Password').fill(process.env['E2E_USER_PASSWORD']!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for redirect to confirm auth succeeded
    await page.waitForURL('/armies');

    // Save auth state — all authenticated tests will load this file
    await page.context().storageState({ path: authFile });
});
