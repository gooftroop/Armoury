/**
 * Page Object Model for the Landing Page.
 *
 * Encapsulates locators and actions for the main landing page, including
 * the system grid tiles, auth links, and page header elements.
 *
 * @requirements
 * 1. Must expose locators for the page heading, tagline, and legal text.
 * 2. Must expose locators for auth links (Sign In, Create an Account).
 * 3. Must expose methods to interact with system tiles (click, check status).
 * 4. Must expose a method to get all visible system tiles.
 * 5. Must expose locators for the logged-in user tile (avatar, welcome text, settings link).
 */

import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Landing Page (/ route).
 */
export class LandingPage {
    /** The Playwright page instance. */
    readonly page: Page;

    /** The main heading ("ARMOURY"). */
    readonly heading: Locator;

    /** The tagline text below the heading. */
    readonly tagline: Locator;

    /** The legal disclaimer text. */
    readonly legalText: Locator;

    /** The "Sign In" auth link (visible only when unauthenticated). */
    readonly signInLink: Locator;

    /** The "Create an Account" auth link (visible only when unauthenticated). */
    readonly createAccountLink: Locator;

    /** The container holding system tiles. */
    readonly systemGrid: Locator;

    /** The logged-in user tile container. */
    readonly userTile: Locator;

    /** The user avatar in the user tile. */
    readonly userAvatar: Locator;

    /** The welcome text in the user tile (e.g. 'Welcome, John'). */
    readonly userWelcomeText: Locator;

    /** The settings gear icon link in the user tile. */
    readonly userSettingsLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading = page.getByRole('heading', { level: 1 });
        this.tagline = page.locator('p.tracking-wide').first();
        this.legalText = page.locator('p.text-foreground').first();
        this.signInLink = page.getByRole('link', { name: /sign in/i });
        this.createAccountLink = page.getByRole('link', { name: /create an account/i });
        this.systemGrid = page.locator('[style*="grid-template-columns"]');

        // Logged-in user tile locators — accessible selectors (no data-testid).
        this.userTile = page.getByRole('status', { name: /signed in|welcome/i });
        this.userAvatar = this.userTile
            .locator('span')
            .filter({ has: page.locator('img') })
            .first();
        this.userWelcomeText = this.userTile.locator('span.text-foreground');
        this.userSettingsLink = this.userTile.getByRole('link', { name: /edit.*profile/i });
    }

    /**
     * Navigates to the landing page.
     *
     * @param path - The path to navigate to (defaults to '/').
     */
    async goto(path = '/'): Promise<void> {
        // Suppress the SilentAuthCheck redirect that fires on unauthenticated
        // landing visits. Without this, the component navigates away to
        // /auth/login?prompt=none before hover/click tests can complete.
        await this.page.addInitScript(() => {
            sessionStorage.setItem('armoury:silent-auth-attempted', '1');
        });
        await this.page.goto(path);
    }

    /**
     * Returns all system tile elements in the grid.
     *
     * @returns A locator matching all system tile containers.
     */
    getSystemTiles(): Locator {
        return this.systemGrid.locator('> div');
    }

    /**
     * Returns a specific system tile by its splash text content.
     *
     * @param splashText - The text displayed on the tile splash area (e.g., 'WH40K10E').
     * @returns A locator for the matching tile.
     */
    getSystemTileBySplashText(splashText: string): Locator {
        return this.systemGrid.locator('> div', { hasText: splashText });
    }

    /**
     * Clicks the download overlay button on a specific system tile.
     *
     * @param splashText - The splash text of the tile to click.
     */
    async clickSystemTileOverlay(splashText: string): Promise<void> {
        const tile = this.getSystemTileBySplashText(splashText);
        const overlayButton = tile.getByRole('button');

        // Hover to reveal the overlay, then click.
        await tile.hover();
        await overlayButton.click();
    }

    /**
     * Returns the overlay text for a specific system tile.
     *
     * @param splashText - The splash text of the tile.
     * @returns The text content of the overlay button span.
     */
    async getSystemTileOverlayText(splashText: string): Promise<string | null> {
        const tile = this.getSystemTileBySplashText(splashText);

        await tile.hover();

        const overlaySpan = tile.getByRole('button').locator('span');

        return overlaySpan.textContent();
    }

    /**
     * Checks whether the synced badge is visible on a tile.
     *
     * @param splashText - The splash text of the tile.
     * @returns True if the synced badge (green check) is visible.
     */
    async isTileSynced(splashText: string): Promise<boolean> {
        const tile = this.getSystemTileBySplashText(splashText);
        const syncedBadge = tile.locator('.bg-green-900\\/60');

        return syncedBadge.isVisible();
    }

    /**
     * Checks whether the error indicator is visible on a tile.
     *
     * @param splashText - The splash text of the tile.
     * @returns True if the error icon (AlertCircle) is visible on hover.
     */
    async isTileError(splashText: string): Promise<boolean> {
        const tile = this.getSystemTileBySplashText(splashText);

        await tile.hover();

        const errorIcon = tile.locator('.text-red-400').first();

        return errorIcon.isVisible();
    }
}
