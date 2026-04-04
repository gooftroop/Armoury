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
 */

import { test as base, expect } from '@playwright/test';
import type { Page, Request } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { seedTestUser } from './localstack.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GITHUB_HAR_PATH = resolve(__dirname, 'har/github-wh40k10e.har');

interface ArmouryFixtures {
    appLocale: string;
    gotoWithLocale: (page: Page, path: string) => Promise<void>;
    seedDb: void;
    usersApiRequests: Request[];
}

export const test = base.extend<ArmouryFixtures>({
    appLocale: ['en', { option: true }],

    seedDb: [
        async (_deps, use) => {
            const teardown = await seedTestUser();
            await use();
            await teardown();
        },
        { auto: true },
    ],

    page: async ({ page, seedDb: _ }, use) => {
        await page.route('**/auth/profile', (route) => route.fulfill({ status: 204, body: '' }));

        const isRecording = process.env['E2E_HAR_RECORD'] === 'true';

        await page.routeFromHAR(GITHUB_HAR_PATH, {
            url: '**/api/github/**',
            update: isRecording,
            updateContent: 'embed',
            notFound: isRecording ? 'fallback' : 'abort',
        });

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
