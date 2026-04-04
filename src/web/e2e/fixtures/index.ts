/**
 * Custom Playwright test fixtures for the Armoury web e2e tests.
 *
 * @requirements
 * 1. Must re-export a `test` fixture and `expect` for use in all spec files.
 * 2. Must provide an `appLocale` fixture defaulting to 'en'.
 * 3. Must provide a `gotoWithLocale` helper that navigates with locale prefix when needed.
 * 4. Must intercept GET /auth/profile to return 204 (prevents useUser() hanging in CI).
 * 5. Must provide HAR recording/playback for GitHub proxy requests.
 *    - E2E_HAR_RECORD=true → records live requests; otherwise replays from HAR file.
 * 6. Must provide a `usersApiRequests` fixture that collects PUT /account requests.
 * 7. Must seed a test user and account in Postgres before authenticated tests run.
 * 8. Must intercept POST /api/wahapedia with an empty HTML stub so the
 *    ChapterApprovedDAO sync succeeds without reaching wahapedia.ru.
 */

import { test as base, expect } from '@playwright/test';
import type { Page, Request } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { E2E_USER_ID, E2E_USER_SUB } from '../constants.js';
import { seedTestUser } from './localstack.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GITHUB_HAR_PATH = resolve(__dirname, 'har/github-wh40k10e.har');

const INTERNAL_ID_CLAIM = 'https://armoury.app/internal_id';

/**
 * User profile returned by the mocked /auth/profile endpoint.
 * Must match the shape forged in auth/setup.ts so useUser() sees
 * the same identity the server-side session contains.
 */
const E2E_USER_PROFILE = {
    sub: E2E_USER_SUB,
    email: 'e2e@armoury.test',
    name: 'E2E Test User',
    email_verified: true,
    [INTERNAL_ID_CLAIM]: E2E_USER_ID,
};

interface ArmouryFixtures {
    appLocale: string;
    gotoWithLocale: (page: Page, path: string) => Promise<void>;
    seedDb: void;
    usersApiRequests: Request[];
}

export const test = base.extend<ArmouryFixtures>({
    appLocale: ['en', { option: true }],

    seedDb: [
        async ({ appLocale: _ }, use) => {
            const teardown = await seedTestUser();
            await use();
            await teardown();
        },
        { auto: true },
    ],

    page: async ({ page, seedDb: _ }, use) => {
        await page.route('**/auth/profile', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(E2E_USER_PROFILE),
            }),
        );

        const isRecording = process.env['E2E_HAR_RECORD'] === 'true';

        await page.routeFromHAR(GITHUB_HAR_PATH, {
            url: '**/api/github/**',
            update: isRecording,
            updateContent: 'embed',
            notFound: isRecording ? 'fallback' : 'abort',
        });

        // Stub the Wahapedia proxy so ChapterApprovedDAO doesn't reach wahapedia.ru.
        // Returning minimal HTML lets the parser produce a valid (empty) ChapterApproved.
        await page.route('**/api/wahapedia', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'text/html; charset=utf-8',
                body: '<html><body></body></html>',
            }),
        );

        await use(page);
    },

    gotoWithLocale: async ({ appLocale }, use) => {
        const navigate = async (page: Page, path: string): Promise<void> => {
            const prefix = appLocale === 'en' ? '' : `/${appLocale}`;
            await page.goto(`${prefix}${path}`);
        };

        await use(navigate);
    },

    // Collects PUT requests to the users API account endpoint for assertion.
    usersApiRequests: async ({ page }, use) => {
        const collected: Request[] = [];

        page.on('request', (request) => {
            if (request.url().includes('/account') && request.method() === 'PUT') {
                collected.push(request);
            }
        });

        await use(collected);
    },
});

export { expect };
