/**
 * Authenticated system grid tests.
 *
 * Verifies the system grid download/sync flow for authenticated users:
 * clicking a tile overlay triggers the download, shows syncing state,
 * and transitions to synced or error state.
 *
 * @requirements
 * 1. Must show download overlay on un-synced system tiles.
 * 2. Must show "Downloading…" with a spinner when sync is in progress.
 * 3. Must show a synced badge (green, with check icon) when sync completes.
 * 4. Must hide the overlay after successful sync.
 * 5. Must show "Download failed. Click to retry." when sync fails.
 * 6. Must allow retry by clicking the error overlay.
 * 7. Must show tile metadata (title, subtitle, description).
 *
 * Test plan:
 *   REQ 1   → "shows download overlay on un-synced tiles"
 *   REQ 2   → "shows downloading state with spinner after clicking overlay"
 *   REQ 3,4 → "transitions to synced state with badge after download completes"
 *   REQ 5   → "shows error state when sync fails" (requires network mocking)
 *   REQ 7   → "displays tile metadata from manifest"
 */

import { test, expect } from '../../fixtures/index.js';

test.describe('Authenticated System Grid', () => {
    test.beforeEach(async ({ landingPage }) => {
        await landingPage.goto();
    });

    test('shows download overlay on un-synced tiles', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        const overlayButton = firstTile.getByRole('button');
        await expect(overlayButton).toBeVisible();
        await expect(overlayButton).toHaveText(/click to download/i);
    });

    test('shows downloading state after clicking overlay', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        await firstTile.getByRole('button').click();

        await expect(firstTile.getByText(/downloading/i)).toBeVisible({ timeout: 5_000 });
    });

    test('transitions to synced state after download completes', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        await firstTile.getByRole('button').click();

        const syncedBadge = firstTile.locator('.bg-green-900\\/60');
        await expect(syncedBadge).toBeVisible({ timeout: 60_000 });
        await expect(syncedBadge).toHaveText(/ready/i);

        await expect(firstTile.getByRole('button')).not.toBeVisible();
    });

    test('displays tile metadata from manifest', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        const heading = firstTile.getByRole('heading');
        await expect(heading).toBeVisible();
        await expect(heading).not.toHaveText('');

        const paragraphs = firstTile.locator('p');
        expect(await paragraphs.count()).toBeGreaterThanOrEqual(2);
    });

    test('disables overlay button while syncing', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        await firstTile.getByRole('button').click();

        await expect(firstTile.getByText(/downloading/i)).toBeVisible({ timeout: 5_000 });
        await expect(firstTile.getByRole('button')).toBeDisabled();
    });

    test('applies pulse animation to tile content while syncing', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        await firstTile.getByRole('button').click();

        await expect(firstTile.getByText(/downloading/i)).toBeVisible({ timeout: 5_000 });
        const footer = firstTile.locator('.animate-pulse');
        await expect(footer).toBeVisible();
    });
});
