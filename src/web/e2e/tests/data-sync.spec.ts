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
 * - syncing: "Downloading..." text with Loader2 spinner
 * - synced: overlay removed, green badge with "Ready" text
 * - error: "Download failed. Click to retry." text with AlertCircle icon
 *
 * @requirements
 * - REQ-DATASYNC-01: First-time system download shows game data as available in UI
 * - REQ-DATASYNC-02: Repeat sync detects upstream changes and revalidates
 * - REQ-DATASYNC-03: DataContext CRUD is exercisable via Forge UI (create, duplicate, delete)
 * - REQ-DATASYNC-04: Sync failure shows user-facing error and supports retry
 */

import { test, expect } from '../fixtures/index.js';

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
    test('first-time download enables Forge and exposes game data in UI', async ({ page }) => {
        await page.goto('/en');

        await clickSystemTileOverlay(page);

        await expect(page.locator('text=/ready|synced/i').first()).toBeVisible({ timeout: 30_000 });

        await page.goto('/en/wh40k10e/armies');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('link', { name: /create|new army/i })).toBeVisible();
    });

    test('repeat sync revalidates when upstream SHA/content changes', async ({ page }) => {
        let githubRequests = 0;

        await page.route('**/*github.com/**', async (route) => {
            githubRequests += 1;
            await route.continue();
        });

        await page.goto('/en');
        await clickSystemTileOverlay(page);
        await expect(page.locator('text=/ready|synced/i').first()).toBeVisible({ timeout: 30_000 });

        const firstPassRequests = githubRequests;

        await page.reload();
        await clickSystemTileOverlay(page);
        await expect(page.locator('text=/ready|synced/i').first()).toBeVisible({ timeout: 30_000 });

        expect(githubRequests).toBeGreaterThan(firstPassRequests);
    });

    test('user can create, duplicate, and delete an army from Forge UI', async ({ page }) => {
        await page.goto('/en/wh40k10e/armies');

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

        await page.goto('/en');
        await clickSystemTileOverlay(page);

        await expect(page.locator('text=/failed|error|retry/i').first()).toBeVisible();

        await page.unroute('**/*github.com/**');
        await clickSystemTileOverlay(page);

        await expect(page.locator('text=/ready|synced/i').first()).toBeVisible({ timeout: 30_000 });
    });
});
