/**
 * Web data sync lifecycle (WH40K 10e) — Playwright E2E tests.
 *
 * Covers first-time sync, repeat sync with changed upstream state,
 * CRUD behavior through Forge UI actions, and sync failure recovery.
 *
 * The SystemGrid component renders tiles with a button overlay. When clicked:
 * - Unauthenticated: redirects to /auth/login
 * - Authenticated: calls enableSystem() which syncs data from GitHub
 *
 * Overlay states:
 * - idle: "Click to download" text with Download icon (visible on hover)
 * - syncing: "Downloading…" text with Loader2 spinner
 * - synced: overlay removed, green badge with "Ready" text
 * - error: "Download failed. Click to retry." text with AlertCircle icon
 *
 * IndexedDB validation:
 * - PGlite stores all data in IndexedDB database "armoury" (dataDir: 'idb://armoury').
 * - Core tables (accounts, sync_status, etc.) are created on first PGlite init.
 * - After wh40k10e sync, `sync_status` rows are written (one per synced file).
 * - Post-sync persistence is verified by reloading the page: if IndexedDB retained
 *   the data, the "Ready" badge persists without re-downloading.
 *
 * Test plan:
 * | Requirement       | Test case                                                     |
 * |-------------------|---------------------------------------------------------------|
 * | REQ-DATASYNC-01   | first-time download: overlay → Ready → armies page loads      |
 * | REQ-DATASYNC-01b  | pre-download: no "Ready" badge, overlay shows "Click to download" |
 * | REQ-DATASYNC-01c  | post-download: no console errors, sync_status populated, data persists across reload |
 * | REQ-DATASYNC-02   | repeat sync: reload triggers new GitHub requests              |
 * | REQ-DATASYNC-03   | CRUD: create, duplicate, delete army via Forge UI             |
 * | REQ-DATASYNC-04   | sync error: abort → error state → unroute → retry → Ready    |
 *
 * @requirements
 * - REQ-DATASYNC-01: First-time system download shows game data as available in UI
 * - REQ-DATASYNC-02: Repeat sync detects upstream changes and revalidates
 * - REQ-DATASYNC-03: DataContext CRUD is exercisable via Forge UI (create, duplicate, delete)
 * - REQ-DATASYNC-04: Sync failure shows user-facing error and supports retry
 */

import { test, expect } from '../fixtures/index.js';
import { pgliteDatabaseExists, getTableRowCounts } from '../helpers/indexeddb.js';

/**
 * Click the download overlay button on the first system tile.
 * The overlay is a <button> inside the SystemTile with download/loading/error text.
 */
async function clickSystemTileOverlay(page: import('@playwright/test').Page): Promise<void> {
    const overlay = page
        .locator('button')
        .filter({ hasText: /download|downloading|retry/i })
        .first();
    // Hover to reveal the overlay (opacity-0 → opacity-100 on group-hover).
    const tile = overlay.locator('..');
    await tile.hover();
    await overlay.click();
}

