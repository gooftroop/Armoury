/**
 * E2E tests for game system sync persistence across page reloads.
 *
 * Validates that once a game system is synced, the landing page tiles
 * reflect the synced state after a full page reload — without requiring
 * the user to re-download the data.
 *
 * @requirements
 * 1. Must verify that a synced system tile retains "synced" state after page reload.
 * 2. Must verify that the synced badge (green) is visible without re-clicking download.
 * 3. Must verify that the download overlay is NOT shown for a previously synced system.
 */

import { test, expect } from '../fixtures/index.js';
import { LandingPage } from '../pages/LandingPage.js';

test.describe('System Sync Persistence', () => {
    // Sync + reload tests require PGlite WASM compilation and HAR-served
    // GitHub API calls, similar to the system-sync suite.
    test.describe.configure({ timeout: 120_000 });

    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
        landingPage = new LandingPage(page);
        await landingPage.goto();
    });

    test('synced system persists across page reload', async ({ page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();

        // Step 1: Hover to reveal the download overlay and click to trigger sync.
        await firstTile.hover();

        const overlayButton = firstTile.getByRole('button');
        await overlayButton.click();

        // Step 2: Wait for sync to complete — the green synced badge must appear.
        const syncedBadge = firstTile.locator('[class*="bg-green-900"]');
        await expect(syncedBadge).toBeVisible({ timeout: 90_000 });

        // Step 3: Reload the page completely. This resets all React state.
        await page.reload({ waitUntil: 'networkidle' });

        // Step 4: Re-create the landing page POM after reload.
        landingPage = new LandingPage(page);

        const tilesAfterReload = landingPage.getSystemTiles();
        const firstTileAfterReload = tilesAfterReload.first();

        // Step 5: The synced badge should be visible WITHOUT clicking download again.
        const syncedBadgeAfterReload = firstTileAfterReload.locator('[class*="bg-green-900"]');
        await expect(syncedBadgeAfterReload).toBeVisible({ timeout: 15_000 });

        // Step 6: The download overlay button should NOT be visible (overlay hidden for synced tiles).
        await firstTileAfterReload.hover();

        const overlayButtonAfterReload = firstTileAfterReload.getByRole('button');
        await expect(overlayButtonAfterReload).not.toBeVisible();
    });
});
