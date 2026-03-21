/**
 * Auth0 SPA SDK client singleton for client-side SSO session detection.
 *
 * Creates an Auth0Client from @auth0/auth0-spa-js configured with:
 * - Custom domain (auth.armoury-app.com) for first-party cookie support
 * - In-memory cache (no localStorage)
 * - Refresh token rotation with iframe fallback
 *
 * This client is used exclusively by SilentAuthCheck to detect an existing
 * Auth0 SSO session without a full-page redirect. Once an SSO session is
 * confirmed, the component redirects to /auth/login?prompt=none to establish
 * the server-side session cookie for @auth0/nextjs-auth0.
 *
 * @requirements
 * 1. Must export a lazy singleton Auth0Client (created on first call).
 * 2. Must use NEXT_PUBLIC_AUTH0_DOMAIN, NEXT_PUBLIC_AUTH0_CLIENT_ID, and NEXT_PUBLIC_AUTH0_AUDIENCE env vars.
 * 3. Must use cacheLocation 'memory' (no localStorage per project constraint).
 * 4. Must enable useRefreshTokens for refresh token rotation.
 * 5. Must enable useRefreshTokensFallback for iframe-based silent auth.
 * 6. Must return null when required env vars are missing.
 *
 * @module auth0SpaClient
 */

import { Auth0Client } from '@auth0/auth0-spa-js';

let spaClient: Auth0Client | null = null;

/**
 * Returns the Auth0 SPA SDK client singleton, or null when env vars are missing.
 *
 * The client is created lazily on first invocation. Subsequent calls return the
 * same instance. Uses in-memory token cache and refresh token rotation with
 * iframe fallback for SSO detection.
 */
export function getAuth0SpaClient(): Auth0Client | null {
    if (spaClient) {
        return spaClient;
    }

    const domain = process.env['NEXT_PUBLIC_AUTH0_DOMAIN'];
    const clientId = process.env['NEXT_PUBLIC_AUTH0_CLIENT_ID'];

    if (!domain || !clientId) {
        return null;
    }

    spaClient = new Auth0Client({
        domain,
        clientId,
        authorizationParams: {
            audience: process.env['NEXT_PUBLIC_AUTH0_AUDIENCE'],
        },
        cacheLocation: 'memory',
        useRefreshTokens: true,
        useRefreshTokensFallback: true,
    });

    return spaClient;
}
