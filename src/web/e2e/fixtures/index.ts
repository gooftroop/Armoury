/**
 * Custom Playwright test fixtures for the Armoury web e2e tests.
 *
 * @requirements
 * 1. Must re-export a `test` fixture and `expect` for use in all spec files.
 * 2. Must provide an `appLocale` fixture defaulting to 'en'.
 * 3. Must provide a `gotoWithLocale` helper that navigates with locale prefix when needed.
 * 4. Must intercept GET /auth/profile: return 200 with user for authenticated projects,
 *    401 for chromium-public so unauthenticated tests see the real unauthenticated UI.
 * 5. Must intercept /auth/access-token, /auth/login, and window.location.assign
 *    to prevent Auth0 client-side auth flows from navigating away.
 * 6. Must provide HAR recording/playback for GitHub proxy requests.
 *    - E2E_HAR_RECORD=true → records live requests; otherwise replays from HAR file.
 * 7. Must provide a `usersApiRequests` fixture that collects PUT /account requests.
 * 8. Must seed a test user and account in Postgres before authenticated tests run.
 * 9. Must intercept POST /api/wahapedia with an empty HTML stub so the
 *    ChapterApprovedDAO sync succeeds without reaching wahapedia.ru.
 * 10. Must intercept PUT /account requests so putAccount (routed through
 *     localhost:3000) returns a 200 instead of triggering auth middleware redirects.
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

    page: async ({ page, seedDb: _ }, use, testInfo) => {
        const isPublicProject = testInfo.project.name === 'chromium-public';

        await page.route('**/auth/profile', (route) =>
            isPublicProject
                ? route.fulfill({ status: 401, body: '' })
                : route.fulfill({
                      status: 200,
                      contentType: 'application/json',
                      body: JSON.stringify(E2E_USER_PROFILE),
                  }),
        );

        // Prevent Auth0 client-side flows from navigating to /auth/login.
        // Three code paths can trigger this:
        //   1. window.location.assign()  — SilentAuthCheck
        //   2. window.location.replace() — potential Auth0 SDK path
        //   3. window.location.href =    — UnauthenticatedLanding click handler
        //
        // Only intercept for authenticated projects — public tests need the
        // redirect to /auth/login to actually happen (e.g. tile click → login).
        await page.addInitScript((blockAuthRedirects: boolean) => {
            if (!blockAuthRedirects) {return;}

            const originalAssign = window.location.assign.bind(window.location);

            window.location.assign = (url: string | URL) => {
                if (String(url).includes('/auth/login')) {return;}

                originalAssign(url);
            };

            const originalReplace = window.location.replace.bind(window.location);

            window.location.replace = (url: string | URL) => {
                if (String(url).includes('/auth/login')) {return;}

                originalReplace(url);
            };

            // Intercept window.location.href = '/auth/login?...' via Navigation API.
            // Available in Chromium ≥105 (our e2e target).
            const nav = (window as unknown as Record<string, unknown>).navigation as
                | { addEventListener(type: string, cb: (e: Event & { destination: { url: string } }) => void): void }
                | undefined;

            if (nav) {
                nav.addEventListener('navigate', (e) => {
                    if (e.destination.url.includes('/auth/login')) {
                        e.preventDefault();
                    }
                });
            }
        }, !isPublicProject);

        await page.route('**/auth/access-token', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ token: 'e2e-fake-token' }),
            }),
        );

        // Network-level fallback: intercept /auth/login so fetch-initiated
        // redirects (e.g. ky following a 302) don't navigate to Auth0.
        await page.route('**/auth/login*', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: '<!-- e2e: auth/login intercepted -->',
            }),
        );

        // Mock the users API account endpoint. putAccount sends PUT to
        // USERS_BASE_URL/{userId}/account which defaults to localhost:3000,
        // routing through Next.js middleware and causing auth redirects.
        await page.route('**/account', (route) => {
            if (route.request().method() === 'PUT') {
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ systems: {} }),
                });
            }

            return route.fallback();
        });

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
