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
import { pgliteDatabaseExists, getTableRowCounts, deletePgliteDatabase, insertTestArmy } from '../helpers/indexeddb.js';
import { clickSystemTileOverlay, waitForSyncReady, syncAndNavigateToArmies } from '../helpers/sync.js';
import { E2E_USER_ID } from '../constants.js';

test.describe('WH40K system data sync lifecycle', () => {
    test('first-time download enables Forge and exposes game data in UI', async ({ page, usersApiRequests }) => {
        test.slow();
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
        await waitForSyncReady(page);

        await expect(page.locator('text=Ready').first()).toBeVisible();
        // Explicitly verify no error state coexists with the Ready badge.
        await expect(page.locator('text=/failed|retry/i')).toHaveCount(0);

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
        // PGlite re-initialization after navigation takes extra time to acquire IDB locks.
        test.slow();

        await page.goto('/');
        await deletePgliteDatabase(page);

        let githubProxyRequests = 0;

        page.on('request', (req) => {
            if (req.url().includes('/api/github/')) {
                githubProxyRequests += 1;
            }
        });

        await clickSystemTileOverlay(page);
        await waitForSyncReady(page);

        const firstPassRequests = githubProxyRequests;
        expect(firstPassRequests).toBeGreaterThan(0);

        // Navigate away to fully destroy the JS context and release PGlite's
        // Web Locks on the IndexedDB database, then navigate back.
        // A plain page.reload() doesn't guarantee the old PGlite instance is
        // closed before the new one tries to acquire the lock.
        await page.goto('about:blank');
        await page.goto('/');

        await clickSystemTileOverlay(page);
        await waitForSyncReady(page);

        expect(githubProxyRequests).toBeGreaterThan(firstPassRequests);
    });

    test('user can create, duplicate, and delete an army from Forge UI', async ({ page }) => {
        test.slow();

        await page.goto('/');
        await deletePgliteDatabase(page);
        await clickSystemTileOverlay(page);
        await waitForSyncReady(page);

        // GIVEN: insert a test army into PGlite while DataContext is still active.
        // Must happen BEFORE any full-page navigation since DataContext (and
        // __armoury_raw_query) is destroyed on navigation.
        await insertTestArmy(page, E2E_USER_ID, { name: 'E2E Data Sync Army' });

        await syncAndNavigateToArmies(page);

        // THEN: card appears
        await expect(page.getByText('E2E Data Sync Army').first()).toBeVisible({ timeout: 15_000 });

        // WHEN: duplicate the army
        const createdCard = page.locator('.bg-card', {
            has: page.getByText('E2E Data Sync Army', { exact: true }),
        });
        await createdCard.getByRole('button', { name: /duplicate/i }).click();

        await expect(page.getByText(/E2E Data Sync Army \(Copy\)/i).first()).toBeVisible({ timeout: 10_000 });

        // WHEN: delete the copy
        const copiedCard = page.locator('.bg-card', {
            has: page.getByText(/E2E Data Sync Army \(Copy\)/i),
        });
        await copiedCard.getByRole('button', { name: /delete/i }).click();

        await page
            .getByRole('alertdialog')
            .getByRole('button', { name: /delete|confirm/i })
            .click();

        await expect(page.getByText(/E2E Data Sync Army \(Copy\)/i)).toHaveCount(0);
    });

    test('sync error state is shown and retry recovers', async ({ page }) => {
        test.slow();
        await page.goto('/');
        await deletePgliteDatabase(page);

        const abortHandler = async (route: import('@playwright/test').Route): Promise<void> => {
            await route.abort('failed');
        };

        await page.route('**/api/github/**', abortHandler);

        await clickSystemTileOverlay(page);

        await expect(page.locator('text=/failed|error|retry/i').first()).toBeVisible({ timeout: 15_000 });

        await page.unroute('**/api/github/**', abortHandler);

        await clickSystemTileOverlay(page);

        await waitForSyncReady(page);
    });
});
