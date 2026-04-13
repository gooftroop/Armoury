/**
 * Shared sync helpers for e2e tests.
 *
 * @requirements
 * 1. Must export clickSystemTileOverlay for triggering system data download.
 * 2. Must export waitForSyncReady for resilient initial sync with HMR retry.
 * 3. Must export syncAndNavigateToArmies for resilient post-sync navigation.
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Click the download overlay button on the first system tile.
 * The overlay is a `<button>` inside the SystemTile with download/loading/error text.
 * Hovers first to reveal the opacity-0 overlay.
 */
export async function clickSystemTileOverlay(page: Page): Promise<void> {
    const overlay = page
        .locator('button')
        .filter({ hasText: /download|downloading|retry/i })
        .first();
    const tile = overlay.locator('..');
    await tile.hover();
    await overlay.click();
}

/**
 * Trigger sync and wait for "Ready" badge, retrying if HMR reload resets the
 * DataContext mid-sync. Under heavy parallelism the Next.js dev server fires
 * `__webpack_modules__` errors → Fast Refresh full reload → tile reverts to
 * "Click to download". This function detects that and retries the sync.
 *
 * CI-specific resilience: HMR reloads can close the browser context mid-wait,
 * throwing "Target page, context or browser has been closed". When caught, we
 * wait for the page to settle after reload and continue retrying. IndexedDB
 * data persists across reloads so partial sync progress is not lost.
 */
export async function waitForSyncReady(page: Page, maxAttempts = 5): Promise<void> {
    const readyLocator = page.locator('text=Ready').first();
    const log = (msg: string) => process.stderr.write(`[e2e ${new Date().toISOString()}] [sync] ${msg}\n`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const isReady = await readyLocator.isVisible().catch(() => false);
        log(`attempt ${attempt + 1}/${maxAttempts} — isReady=${isReady}`);

        if (isReady) {
            log('Ready badge visible — done');

            return;
        }

        const downloadVisible = await page
            .locator('button')
            .filter({ hasText: /click to download/i })
            .first()
            .isVisible()
            .catch(() => false);

        if (downloadVisible) {
            log('download overlay visible — clicking to trigger sync');
            await clickSystemTileOverlay(page);
        } else {
            log('download overlay NOT visible — sync may be in progress');
        }

        try {
            await expect(readyLocator).toBeVisible({ timeout: 60_000 });
            log('Ready badge appeared');

            return;
        } catch {
            log(`attempt ${attempt + 1} timed out waiting for Ready badge`);

            try {
                await page.waitForTimeout(2_000);
            } catch {
                log('page context closed (HMR reload?) — waiting for settle');
                await page.waitForLoadState('domcontentloaded').catch(() => {});
                await page.waitForTimeout(1_000).catch(() => {});
            }
        }
    }

    throw new Error(`waitForSyncReady: tile did not reach "Ready" after ${maxAttempts} attempts`);
}

/**
 * Ensure the system tile is synced ("Ready") and navigate to the armies page
 * via the tile's `<Link>`, retrying if a Next.js dev-mode HMR reload
 * interrupts the navigation.
 *
 * HMR reloads happen when heavy dynamic imports (PGlite, drizzle-orm)
 * cause `__webpack_modules__` errors. Each reload resets DataContext to idle,
 * but IndexedDB data persists so re-syncing is fast. However the reload can
 * fire between our link-click and the URL change, sending the browser back
 * to `/`. This function detects that and retries the full cycle.
 */
export async function syncAndNavigateToArmies(page: Page, maxAttempts = 5): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // On retry, data is persisted in IndexedDB — fewer attempts needed.
        await waitForSyncReady(page, attempt === 0 ? 5 : 2);

        const syncedTileLink = page.locator('a[href*="/armies"]').first();
        await expect(syncedTileLink).toBeVisible({ timeout: 10_000 });
        await syncedTileLink.click();

        try {
            await page.waitForURL('**/armies**', { timeout: 10_000 });
        } catch {
            if (!page.url().includes('/armies')) {
                await page.waitForTimeout(2_000).catch(() => {});
                continue;
            }
        }

        const contentLoaded = await page
            .getByRole('heading', { level: 1 })
            .waitFor({ timeout: 10_000 })
            .then(() => true)
            .catch(() => false);

        if (contentLoaded) {
            return;
        }

        if (!page.url().includes('/armies')) {
            await page.waitForTimeout(2_000).catch(() => {});
            continue;
        }

        await page.goto('/');
        await page.waitForTimeout(1_000).catch(() => {});
    }

    throw new Error(`syncAndNavigateToArmies: failed after ${maxAttempts} attempts`);
}
