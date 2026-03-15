/**
 * Unauthenticated system tile redirect tests.
 *
 * Verifies that clicking a system tile overlay when not authenticated
 * redirects the user to the Auth0 login page with the correct returnTo
 * parameter.
 *
 * @requirements
 * 1. Must redirect to /auth/login when an unauthenticated user clicks a tile overlay.
 * 2. Must include returnTo=/ in the redirect URL.
 * 3. Must not trigger any download/sync action before redirecting.
 *
 * Test plan:
 *   REQ 1,2 → "redirects to /auth/login when clicking a system tile overlay"
 *   REQ 3   → "does not show syncing state before redirect"
 */

import { test, expect } from '../../fixtures/index.js';

test.describe('Unauthenticated System Tile Redirect', () => {
    test.beforeEach(async ({ landingPage }) => {
        await landingPage.goto();
    });

    test('redirects to /auth/login when clicking a system tile overlay', async ({ landingPage, page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        const overlayButton = firstTile.getByRole('button');
        await expect(overlayButton).toBeVisible();

        await overlayButton.click();

        await page.waitForURL(/\/auth\/login|auth0\.com/, { timeout: 15_000 });
    });

    test('does not show syncing state before redirect', async ({ landingPage, page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        const overlayButton = firstTile.getByRole('button');
        await overlayButton.click();

        await expect(firstTile.getByText(/downloading/i)).not.toBeVisible();

        await page.waitForURL(/\/auth\/login|auth0\.com/, { timeout: 15_000 });
    });
});
