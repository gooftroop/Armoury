'use client';

/**
 * Authenticated landing experience — shown when the user has a valid Auth0 session.
 *
 * Renders ProfileTileContainer (authenticated view) and the SystemGrid for
 * browsing/downloading game systems. Account data is hydrated from
 * server-prefetched React Query state — no additional fetch on mount.
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must render ProfileTileContainer with user data.
 * 3. Must render SystemGrid with isAuthenticated=true.
 * 4. Must NOT use data-testid attributes.
 *
 * @module authenticated-landing
 */

import * as React from 'react';
import type { GameSystemManifest } from '@armoury/data-dao';

import { SystemGrid } from '@/components/SystemGridContainer.js';
import { ProfileTileContainer } from '@/components/profile/index.js';

/** Minimal Auth0 user shape needed for the landing tile. */
export interface LandingUser {
    /** Auth0 subject identifier. */
    sub: string;
    /** Display name. */
    name: string;
    /** Profile picture URL. */
    picture: string;
}

/** Props for the AuthenticatedLanding component. */
export interface AuthenticatedLandingProps {
    /** Auth0 user profile subset. */
    user: LandingUser;
    /** Discovered game system manifests. */
    manifests: GameSystemManifest[];
    /** Current locale for profile link. */
    locale: string;
}

/**
 * Renders the authenticated landing page content: profile tile + system grid.
 *
 * @param props - Component props.
 * @returns The rendered authenticated landing experience.
 */
export function AuthenticatedLanding({ user, manifests, locale }: AuthenticatedLandingProps): React.ReactElement {
    return (
        <>
            {/* Positioned in upper-right on md+ screens, normal flow on small screens */}
            <div className="mb-8 md:absolute md:right-6 md:top-6 md:mb-0">
                <ProfileTileContainer user={user} locale={locale} />
            </div>

            <SystemGrid manifests={manifests} isAuthenticated={true} userId={user.sub} />
        </>
    );
}

AuthenticatedLanding.displayName = 'AuthenticatedLanding';
