/**
 * Page Object Model for the Forge (Armies) Page.
 *
 * Encapsulates locators and actions for the army management page at
 * /wh40k10e/armies, including the army list, loading state, and empty state.
 *
 * @requirements
 * 1. Must expose locators for the army list, loading indicator, and empty state.
 * 2. Must expose a method to navigate to the Forge page.
 * 3. Must expose locators for the SideNav and BottomNav navigation components.
 */

import type { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Forge page (/wh40k10e/armies route).
 */
export class ForgePage {
    /** The Playwright page instance. */
    readonly page: Page;

    /** The main content area of the page. */
    readonly mainContent: Locator;

    /** The side navigation component (visible on desktop ≥768px). */
    readonly sideNav: Locator;

    /** The bottom navigation component (visible on mobile <768px). */
    readonly bottomNav: Locator;

    /** Navigation link for "Armies" in the side nav. */
    readonly sideNavArmiesLink: Locator;

    /** The ARMOURY logo link in the side nav that navigates back to landing. */
    readonly sideNavLogoLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.mainContent = page.locator('main, [class*="flex-1"]').first();
        this.sideNav = page.locator('aside');
        this.bottomNav = page.locator('nav.fixed');
        this.sideNavArmiesLink = this.sideNav.getByRole('link', { name: /the forge/i });
        this.sideNavLogoLink = this.sideNav.getByRole('link', { name: /armoury/i });
    }

    /**
     * Navigates to the Forge (armies) page.
     *
     * @param path - Override path (defaults to /wh40k10e/armies).
     */
    async goto(path = '/wh40k10e/armies'): Promise<void> {
        await this.page.goto(path);
    }

    /**
     * Returns all navigation links from the side navigation.
     *
     * @returns A locator matching all nav link elements inside the aside.
     */
    getSideNavLinks(): Locator {
        return this.sideNav.getByRole('link');
    }

    /**
     * Returns all navigation links from the bottom navigation.
     *
     * @returns A locator matching all nav link elements inside the bottom bar.
     */
    getBottomNavLinks(): Locator {
        return this.bottomNav.getByRole('link');
    }

    /**
     * Returns the active nav link in the side navigation (identified by accent styling).
     *
     * @returns A locator for the currently active side nav link.
     */
    getActiveSideNavLink(): Locator {
        return this.sideNav.locator('[aria-current="page"]');
    }

    /**
     * Returns the active nav link in the bottom navigation (identified by accent styling).
     *
     * @returns A locator for the currently active bottom nav link.
     */
    getActiveBottomNavLink(): Locator {
        return this.bottomNav.locator('[aria-current="page"]');
    }
}
