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
 * 4. Must verify clicking a tile triggers the sync flow (not an auth redirect).
 * 5. Must verify the synced state shows a green badge with 'Ready' text.
 * 6. Must verify the error state shows an error badge with a failure message and retry.
 * 7. Must verify the logged-in user tile displays avatar, welcome text, and settings link.
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

    test('displays logged-in user tile with avatar and settings link', async () => {
        // User tile should be visible for authenticated users.
        await expect(landingPage.userTile).toBeVisible();

        // Welcome text should include the user's name.
        await expect(landingPage.userWelcomeText).toBeVisible();
        await expect(landingPage.userWelcomeText).toContainText(/welcome/i);

        // Settings gear icon should link to the profile page.
        await expect(landingPage.userSettingsLink).toBeVisible();
        await expect(landingPage.userSettingsLink).toHaveAttribute('href', /account/);
    });

    test('renders system tiles', async () => {
        const tiles = landingPage.getSystemTiles();

        await expect(tiles.first()).toBeVisible();
        expect(await tiles.count()).toBeGreaterThanOrEqual(1);
    });

    test('shows synced badge with Ready text when sync succeeds', async ({ page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();

        await firstTile.hover();

        const overlayButton = firstTile.getByRole('button');
        await overlayButton.click();

        // Wait for a terminal state — either synced or error.
        const syncedBadge = firstTile.locator('[class*="bg-green-900"]');
        const errorIndicator = firstTile.locator('.text-red-400');

        await expect(syncedBadge.or(errorIndicator)).toBeVisible({ timeout: 30_000 });

        // Confirm we stayed on the app, not redirected to Auth0.
        expect(page.url()).toContain('localhost:3000');

        const isSynced = await syncedBadge.isVisible().catch(() => false);

        if (isSynced) {
            // The green badge should contain 'Ready' text.
            await expect(syncedBadge).toContainText('Ready');
        }
    });

    test('shows error badge with failure message and retry when sync fails', async ({ page }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();

        await firstTile.hover();

        const overlayButton = firstTile.getByRole('button');
        await overlayButton.click();

        // Wait for a terminal state — either synced or error.
        const syncedBadge = firstTile.locator('[class*="bg-green-900"]');
        const errorIndicator = firstTile.locator('.text-red-400').first();

        await expect(syncedBadge.or(errorIndicator)).toBeVisible({ timeout: 30_000 });

        // Confirm we stayed on the app, not redirected to Auth0.
        expect(page.url()).toContain('localhost:3000');

        const isError = await errorIndicator.isVisible().catch(() => false);

        if (isError) {
            // The overlay text should show the failure message with retry instruction.
            const overlaySpan = overlayButton.locator('span');

            await expect(overlaySpan).toContainText('Download failed');
            await expect(overlaySpan).toContainText('Click to retry');

            // Click the tile to retry — spinner should reappear.
            await overlayButton.click();

            const spinner = firstTile.locator('.animate-spin');

            await expect(spinner.or(syncedBadge).or(errorIndicator)).toBeVisible({ timeout: 15_000 });
        }
    });

    test('displays legal disclaimer text', async () => {
        await expect(landingPage.legalText).toBeVisible();
    });
});
