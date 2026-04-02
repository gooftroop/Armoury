/**
 * Combined middleware for Auth0 authentication and next-intl i18n routing.
 *
 * Auth0 v4 middleware must run on every matched request to support rolling sessions,
 * token refresh, and automatic route handling (`/auth/login`, `/auth/logout`, `/auth/callback`).
 * After Auth0 processes the request, non-auth routes pass through i18n locale detection.
 *
 * @requirements
 * 1. Must call auth0.middleware() on every request when Auth0 is configured (rolling sessions).
 * 2. Must return the Auth0 response directly for /auth/* routes (SDK-managed).
 * 3. Must merge Auth0 response headers into the intl response (preserves session cookies).
 * 4. Must exclude static assets, API routes, and internal Next.js paths from middleware.
 * 5. Must pass through to intl middleware when Auth0 is not configured (no crash).
 *
 * @module middleware
 */

import { type NextRequest, NextResponse } from 'next/server';

import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing.js';
import { auth0 } from '@/lib/auth0.js';

/** Middleware for next-intl locale detection and routing. */
const intlMiddleware = createIntlMiddleware(routing);

/**
 * Root middleware composing Auth0 and i18n handling.
 *
 * Auth0 middleware runs on every request for rolling sessions and token refresh.
 * Auth routes (`/auth/*`) are handled exclusively by the Auth0 SDK.
 * All remaining routes flow through i18n locale detection.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    /**
     * Auth0 v4 middleware must process every request for rolling sessions and
     * token refresh. When Auth0 is not configured, skip to intl middleware.
     */
    if (auth0) {
        const authResponse = (await auth0.middleware(request)) as NextResponse;

        /** Auth0 SDK routes — handled entirely by the SDK (login, logout, callback). */
        if (pathname.startsWith('/auth/')) {
            return authResponse;
        }

        /**
         * Non-auth routes: run intl middleware for locale detection, but merge
         * Auth0 response headers (especially Set-Cookie for session) into the
         * intl response so rolling session cookies reach the browser.
         */
        const intlResponse = intlMiddleware(request);

        authResponse.headers.forEach((value, name) => {
            intlResponse.headers.append(name, value);
        });

        return intlResponse;
    }

    /** Auth0 not configured — locale detection + routing only. */
    return intlMiddleware(request);
}

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|js|css|icon|apple-icon|.*\\..*).*)',
};
