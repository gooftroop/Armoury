/**
 * Auth0 session setup for Playwright e2e tests.
 *
 * Forges an authenticated session cookie using `generateSessionCookie` from
 * `@auth0/nextjs-auth0/testing` instead of driving the real Auth0 Universal
 * Login UI. This makes authenticated tests deterministic, fast, and
 * zero-network-dependency — no test tenant credentials required.
 *
 * The forged cookie is injected into the browser context and the resulting
 * storageState is saved so downstream test projects can reuse the session.
 *
 * @requirements
 * 1. Must forge a session cookie using generateSessionCookie.
 * 2. Must use AUTH0_SECRET (or fallback 'e2e-test-secret') for cookie signing.
 * 3. Must inject the cookie into the browser context with correct attributes.
 * 4. Must save storageState to src/web/e2e/.auth/user.json.
 * 5. Must provide a realistic session shape (user sub, email, tokenSet).
 * 6. Must include INTERNAL_ID_CLAIM in the user object for authenticated landing + account persistence.
 * 7. Must export E2E_USER_ID and E2E_USER_SUB for use by LocalStack seeding and test assertions.
 */

import { test as setup } from '@playwright/test';
import { generateSessionCookie } from '@auth0/nextjs-auth0/testing';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Path where authenticated session state is persisted between projects. */
const AUTH_STATE_PATH = './src/web/e2e/.auth/user.json';

/** Auth0 session cookie name used by the v4 SDK. */
const AUTH0_COOKIE_NAME = '__session';

/** Must match INTERNAL_ID_CLAIM in src/web/src/lib/auth0.ts. */
const INTERNAL_ID_CLAIM = 'https://armoury.app/internal_id';

/** Must match the seeded user in LocalStack (see e2e/fixtures/localstack.ts). */
export const E2E_USER_ID = 'e2e-test-user-00000000-0000-0000-0000-000000000001';

export const E2E_USER_SUB = 'auth0|e2e-test-user';

setup('forge authenticated session', async ({ context }) => {
    const secret = process.env['AUTH0_SECRET'] ?? 'e2e-test-secret';

    const cookieValue = await generateSessionCookie(
        {
            user: {
                sub: E2E_USER_SUB,
                email: 'e2e@armoury.test',
                name: 'E2E Test User',
                email_verified: true,
                [INTERNAL_ID_CLAIM]: E2E_USER_ID,
            },
            tokenSet: {
                accessToken: 'e2e-fake-access-token',
                expiresAt: Math.floor(Date.now() / 1000) + 86_400, // 24 hours from now
            },
        },
        { secret },
    );

    await context.addCookies([
        {
            name: AUTH0_COOKIE_NAME,
            value: cookieValue,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
        },
    ]);

    // Ensure the auth state directory exists before saving.
    await mkdir(dirname(AUTH_STATE_PATH), { recursive: true });

    await context.storageState({ path: AUTH_STATE_PATH });
});
