/**
 * Combined middleware for Auth0 authentication and next-intl i18n routing.
 *
 * Auth0 intercepts its own routes (`/auth/login`, `/auth/logout`, `/auth/callback`).
 * All other requests pass through i18n locale detection and routing.
 *
 * @requirements
 * 1. Must delegate Auth0 routes to the Auth0 middleware.
 * 2. Must delegate all other routes to the next-intl middleware.
 * 3. Must exclude static assets, API routes, and internal Next.js paths from middleware.
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
 * Auth0 callback/login/logout routes are handled exclusively by Auth0.
 * Everything else flows through i18n locale detection.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    /** Auth0 SDK routes — handled entirely by Auth0 middleware. */
    if (pathname.startsWith('/auth/')) {
        return (await auth0.middleware(request)) as NextResponse;
    }

    /** All remaining routes — locale detection + routing. */
    return intlMiddleware(request);
}

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|js|css|.*\\..*).*)',
};
