/**
 * E2E bridge fixture for Playwright tests.
 *
 * Sets `window.__ARMOURY_E2E__` on every page before navigation so that
 * the DataContextManagerProvider installs the e2eManager bridge at runtime.
 * Production builds never set this flag.
 *
 * @requirements
 * 1. Must set window.__ARMOURY_E2E__ = true via page.addInitScript before any page loads.
 * 2. Must use { auto: true } so the fixture runs automatically for all tests.
 * 3. Must NOT import any app code — this is a browser-side flag only.
 */

import { test as base, type Page } from '@playwright/test';

type E2EBridgeFixtures = {
    e2eBridge: void;
};

export const test = base.extend<E2EBridgeFixtures>({
    e2eBridge: [
        async ({ page }: { page: Page }, use: () => Promise<void>) => {
            await page.addInitScript(() => {
                (window as { __ARMOURY_E2E__?: boolean }).__ARMOURY_E2E__ = true;
            });
            await use();
        },
        { auto: true },
    ],
});

export { expect } from '@playwright/test';
