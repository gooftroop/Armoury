/**
 * Authenticated landing page tests.
 *
 * Verifies the landing page renders correctly when the user has a valid
 * Auth0 session: user tile with avatar and welcome message, settings link,
 * and system grid are all visible.
 *
 * @requirements
 * 1. Must render the user tile with data-testid="user-tile".
 * 2. Must show a welcome message with the user's display name.
 * 3. Must show the user's avatar image.
 * 4. Must render a settings link pointing to the account page.
 * 5. Must NOT show the sign-in / sign-up auth links.
 * 6. Must render system tiles in the grid.
 * 7. Must render the static shell (heading, tagline, legal disclaimer).
 *
 * Test plan:
 *   REQ 1   → "renders the user tile"
 *   REQ 2   → "shows welcome message with user name"
 *   REQ 3   → "shows the user avatar"
 *   REQ 4   → "renders settings link to account page"
 *   REQ 5   → "does not show auth links when authenticated"
 *   REQ 6   → "renders system tiles in the grid"
 *   REQ 7   → "renders the static shell"
 */

import { test, expect } from '../../fixtures/index.js';

test.describe('Authenticated Landing Page', () => {
    test.beforeEach(async ({ landingPage }) => {
        await landingPage.goto();
    });

    test('renders the user tile', async ({ landingPage }) => {
        await expect(landingPage.userTile).toBeVisible();
    });

    test('shows welcome message with user name', async ({ landingPage }) => {
        await expect(landingPage.welcomeText).toBeVisible();
        await expect(landingPage.welcomeText).toHaveText(/Welcome,\s+\S+/i);
    });

    test('shows the user avatar', async ({ landingPage }) => {
        const avatar = landingPage.userTile.getByRole('img');
        await expect(avatar).toBeVisible();
        await expect(avatar).toHaveAttribute('src', /.+/);
    });

    test('renders settings link to account page', async ({ landingPage }) => {
        await expect(landingPage.settingsLink).toBeVisible();
        await expect(landingPage.settingsLink).toHaveAttribute('href', /\/account$/);
    });

    test('does not show auth links when authenticated', async ({ landingPage }) => {
        await expect(landingPage.signInLink).not.toBeVisible();
        await expect(landingPage.signUpLink).not.toBeVisible();
    });

    test('renders system tiles in the grid', async ({ landingPage }) => {
        const tiles = landingPage.getSystemTiles();
        await expect(tiles.first()).toBeVisible();
        expect(await tiles.count()).toBeGreaterThanOrEqual(1);
    });

    test('renders the static shell', async ({ landingPage }) => {
        await expect(landingPage.heading).toBeVisible();
        await expect(landingPage.heading).toHaveText(/armoury/i);
        await expect(landingPage.tagline).toBeVisible();
        await expect(landingPage.legalDisclaimer).toBeVisible();
    });
});
