'use client';

/**
 * Silent Auth0 SSO session detection for unauthenticated landing visits.
 *
 * Uses the Auth0 SPA SDK (@auth0/auth0-spa-js) to probe for an existing SSO
 * session via a hidden iframe + prompt=none, backed by refresh token rotation.
 * If an SSO session is detected, redirects to /auth/login?prompt=none to
 * establish the server-side session cookie for @auth0/nextjs-auth0.
 *
 * This replaces the previous sessionStorage-guarded blind redirect approach.
 * The SPA SDK handles loop prevention internally — if no SSO session exists,
 * getTokenSilently() throws a 'login_required' error and we simply do nothing.
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must use the Auth0 SPA SDK to detect SSO sessions (no sessionStorage).
 * 3. Must call getTokenSilently() to probe for an active Auth0 SSO session.
 * 4. Must redirect to /auth/login?prompt=none&returnTo=<current path> when SSO session is found.
 * 5. Must silently swallow login_required, consent_required, interaction_required, and missing_refresh_token errors.
 * 6. Must render nothing.
 * 7. Must not use localStorage.
 *
 * @module silent-auth-check
 */

import { useEffect } from 'react';

import { getAuth0SpaClient } from '@/lib/auth0SpaClient.js';

/** Error codes from Auth0 that indicate no active SSO session. */
const EXPECTED_AUTH_ERRORS = new Set([
    'login_required',
    'consent_required',
    'interaction_required',
    'missing_refresh_token',
]);

/**
 * Probes Auth0 for an existing SSO session using the SPA SDK and redirects
 * to establish a server-side session cookie when one is found.
 *
 * Renders nothing. All work is performed as a side-effect on mount.
 */
export function SilentAuthCheck(): null {
    useEffect(() => {
        const client = getAuth0SpaClient();

        if (!client) {
            return;
        }

        let cancelled = false;

        async function detectSsoSession(): Promise<void> {
            try {
                await client!.getTokenSilently();

                if (cancelled) {
                    return;
                }

                const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
                const loginUrl = `/auth/login?prompt=none&returnTo=${encodeURIComponent(returnTo)}`;

                window.location.assign(loginUrl);
            } catch (error: unknown) {
                const code = (error as { error?: string }).error;

                if (code && EXPECTED_AUTH_ERRORS.has(code)) {
                    return;
                }

                /* Unexpected error — swallow gracefully. */
            }
        }

        void detectSsoSession();

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}

SilentAuthCheck.displayName = 'SilentAuthCheck';
