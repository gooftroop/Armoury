'use client';

/**
 * Authenticated landing experience — shown when the user has a valid Auth0 session.
 *
 * Displays a compact user tile (avatar, welcome text, settings link) and the
 * SystemGrid for browsing/downloading game systems. Account data is hydrated
 * from server-prefetched React Query state — no additional fetch on mount.
 *
 * @requirements
 * 1. Must be a Client Component ('use client').
 * 2. Must render a user tile with avatar, welcome text, and settings link.
 * 3. Must render SystemGrid with isAuthenticated=true.
 * 4. Must use next-intl useTranslations for all user-facing strings.
 * 5. Must reuse the user tile design from the original page.tsx.
 *
 * @module authenticated-landing
 */

import { useTranslations } from 'next-intl';
import type { GameSystemManifest } from '@armoury/data-dao';

import { SystemGrid } from '@/components/SystemGridContainer.js';
import { UserWelcomeTile } from '@/components/landing/UserWelcomeTile.js';

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
 * Renders the authenticated landing page content: user tile + system grid.
 *
 * @param props - Component props.
 * @returns The rendered authenticated landing experience.
 */
export function AuthenticatedLanding({ user, manifests, locale }: AuthenticatedLandingProps): React.ReactElement {
    const t = useTranslations('landing');

    return (
        <>
            <UserWelcomeTile
                name={user.name}
                picture={user.picture}
                welcomeText={t('welcome', { name: user.name })}
                settingsLabel={t('editProfile')}
                settingsHref={`/${locale}/account`}
            />

            <SystemGrid manifests={manifests} isAuthenticated={true} userId={user.sub} />
        </>
    );
}

AuthenticatedLanding.displayName = 'AuthenticatedLanding';
