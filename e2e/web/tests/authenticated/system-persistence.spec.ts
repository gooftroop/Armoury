/**
 * Authenticated system persistence tests.
 *
 * Verifies that after syncing a game system, the state persists across
 * page reloads — confirming that the enableSystem call and account
 * persistence mutation worked correctly.
 *
 * @requirements
 * 1. Must show a synced system as still synced after a full page reload.
 * 2. Must render the synced badge (not the download overlay) on reload.
 * 3. Must preserve sync state across navigation and return to landing.
 *
 * Test plan:
 *   REQ 1,2 → "synced system persists after page reload"
 *   REQ 3   → "synced system persists after navigation and return"
 */

import { test, expect } from '../../fixtures/index.js';

test.describe('Authenticated System Persistence', () => {
    test('synced system persists after page reload', async ({ landingPage, page }) => {
        await landingPage.goto();

        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        await firstTile.getByRole('button').click();

        const syncedBadge = firstTile.locator('.bg-green-900\\/60');
        await expect(syncedBadge).toBeVisible({ timeout: 60_000 });

        await page.reload();

        const reloadedTiles = landingPage.getSystemTiles();
        const reloadedFirstTile = reloadedTiles.first();
        await expect(reloadedFirstTile).toBeVisible();

        const reloadedBadge = reloadedFirstTile.locator('.bg-green-900\\/60');
        await expect(reloadedBadge).toBeVisible({ timeout: 10_000 });
        await expect(reloadedBadge).toHaveText(/ready/i);
    });

    test('synced system persists after navigation and return', async ({ landingPage, page }) => {
        await landingPage.goto();

        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        await firstTile.getByRole('button').click();

        const syncedBadge = firstTile.locator('.bg-green-900\\/60');
        await expect(syncedBadge).toBeVisible({ timeout: 60_000 });

        await landingPage.settingsLink.click();
        await page.waitForURL(/\/account/);

        await page.goto('/');

        const returnedTiles = landingPage.getSystemTiles();
        const returnedFirstTile = returnedTiles.first();
        await expect(returnedFirstTile).toBeVisible();

        const returnedBadge = returnedFirstTile.locator('.bg-green-900\\/60');
        await expect(returnedBadge).toBeVisible({ timeout: 10_000 });
        await expect(returnedBadge).toHaveText(/ready/i);
    });
});