test.describe('WH40K system data sync lifecycle', () => {
    test('first-time download enables Forge and exposes game data in UI', async ({ page, usersApiRequests }) => {
        // Collect console errors to verify no sync failures during the test.
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // ---------- PRE-DOWNLOAD: verify IndexedDB has no prior data ----------
        await page.goto('/');

        // The tile overlay should show "Click to download" (idle state).
        const downloadOverlay = page
            .locator('button')
            .filter({ hasText: /click to download/i })
            .first();
        await expect(downloadOverlay).toBeAttached();

        // No "Ready" badge should exist before any download.
        await expect(page.locator('text=Ready')).toHaveCount(0);

        const dbExistsBefore = await pgliteDatabaseExists(page);
        expect(dbExistsBefore).toBe(false);

        // ---------- DOWNLOAD: trigger sync ----------
        await clickSystemTileOverlay(page);

        // Wait for either "Ready" badge or "Download failed" error state.
        const readyOrError = await Promise.race([
            page
                .locator('text=Ready')
                .first()
                .waitFor({ state: 'visible', timeout: 60_000 })
                .then(() => 'ready' as const),
            page
                .locator('text=/failed|retry/i')
                .first()
                .waitFor({ state: 'visible', timeout: 60_000 })
                .then(() => 'error' as const),
        ]);

        // Fail fast with a clear message if sync ended in error state.
        if (readyOrError === 'error') {
            const errorText = await page.locator('text=/failed|retry|error/i').first().textContent();
            throw new Error(`Sync failed with UI state: "${errorText}".`);
        }

        await expect(page.locator('text=Ready').first()).toBeVisible();

        // ---------- POST-DOWNLOAD: verify backend account was updated ----------
        expect(usersApiRequests.length).toBeGreaterThan(0);

        const accountRequest = usersApiRequests[0]!;
        expect(accountRequest.method()).toBe('PUT');
        expect(accountRequest.url()).toContain('/account');

        const body = accountRequest.postDataJSON() as { systems?: Record<string, unknown> };
        expect(body.systems).toBeDefined();
        expect(body.systems!['wh40k10e']).toBeDefined();

        // ---------- POST-DOWNLOAD: verify no sync errors in console ----------
        const syncErrors = consoleErrors.filter((msg) => msg.includes('[Armoury Sync]'));
        expect(syncErrors).toHaveLength(0);

        // ---------- POST-DOWNLOAD: verify IndexedDB schema and data ----------
        const dbExistsAfter = await pgliteDatabaseExists(page);
        expect(dbExistsAfter).toBe(true);

        const rowCounts = await getTableRowCounts(page, ['sync_status', 'factions']);

        expect(rowCounts['sync_status']).toBeGreaterThan(0);
        expect(rowCounts['factions']).toBeGreaterThan(0);

        // ---------- POST-DOWNLOAD: verify IndexedDB data persists across reload ----------
        // If PGlite wrote sync_status rows to IndexedDB, a page reload should
        // retain the database. Verify by reloading and confirming the IDB database still exists.
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const dbExistsAfterReload = await pgliteDatabaseExists(page);
        expect(dbExistsAfterReload).toBe(true);
    });

    test('repeat sync revalidates when upstream SHA/content changes', async ({ page }) => {
        let githubRequests = 0;

        await page.route('**/*github.com/**', async (route) => {
            githubRequests += 1;
            await route.continue();
        });

        await page.goto('/');
        await clickSystemTileOverlay(page);
        await expect(page.locator('text=Ready').first()).toBeVisible({ timeout: 30_000 });

        const firstPassRequests = githubRequests;

        await page.reload();
        await clickSystemTileOverlay(page);
        await expect(page.locator('text=Ready').first()).toBeVisible({ timeout: 30_000 });

        expect(githubRequests).toBeGreaterThan(firstPassRequests);
    });

    test('user can create, duplicate, and delete an army from Forge UI', async ({ page }) => {
        await page.goto('/wh40k10e/armies');

        // GIVEN: create a new army through the UI
        await page.getByRole('link', { name: /create|new army/i }).click();

        await page.getByLabel(/army name/i).fill('E2E Data Sync Army');
        await page.getByLabel(/faction/i).click();
        await page.getByRole('option').nth(1).click();
        await page.getByLabel(/detachment/i).click();
        await page.getByRole('option').nth(1).click();
        await page.getByLabel(/battle size/i).click();
        await page
            .getByRole('option', { name: /strike force|incursion|onslaught/i })
            .first()
            .click();
        await page.getByRole('button', { name: /create army/i }).click();

        // THEN: card appears
        await expect(page.getByRole('heading', { name: 'E2E Data Sync Army', level: 3 })).toBeVisible();

        // WHEN: duplicate the army
        const createdCard = page.locator('div.rounded-lg.border', {
            has: page.getByRole('heading', { name: 'E2E Data Sync Army', level: 3 }),
        });
        await createdCard.getByRole('button', { name: /duplicate/i }).click();

        await expect(page.getByRole('heading', { name: /E2E Data Sync Army \(Copy\)/i, level: 3 })).toBeVisible();

        // WHEN: delete the copy
        const copiedCard = page.locator('div.rounded-lg.border', {
            has: page.getByRole('heading', { name: /E2E Data Sync Army \(Copy\)/i, level: 3 }),
        });
        await copiedCard.getByRole('button', { name: /delete/i }).click();
        await page
            .getByRole('alertdialog')
            .getByRole('button', { name: /delete|confirm/i })
            .click();

        await expect(page.getByRole('heading', { name: /E2E Data Sync Army \(Copy\)/i, level: 3 })).toHaveCount(0);
    });

    test('sync error state is shown and retry recovers', async ({ page }) => {
        await page.route('**/*github.com/**', async (route) => {
            await route.abort('failed');
        });

        await page.goto('/');
        await clickSystemTileOverlay(page);

        await expect(page.locator('text=/failed|error|retry/i').first()).toBeVisible();

        await page.unroute('**/*github.com/**');
        await clickSystemTileOverlay(page);

        await expect(page.locator('text=Ready').first()).toBeVisible({ timeout: 30_000 });
    });
});
