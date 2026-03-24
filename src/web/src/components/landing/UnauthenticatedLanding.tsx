'use client';

/**
 * Unauthenticated landing experience — shown when no Auth0 session exists.
 *
 * Renders ProfileTileContainer (unauthenticated prompt) and the SystemGrid
 * (which will redirect to Auth0 login when a tile is clicked).
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must render ProfileTileContainer without user prop.
 * 3. Must render SystemGrid with onUnauthenticatedClick redirect callback.
 * 4. Must NOT use data-testid attributes.
 *
 * @module unauthenticated-landing
 */

import * as React from 'react';
import type { GameSystemManifest } from '@armoury/data-dao';

import { SystemGrid } from '@/components/SystemGridContainer.js';
import { ProfileTileContainer } from '@/components/profile/index.js';

/** Props for the UnauthenticatedLanding component. */
export interface UnauthenticatedLandingProps {
    /** Discovered game system manifests. */
    manifests: GameSystemManifest[];
    /** Current locale for profile link. */
    locale: string;
}

/**
 * Renders the unauthenticated landing page content: profile prompt + system grid.
 *
 * @param props - Component props.
 * @returns The rendered unauthenticated landing experience.
 */
export function UnauthenticatedLanding({ manifests, locale }: UnauthenticatedLandingProps): React.ReactElement {
    const handleUnauthenticatedClick = React.useCallback(() => {
        const returnTo = window.location.pathname + window.location.search + window.location.hash;
        window.location.href = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
    }, []);

    return (
        <>
            {/* Positioned in upper-right on md+ screens, normal flow on small screens */}
            <div className="mb-8 md:absolute md:right-6 md:top-6 md:mb-0">
                <ProfileTileContainer locale={locale} />
            </div>

            <SystemGrid manifests={manifests} onUnauthenticatedClick={handleUnauthenticatedClick} />
        </>
    );
}

UnauthenticatedLanding.displayName = 'UnauthenticatedLanding';
