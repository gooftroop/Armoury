/**
 * E2E tests for the landing page when the user IS authenticated.
 *
 * Validates the authenticated landing page experience: system tiles are
 * visible, auth links are hidden, and the download overlay initiates
 * system sync rather than redirecting to Auth0.
 *
 * @requirements
 * 1. Must verify the heading is visible.
 * 2. Must verify auth links (Sign In, Create an Account) are NOT present.
 * 3. Must verify system tiles are rendered with download overlays.
 * 4. Must verify clicking a tile triggers the sync flow (loading indicator appears).
 */

import { test, expect } from '../fixtures/index.js';
import { LandingPage } from '../pages/LandingPage.js';

test.describe('Landing Page (authenticated)', () => {
    let landingPage: LandingPage;

    test.beforeEach(async ({ page }) => {
        landingPage = new LandingPage(page);
        await landingPage.goto();
    });

    test('displays the app heading', async () => {
        await expect(landingPage.heading).toBeVisible();
        await expect(landingPage.heading).toHaveText(/armoury/i);
    });

    test('does NOT show auth links when authenticated', async () => {
        await expect(landingPage.signInLink).not.toBeVisible();
        await expect(landingPage.createAccountLink).not.toBeVisible();
    });

    test('renders system tiles', async () => {
        const tiles = landingPage.getSystemTiles();

        await expect(tiles.first()).toBeVisible();
        expect(await tiles.count()).toBeGreaterThanOrEqual(1);
    });

    test('clicking a tile starts the sync flow instead of redirecting to login', async ({ page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();

        // Hover and click the download overlay.
        await firstTile.hover();

        const overlayButton = firstTile.getByRole('button');
        await overlayButton.click();

        // Should NOT redirect to Auth0 — instead, a loading spinner should appear.
        // The Loader2 spinner has an animate-spin class.
        const spinner = firstTile.locator('.animate-spin');
        const errorIndicator = firstTile.locator('.text-red-400');
        const syncedBadge = firstTile.locator('[class*="bg-green-900"]');

        // Wait for either: spinner (syncing), error state, or synced badge.
        // Any of these confirms we entered the sync flow, not an auth redirect.
        await expect(
            spinner.or(errorIndicator).or(syncedBadge),
        ).toBeVisible({ timeout: 15_000 });

        // Confirm we're still on the app, not redirected to Auth0.
        expect(page.url()).toContain('localhost:3000');
    });

    test('displays legal disclaimer text', async () => {
        await expect(landingPage.legalText).toBeVisible();
    });
});
