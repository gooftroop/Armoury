/**
 * Base test fixtures for Armoury E2E tests.
 *
 * Re-exports Playwright's test and expect with the LandingPage fixture
 * pre-configured so every test file gets a `landingPage` instance automatically.
 *
 * @requirements
 * 1. Must extend base Playwright test with LandingPage fixture.
 * 2. Must export test and expect for use in all spec files.
 */

import { test as base, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage.js';

interface LandingFixtures {
    landingPage: LandingPage;
}

export const test = base.extend<LandingFixtures>({
    landingPage: async ({ page }, use) => {
        const landingPage = new LandingPage(page);
        await use(landingPage);
    },
});

export { expect };
