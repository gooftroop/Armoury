/**
 * Auth0 authentication setup for Playwright e2e tests.
 *
 * Logs in through the real Auth0 Universal Login UI using test tenant credentials
 * provided via environment variables. Saves the authenticated browser session to
 * a storageState file so subsequent test projects can reuse it without re-logging in.
 *
 * @requirements
 * 1. Must navigate to /auth/login to trigger Auth0 redirect.
 * 2. Must fill in email and password from E2E_USER_EMAIL / E2E_USER_PASSWORD env vars.
 * 3. Must wait for successful redirect back to the application.
 * 4. Must save storageState to e2e/web/.auth/user.json.
 * 5. Must skip gracefully if credentials are missing (dependent tests will not run).
 */

import { test as setup, expect } from '@playwright/test';

/** Path where authenticated session state is persisted between projects. */
const AUTH_STATE_PATH = './e2e/web/.auth/user.json';

setup('authenticate via Auth0', async ({ page }) => {
    const email = process.env['E2E_USER_EMAIL'];
    const password = process.env['E2E_USER_PASSWORD'];

    setup.skip(!email || !password, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required for Auth0 login');

    const authDomain = process.env['AUTH0_DOMAIN'];
    setup.skip(!authDomain, 'AUTH0_DOMAIN is required for Auth0 redirect');

    // Navigate to the app's login route, which redirects to Auth0 Universal Login.
    await page.goto('/auth/login');

    // Wait for the Auth0 login page to appear.
    // Auth0 Universal Login uses an input with name="username" or "email"
    // and a submit button. The exact selectors may vary by Auth0 tenant configuration.
    await page.waitForURL(/.*auth0\.com.*/, { timeout: 15_000 });

    // Fill in credentials on the Auth0 Universal Login form.
    // Auth0 "New Universal Login" uses input[name="username"] for email.
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill(email!);

    // Some Auth0 tenants show a "Continue" button before the password field.
    const continueButton = page.getByRole('button', { name: /continue/i });

    if (await continueButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await continueButton.click();
    }

    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill(password!);

    // Submit the login form.
    const submitButton = page.getByRole('button', { name: /continue|log in|submit/i });
    await submitButton.click();

    // Wait for Auth0 to redirect back to the application.
    await page.waitForURL('http://localhost:3000/**', { timeout: 30_000 });

    // Verify we landed on the app (not an error page).
    await expect(page).not.toHaveURL(/error/);

    // Persist the authenticated session.
    await page.context().storageState({ path: AUTH_STATE_PATH });
});
