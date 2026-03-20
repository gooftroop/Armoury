'use client';

/**
 * Authenticated landing experience — shown when the user has a valid Auth0 session.
 *
 * Renders ProfileTileContainer (which owns its own auth state client-side) and
 * the SystemGrid for browsing/downloading game systems. Account data is hydrated
 * from server-prefetched React Query state — no additional fetch on mount.
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must render ProfileTileContainer with locale (auth state owned internally).
 * 3. Must render SystemGrid with userId for account persistence.
 * 4. Must NOT use data-testid attributes.
 *
 * @module authenticated-landing
 */

import * as React from 'react';
import type { GameSystemManifest } from '@armoury/data-dao';

import { SystemGrid } from '@/components/SystemGridContainer.js';
import { ProfileTileContainer } from '@/components/profile/index.js';

/** Props for the AuthenticatedLanding component. */
export interface AuthenticatedLandingProps {
    /** Auth0 subject identifier needed by SystemGrid for account persistence. */
    userId: string;
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
export function AuthenticatedLanding({ userId, manifests, locale }: AuthenticatedLandingProps): React.ReactElement {
    return (
        <>
            {/* Positioned in upper-right on md+ screens, normal flow on small screens */}
            <div className="mb-8 md:absolute md:right-6 md:top-6 md:mb-0">
                <ProfileTileContainer locale={locale} />
            </div>

            <SystemGrid manifests={manifests} userId={userId} />
        </>
    );
}

AuthenticatedLanding.displayName = 'AuthenticatedLanding';
