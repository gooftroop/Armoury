/**
 * E2E tests for the download-game-system flow.
 *
 * Covers the happy path (idle → syncing → synced) and a PR #45 regression
 * guard that asserts a partial sync failure does NOT flip the tile to the
 * error state — the tile must reach "Ready" without ever showing the
 * "Sync error" indicator.
 *
 * Accessible selectors used (sourced from SystemTile.tsx):
 * - Error state:   AlertCircle aria-label="Sync error"
 * - Syncing state: Loader2 role="status" aria-label="Loading"
 * - Synced state:  <Link> wrapping the tile (role="link") with text "Ready"
 * - Download btn:  <button> with text matching /download/i
 *
 * @requirements
 * 1. Must verify clicking the download button transitions the tile to synced state.
 * 2. Must verify the synced tile exposes a link to the armies page.
 * 3. Must verify the error indicator (aria-label="Sync error") never appears
 *    during a successful sync (PR #45 regression guard).
 * 4. Must reach synced state within 30 seconds of clicking download.
 */

import { test, expect } from '../fixtures/index.js';
import { LandingPage } from '../pages/LandingPage.js';
import { clickSystemTileOverlay, waitForSyncReady } from '../helpers/sync.js';

test.describe('Download game system flow', () => {
    // PGlite WASM compilation + HAR-served GitHub API calls can take 60–90s
    // under CI resource constraints. Allow 3 minutes to match data-sync suite.
    test.describe.configure({ timeout: 180_000 });

    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
        const ts = () => new Date().toISOString();

        // Forward sync diagnostics and errors to stderr for CI visibility.
        page.on('console', (msg) => {
            const text = msg.text();

            if (text.includes('[SYNC-DEBUG]') || msg.type() === 'error') {
                process.stderr.write(`[e2e ${ts()}] [browser:${msg.type()}] ${text}\n`);
            }
        });

        page.on('pageerror', (err) => {
            process.stderr.write(`[e2e ${ts()}] [pageerror] ${err.message}\n`);
        });

        landingPage = new LandingPage(page);
        await landingPage.goto();
    });

    test('happy path — clicking download transitions tile to synced state with armies link', async ({ page }) => {
        // Locate the first available download button (un-synced tile).
        const downloadButton = page.getByRole('button', { name: /download/i }).first();

        await expect(downloadButton).toBeVisible({ timeout: 10_000 });

        await downloadButton.click();

        // Syncing state: spinner should appear (or we may have already reached synced).
        const spinner = page.getByRole('status', { name: /loading/i }).first();
        const syncedLink = page.getByRole('link', { name: /ready/i }).first();

        // Either the spinner is visible (sync in progress) or we already reached synced.
        await expect(spinner.or(syncedLink)).toBeVisible({ timeout: 15_000 });

        // Wait for the tile to reach synced state — "Ready" link becomes visible.
        await waitForSyncReady(page);

        // The synced tile must expose a link to the armies page.
        await expect(syncedLink).toBeVisible({ timeout: 30_000 });
    });

    test('PR #45 regression guard — sync error indicator never appears; tile reaches synced within 30s', async ({
        page,
    }) => {
        // Track whether the error indicator ever becomes visible.
        // We poll for it throughout the sync rather than only checking at the end,
        // because the bug in PR #45 caused a transient flip to error state that
        // could resolve before a single post-sync assertion.
        let errorAppearedDuringSync = false;

        const errorLocator = page.getByLabel('Sync error');

        // Start monitoring for the error indicator before triggering sync.
        const errorPollInterval = setInterval(async () => {
            const visible = await errorLocator.isVisible().catch(() => false);

            if (visible) {
                errorAppearedDuringSync = true;
            }
        }, 500);

        try {
            // Trigger the download.
            await clickSystemTileOverlay(page);

            // The tile must reach "Ready" within 30 seconds.
            const syncedLink = page.getByRole('link', { name: /ready/i }).first();

            await expect(syncedLink).toBeVisible({ timeout: 30_000 });
        } finally {
            clearInterval(errorPollInterval);
        }

        // Assert the error indicator was never visible during the entire sync.
        expect(
            errorAppearedDuringSync,
            'aria-label="Sync error" appeared during sync — PR #45 regression detected',
        ).toBe(false);

        // Final point-in-time check: error indicator must not be visible after sync completes.
        await expect(errorLocator).not.toBeVisible();
    });
});
