/**
 * Unauthenticated landing page tests.
 *
 * Verifies the public-facing landing page renders correctly when no
 * Auth0 session exists: static shell, auth links, and system tiles
 * are all visible and properly configured.
 *
 * @requirements
 * 1. Must verify the static shell (heading, tagline, legal disclaimer) renders.
 * 2. Must verify sign-in and sign-up auth links are visible with correct hrefs.
 * 3. Must verify system tiles are rendered in the grid.
 * 4. Must verify the user tile is NOT visible (unauthenticated state).
 * 5. Must verify system tiles show the download overlay on hover.
 *
 * Test plan:
 *   REQ 1 → "renders the static shell with heading, tagline, and legal text"
 *   REQ 2 → "shows sign-in link pointing to /auth/login"
 *   REQ 2 → "shows sign-up link pointing to /auth/login?screen_hint=signup"
 *   REQ 3 → "renders at least one system tile in the grid"
 *   REQ 4 → "does not show the authenticated user tile"
 *   REQ 5 → "shows download overlay when hovering a system tile"
 */

import { test, expect } from '../../fixtures/index.js';

test.describe('Unauthenticated Landing Page', () => {
    test.beforeEach(async ({ landingPage }) => {
        await landingPage.goto();
    });

    test('renders the static shell with heading, tagline, and legal text', async ({ landingPage }) => {
        await expect(landingPage.heading).toBeVisible();
        await expect(landingPage.heading).toHaveText(/armoury/i);
        await expect(landingPage.tagline).toBeVisible();
        await expect(landingPage.legalDisclaimer).toBeVisible();
    });

    test('shows sign-in link pointing to /auth/login', async ({ landingPage }) => {
        await expect(landingPage.signInLink).toBeVisible();
        await expect(landingPage.signInLink).toHaveAttribute('href', '/auth/login');
    });

    test('shows sign-up link pointing to /auth/login?screen_hint=signup', async ({ landingPage }) => {
        await expect(landingPage.signUpLink).toBeVisible();
        await expect(landingPage.signUpLink).toHaveAttribute('href', '/auth/login?screen_hint=signup');
    });

    test('renders at least one system tile in the grid', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        await expect(tiles.first()).toBeVisible();
        expect(await tiles.count()).toBeGreaterThanOrEqual(1);
    });

    test('does not show the authenticated user tile', async ({ landingPage }) => {
        await expect(landingPage.userTile).not.toBeVisible();
    });

    test('shows download overlay when hovering a system tile', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        const firstTile = tiles.first();
        await expect(firstTile).toBeVisible();

        await firstTile.hover();
        const overlayButton = firstTile.getByRole('button');
        await expect(overlayButton).toBeVisible();
        await expect(overlayButton).toHaveText(/click to download/i);
    });
});
