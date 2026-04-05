/**
 * Forge army list — Playwright E2E tests.
 *
 * Validates rendering, empty state UX, filtering/sorting behaviors,
 * and army card actions (deploy, delete, duplicate).
 *
 * @requirements
 * - REQ-FORGE-01: Authenticated user can view army cards in Forge grid
 * - REQ-FORGE-02: Empty state appears for users without armies
 * - REQ-FORGE-03: Faction filter shows only matching armies
 * - REQ-FORGE-04: Battle size filter shows only matching armies
 * - REQ-FORGE-05: Sorting updates list order
 * - REQ-FORGE-06: Deploy action navigates to the army editor route
 * - REQ-FORGE-07: Delete flow supports confirm and cancel paths
 * - REQ-FORGE-08: Duplicate action creates a visible copy
 */

import { test, expect } from '../fixtures/index.js';
import { ForgeListPage } from '../pages/ForgeListPage.js';
import { deletePgliteDatabase, insertTestArmy } from '../helpers/indexeddb.js';
import { E2E_USER_ID } from '../constants.js';

/**
 * Click the download overlay on the first system tile to trigger data sync.
 * Reused from data-sync.spec.ts — the overlay is a <button> with download text.
 */
async function clickSystemTileOverlay(page: import('@playwright/test').Page): Promise<void> {
    const overlay = page
        .locator('button')
        .filter({ hasText: /download|downloading|retry/i })
        .first();
    const tile = overlay.locator('..');
    await tile.hover();
    await overlay.click();
}

/**
 * Seed PGlite with game data (sync) and insert test armies, then soft-navigate
 * to the Forge armies page. This preserves the DataContext React state so the
 * ForgeContainer can query PGlite for armies.
 *
 * @param page - Playwright page with auth session cookie already set.
 * @param armies - Array of army overrides to insert after sync completes.
 * @returns Array of inserted army IDs.
 */
async function seedAndNavigateToForge(
    page: import('@playwright/test').Page,
    armies: Array<{
        name: string;
        factionId?: string;
        battleSize?: string;
        pointsLimit?: number;
    }>,
): Promise<string[]> {
    // 1. Navigate to landing and ensure clean PGlite state.
    await page.goto('/');
    await deletePgliteDatabase(page);

    // 2. Trigger system data sync (downloads faction/detachment data into PGlite).
    await clickSystemTileOverlay(page);
    await expect(page.locator('text=Ready').first()).toBeVisible({ timeout: 60_000 });

    // 3. Insert test armies while DataContext is still active and __armoury_raw_query
    //    is available. This must happen BEFORE any full-page navigation.
    const ids: string[] = [];

    for (const army of armies) {
        const id = await insertTestArmy(page, E2E_USER_ID, army);
        ids.push(id);
    }

    // 4. Soft-navigate to the Forge armies page via Next.js client-side router.
    //    page.goto() would destroy DataContext and remount it in 'idle' state.
    await page.evaluate(() =>
        (window as unknown as { next: { router: { push: (url: string) => Promise<void> } } }).next.router.push(
            '/en/wh40k10e/armies',
        ),
    );
    await page.waitForURL('**/armies**', { timeout: 15_000 });

    return ids;
}

