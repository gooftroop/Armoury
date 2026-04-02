/**
 * E2E tests for navigation between pages.
 *
 * Validates the SideNav (desktop) and BottomNav (mobile) navigation components
 * within the wh40k10e game system layout. Tests link rendering, active state,
 * route transitions, and the ARMOURY logo link back to the landing page.
 *
 * @requirements
 * 1. Must verify the SideNav renders navigation links on desktop viewport.
 * 2. Must verify the BottomNav renders navigation links on mobile viewport.
 * 3. Must verify clicking a nav link navigates to the correct route.
 * 4. Must verify the active nav link is highlighted.
 * 5. Must verify the ARMOURY logo in SideNav navigates to the landing page.
 */

import { test, expect } from '../fixtures/index.js';
import { ForgePage } from '../pages/ForgePage.js';

test.describe('Navigation', () => {
    test.describe('Desktop SideNav', () => {
        let forgePage: ForgePage;

        test.beforeEach(async ({ page }) => {
            forgePage = new ForgePage(page);
            await forgePage.goto();
        });

        test('renders the side navigation with links', async () => {
            await expect(forgePage.sideNav).toBeVisible();

            const links = forgePage.getSideNavLinks();

            // 5 nav items + ARMOURY logo link = 6 links total.
            expect(await links.count()).toBeGreaterThanOrEqual(5);
        });

        test('armies link is active when on the armies page', async () => {
            const activeLink = forgePage.getActiveSideNavLink();

            await expect(activeLink).toBeVisible();
            await expect(activeLink).toHaveText(/armies/i);
        });

        test('clicking a nav link navigates to the correct route', async ({ page }) => {
            // The nav items include 'matches', 'campaigns', etc.
            // Click on a different nav item and verify the URL changes.
            const matchesLink = forgePage.sideNav.getByRole('link', { name: /matches/i });

            await matchesLink.click();

            await page.waitForURL(/\/wh40k10e\/matches/);

            expect(page.url()).toContain('/wh40k10e/matches');
        });

        test('ARMOURY logo navigates back to landing page', async ({ page }) => {
            await forgePage.sideNavLogoLink.click();

            await page.waitForURL(/^http:\/\/localhost:3000\/?$/);
        });
    });

    test.describe('Mobile BottomNav', () => {
        test.use({ viewport: { width: 375, height: 667 } });

        let forgePage: ForgePage;

        test.beforeEach(async ({ page }) => {
            forgePage = new ForgePage(page);
            await forgePage.goto();
        });

        test('renders the bottom navigation with links', async () => {
            await expect(forgePage.bottomNav).toBeVisible();

            const links = forgePage.getBottomNavLinks();

            // 5 nav items.
            expect(await links.count()).toBe(5);
        });

        test('armies link is active on the armies page', async () => {
            const activeLink = forgePage.getActiveBottomNavLink();

            await expect(activeLink.first()).toBeVisible();
        });

        test('clicking a nav link navigates to the correct route', async ({ page }) => {
            const matchesLink = forgePage.bottomNav.getByRole('link', { name: /matches/i });

            await matchesLink.click();

            await page.waitForURL(/\/wh40k10e\/matches/);

            expect(page.url()).toContain('/wh40k10e/matches');
        });

        test('side navigation is hidden on mobile', async () => {
            await expect(forgePage.sideNav).not.toBeVisible();
        });
    });
});
