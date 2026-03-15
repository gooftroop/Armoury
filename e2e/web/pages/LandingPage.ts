/**
 * Page Object Model for the Armoury landing page.
 *
 * Encapsulates selectors and interactions for both authenticated and
 * unauthenticated landing page states. Tests should interact with the
 * page through this class rather than using raw selectors.
 *
 * @requirements
 * 1. Must expose locators for user tile, auth links, system grid, and overlays.
 * 2. Must use accessible selectors (getByRole, getByLabel, getByText) where possible.
 * 3. Must fall back to getByTestId only when no accessible name is available.
 * 4. Must provide interaction methods that read like user stories.
 */

import type { Page, Locator } from '@playwright/test';

export class LandingPage {
    readonly page: Page;

    readonly heading: Locator;
    readonly tagline: Locator;
    readonly legalDisclaimer: Locator;

    readonly signInLink: Locator;
    readonly signUpLink: Locator;

    readonly userTile: Locator;
    readonly welcomeText: Locator;
    readonly settingsLink: Locator;

    readonly systemGrid: Locator;

    constructor(page: Page) {
        this.page = page;

        this.heading = page.getByRole('heading', { level: 1 });
        this.tagline = page.getByText('Tabletop Army Management');
        this.legalDisclaimer = page.getByText(/unofficial.*fan-made tool/i);

        this.signInLink = page.getByRole('link', { name: 'Sign In' });
        this.signUpLink = page.getByRole('link', { name: 'Create an Account' });

        this.userTile = page.getByTestId('user-tile');
        this.welcomeText = this.userTile.locator('span').filter({ hasText: /Welcome,/i });
        this.settingsLink = this.userTile.getByRole('link', { name: /edit.*profile/i });

        this.systemGrid = page.locator('[style*="grid-template-columns"]');
    }

    /** Navigate to the landing page. */
    async goto() {
        await this.page.goto('/');
    }

    /** Get all system tile elements in the grid. */
    getSystemTiles(): Locator {
        return this.systemGrid.locator('> div');
    }

    /** Get the overlay button for a specific system tile (by splash text). */
    getOverlayButton(splashText: string): Locator {
        const tile = this.systemGrid.locator('div', { hasText: splashText }).first();

        return tile.getByRole('button');
    }

    /** Get the synced badge on a specific system tile. */
    getSyncedBadge(splashText: string): Locator {
        const tile = this.systemGrid.locator('div', { hasText: splashText }).first();

        return tile.locator('.bg-green-900\\/60');
    }

    /** Get the tile title text for a specific system tile. */
    getTileTitle(title: string): Locator {
        return this.systemGrid.getByRole('heading', { name: title });
    }

    /** Click the download overlay on a specific system tile. */
    async clickSystemOverlay(splashText: string) {
        const tile = this.systemGrid.locator('div', { hasText: splashText }).first();

        await tile.hover();
        await tile.getByRole('button').click();
    }
}
