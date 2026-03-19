'use client';

/**
 * Unauthenticated landing experience — shown when no Auth0 session exists.
 *
 * Displays sign-in / sign-up links and the SystemGrid (which will redirect
 * to Auth0 login when a tile is clicked).
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must render sign-in and sign-up auth links.
 * 3. Must render SystemGrid with isAuthenticated=false.
 * 4. Must use next-intl useTranslations for all user-facing strings.
 * 5. Must reuse the auth link design from the original page.tsx.
 *
 * @module unauthenticated-landing
 */

import type { GameSystemManifest } from '@armoury/data-dao';

import { SystemGrid } from '@/components/SystemGridContainer.js';
import { AuthLinks } from '@/components/landing/AuthLinks.js';

/** Props for the UnauthenticatedLanding component. */
export interface UnauthenticatedLandingProps {
    /** Discovered game system manifests. */
    manifests: GameSystemManifest[];
}

/**
 * Renders the unauthenticated landing page content: auth links + system grid.
 *
 * @param props - Component props.
 * @returns The rendered unauthenticated landing experience.
 */
export function UnauthenticatedLanding({ manifests }: UnauthenticatedLandingProps): React.ReactElement {
    return (
        <>
            <AuthLinks />

            <SystemGrid manifests={manifests} isAuthenticated={false} />
        </>
    );
}

UnauthenticatedLanding.displayName = 'UnauthenticatedLanding';
