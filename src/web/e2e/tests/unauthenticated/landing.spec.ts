/**
 * E2E tests for the landing page when the user is NOT authenticated.
 *
 * Validates the public-facing landing page: heading, tagline, system tiles,
 * and auth call-to-action links. These tests run without storageState so
 * no Auth0 session exists.
 *
 * @requirements
 * 1. Must verify the heading and tagline are visible.
 * 2. Must verify auth links (Sign In, Create an Account) are present.
 * 3. Must verify at least one system tile is rendered.
 * 4. Must verify clicking a system tile redirects to Auth0 login.
 * 5. Must verify legal text is present.
 */

import { test, expect } from '../../fixtures/index.js';
import { LandingPage } from '../../pages/LandingPage.js';

test.describe('Landing Page (unauthenticated)', () => {
    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
        landingPage = new LandingPage(page);
        await landingPage.goto();
    });

    test('displays the app heading and tagline', async () => {
        await expect(landingPage.heading).toBeVisible();
        await expect(landingPage.heading).toHaveText(/armoury/i);
        await expect(landingPage.tagline).toBeVisible();
    });

    test('shows Sign In and Create an Account links', async () => {
        await expect(landingPage.signInLink).toBeVisible();
        await expect(landingPage.createAccountLink).toBeVisible();

        await expect(landingPage.signInLink).toHaveAttribute('href', '/auth/login');
        await expect(landingPage.createAccountLink).toHaveAttribute('href', /\/auth\/login\?screen_hint=signup/);
    });

    test('renders at least one system tile', async () => {
        const tiles = landingPage.getSystemTiles();

        await expect(tiles.first()).toBeVisible();
        expect(await tiles.count()).toBeGreaterThanOrEqual(1);
    });

    test('system tiles show download overlay on hover', async ({ page: _page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();

        await firstTile.hover();

        // The overlay button should become visible on hover.
        const overlayButton = firstTile.getByRole('button');

        await expect(overlayButton).toBeVisible();
    });

    test('clicking a system tile redirects to Auth0 login', async ({ page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();

        // Hover to reveal overlay, then click.
        await firstTile.hover();

        const overlayButton = firstTile.getByRole('button');
        await overlayButton.click();

        // Should redirect to /auth/login (which then redirects to Auth0).
        await page.waitForURL(/\/auth\/login|auth0\.com/, { timeout: 10_000 });
    });

    test('displays legal disclaimer text', async () => {
        await expect(landingPage.legalText).toBeVisible();
    });
});
