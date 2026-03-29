/**
 * Custom Playwright test fixtures for the Armoury web e2e tests.
 *
 * Extends the base Playwright test with project-specific helpers such as
 * locale-aware navigation utilities and Auth0 profile endpoint mocking.
 *
 * @requirements
 * 1. Must re-export a `test` fixture and `expect` for use in all spec files.
 * 2. Must provide an `appLocale` fixture defaulting to 'en'.
 * 3. Must provide a `gotoWithLocale` helper that navigates with locale prefix when needed.
 * 4. Must intercept GET /auth/profile to return 204 when Auth0 is not configured,
 *    preventing useUser() from hanging on unresolvable requests in CI.
 */

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Custom fixtures available in every test.
 */
interface ArmouryFixtures {
    /** The active application locale for the test (defaults to 'en'). */
    appLocale: string;

    /**
     * Navigates to a path, prepending the locale prefix only when the i18n
     * routing configuration requires it.
     *
     * Because the app uses `localePrefix: 'as-needed'` with a single locale ('en'),
     * the default locale does NOT require a prefix. This helper future-proofs
     * tests for multi-locale support.
     *
     * @param page - The Playwright page instance.
     * @param path - The path to navigate to (e.g., '/wh40k10e/armies').
     */
    gotoWithLocale: (page: Page, path: string) => Promise<void>;
}

/**
 * Extended Playwright test with Armoury-specific fixtures.
 *
 * Use this `test` export in all spec files instead of the base `@playwright/test` import.
 */
export const test = base.extend<ArmouryFixtures>({
    appLocale: ['en', { option: true }],

    // Intercept Auth0 profile endpoint so useUser() resolves to
    // { user: undefined, isLoading: false } instead of hanging when
    // Auth0 is not configured (CI environments without real credentials).
    page: async ({ page }, use) => {
        await page.route('**/auth/profile', (route) => route.fulfill({ status: 204, body: '' }));
        await use(page);
    },

    gotoWithLocale: async ({ appLocale }, use) => {
        const navigate = async (page: Page, path: string): Promise<void> => {
            // With 'as-needed' locale prefix and 'en' as default, no prefix is needed.
            // For non-default locales, prepend the locale.
            const prefix = appLocale === 'en' ? '' : `/${appLocale}`;
            await page.goto(`${prefix}${path}`);
        };

        await use(navigate);
    },
});

export { expect };
