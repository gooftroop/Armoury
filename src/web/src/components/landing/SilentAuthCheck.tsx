'use client';

/**
 * Silent Auth0 check for unauthenticated landing visits.
 *
 * Attempts Auth0 silent authentication once per browser session for visitors
 * who do not currently have a local SDK session cookie. If Auth0 has an
 * active SSO session, the redirect silently logs the user in and returns to
 * the current page. If not, Auth0 callback handling returns the user without
 * creating a session, and this component will not re-attempt in the same
 * browser session.
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must check sessionStorage for an existing silent-auth attempt marker.
 * 3. Must set the marker before redirecting to avoid redirect loops.
 * 4. Must redirect to /auth/login with prompt=none and returnTo=current path.
 * 5. Must render nothing.
 *
 * @module silent-auth-check
 */

import { useEffect } from 'react';

const SILENT_AUTH_ATTEMPTED_KEY = 'armoury:silent-auth-attempted';

/** Renders nothing while performing a one-time silent auth redirect check. */
export function SilentAuthCheck(): null {
    useEffect(() => {
        try {
            const attempted = sessionStorage.getItem(SILENT_AUTH_ATTEMPTED_KEY);

            if (attempted !== null) {
                return;
            }

            sessionStorage.setItem(SILENT_AUTH_ATTEMPTED_KEY, '1');

            const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            const loginUrl = `/auth/login?prompt=none&returnTo=${encodeURIComponent(returnTo)}`;

            window.location.assign(loginUrl);
        } catch {
            return;
        }
    }, []);

    return null;
}

SilentAuthCheck.displayName = 'SilentAuthCheck';
