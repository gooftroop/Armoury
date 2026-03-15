/**
 * Auth0 login setup — runs once per Playwright run to create a reusable auth state.
 *
 * Navigates to /auth/login, completes the Auth0 Universal Login form, waits
 * for the callback redirect, and saves the browser's storage state (cookies,
 * localStorage) to a JSON file. Authenticated projects load this file via
 * storageState so each test starts already logged in.
 *
 * @requirements
 * 1. Must navigate to /auth/login to trigger Auth0 redirect.
 * 2. Must fill email and password from E2E_USER_EMAIL / E2E_USER_PASSWORD env vars.
 * 3. Must click the Auth0 "Continue" button to submit credentials.
 * 4. Must wait for redirect back to the app (landing page).
 * 5. Must save storageState to e2e/web/.auth/user.json.
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.resolve('e2e/web/.auth/user.json');

setup('authenticate via Auth0', async ({ page }) => {
    await page.goto('/auth/login');

    await page.waitForURL(/.*auth0\.com.*/, { timeout: 15_000 });

    const email = process.env['E2E_USER_EMAIL'];
    const password = process.env['E2E_USER_PASSWORD'];

    if (!email || !password) {
        throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in the environment');
    }

    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.waitForURL(/localhost:\d+\/(?:en|de)?/, { timeout: 30_000 });

    await expect(page.getByTestId('user-tile')).toBeVisible({ timeout: 10_000 });

    await page.context().storageState({ path: authFile });
});