test.describe('Forge army list', () => {
    // PGlite sync + soft navigation takes extra time.
    test.slow();

    test('authenticated user sees army cards in the grid', async ({ page }) => {
        await seedAndNavigateToForge(page, [{ name: 'Alpha Legion Host' }, { name: 'Ultramarines Strike Force' }]);

        const forge = new ForgeListPage(page);
        await expect(forge.heading).toBeVisible();
        await expect(forge.armyCards.first()).toBeVisible({ timeout: 15_000 });

        const count = await forge.getArmyCount();
        expect(count).toBe(2);
    });

    test('user with zero armies sees empty state with create CTA', async ({ page }) => {
        await seedAndNavigateToForge(page, []);

        const forge = new ForgeListPage(page);
        await expect(forge.emptyState).toBeVisible();
        // Scope to empty state container — page may have a second "Create Army" link in the header
        await expect(forge.emptyState.getByRole('link', { name: /create|new army/i })).toBeVisible();
    });

    test('faction filter narrows list to matching armies only', async ({ page }) => {
        await seedAndNavigateToForge(page, [
            { name: 'SM Alpha', factionId: 'space-marines' },
            { name: 'SM Beta', factionId: 'space-marines' },
            { name: 'Necron Phalanx', factionId: 'necrons' },
        ]);

        const forge = new ForgeListPage(page);
        await expect(forge.armyCards.first()).toBeVisible({ timeout: 15_000 });
        expect(await forge.getArmyCount()).toBe(3);

        await forge.filterByFaction('space-marines');
        await expect(forge.armyCards).toHaveCount(2, { timeout: 5_000 });
    });

    test('battle size filter narrows list to selected battle size', async ({ page }) => {
        await seedAndNavigateToForge(page, [
            { name: 'SF Army One', battleSize: 'StrikeForce' },
            { name: 'SF Army Two', battleSize: 'StrikeForce' },
            { name: 'Incursion Army', battleSize: 'Incursion', pointsLimit: 1000 },
        ]);

        const forge = new ForgeListPage(page);
        await expect(forge.armyCards.first()).toBeVisible({ timeout: 15_000 });

        expect(await forge.getArmyCount()).toBe(3);

        await forge.filterByBattleSize('Strike Force');

        await expect(forge.armyCards).toHaveCount(2, { timeout: 5_000 });
    });

    test('sort options change army ordering (name, newest, oldest, points)', async ({ page }) => {
        // Insert armies with different names and points so sort produces different orderings.
        await seedAndNavigateToForge(page, [
            { name: 'Alpha Force', pointsLimit: 1500 },
            { name: 'Charlie Company', pointsLimit: 2000 },
            { name: 'Bravo Detachment', pointsLimit: 1000 },
        ]);

        const forge = new ForgeListPage(page);
        await expect(forge.armyCards.first()).toBeVisible({ timeout: 15_000 });

        await forge.sortBy('Name');
        const namesByNameSort = await forge.getArmyNames();

        await forge.sortBy('Newest');
        const namesByNewestSort = await forge.getArmyNames();

        await forge.sortBy('Oldest');
        const namesByOldestSort = await forge.getArmyNames();

        await forge.sortBy('Points');
        const namesByPointsSort = await forge.getArmyNames();

        // At least some sort orders should produce different orderings.
        const allEqual =
            JSON.stringify(namesByNameSort) === JSON.stringify(namesByNewestSort) &&
            JSON.stringify(namesByNewestSort) === JSON.stringify(namesByOldestSort) &&
            JSON.stringify(namesByOldestSort) === JSON.stringify(namesByPointsSort);

        expect(allEqual).toBe(false);
    });

    test('deploy action navigates to the selected army editor', async ({ page }) => {
        const armyIds = await seedAndNavigateToForge(page, [{ name: 'Deploy Target Army' }]);

        const forge = new ForgeListPage(page);
        await expect(forge.armyCards.first()).toBeVisible({ timeout: 15_000 });

        await forge.deployArmy('Deploy Target Army');

        // Deploy uses router.push(`./armies/${armyId}`), so URL contains the UUID.
        await expect(page).toHaveURL(new RegExp(armyIds[0]!), { timeout: 10_000 });
    });

    test('delete flow supports cancel and confirm behavior', async ({ page }) => {
        await seedAndNavigateToForge(page, [{ name: 'Keep This Army' }, { name: 'Delete Target Army' }]);

        const forge = new ForgeListPage(page);
        await expect(forge.armyCards.first()).toBeVisible({ timeout: 15_000 });

        // Cancel path — dialog opens and closes, card remains.
        await forge.requestDeleteArmy('Delete Target Army');
        await expect(forge.deleteDialog).toBeVisible();

        await forge.cancelDelete();
        await expect(forge.deleteDialog).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Delete Target Army', level: 3 })).toBeVisible();

        // Confirm path — card is removed after confirming deletion.
        await forge.requestDeleteArmy('Delete Target Army');
        await expect(forge.deleteDialog).toBeVisible();

        await forge.confirmDelete();
        await expect(forge.deleteDialog).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Delete Target Army', level: 3 })).toHaveCount(0);

        // The other army should still be visible.
        await expect(page.getByRole('heading', { name: 'Keep This Army', level: 3 })).toBeVisible();
    });

    test('duplicate action creates a visible copied army card', async ({ page }) => {
        await seedAndNavigateToForge(page, [{ name: 'Original Army' }]);

        const forge = new ForgeListPage(page);
        await expect(forge.armyCards.first()).toBeVisible({ timeout: 15_000 });

        expect(await forge.getArmyCount()).toBe(1);

        await forge.duplicateArmy('Original Army');

        await expect(forge.armyCards).toHaveCount(2, { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: /Original Army \(Copy\)/i, level: 3 })).toBeVisible();
    });
});
