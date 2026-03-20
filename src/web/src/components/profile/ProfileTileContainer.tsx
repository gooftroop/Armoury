'use client';

/**
 * ProfileTileContainer — orchestrational component that owns auth state
 * client-side via the Auth0 useUser() hook and renders the appropriate
 * leaf component directly.
 *
 * Reads user state via SWR (GET /auth/profile). While the auth state is
 * resolving — or while a silent-auth redirect is in flight — a skeleton
 * placeholder is shown instead of flashing the wrong content.
 *
 * Contains ZERO visual markup — all UI is in AuthenticatedProfile,
 * UnauthenticatedPrompt, and ProfileTileSkeleton.
 *
 * @module ProfileTileContainer
 */

import { useUser } from '@auth0/nextjs-auth0';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { AuthenticatedProfile } from '@/components/profile/AuthenticatedProfile.js';
import { ProfileTileSkeleton } from '@/components/profile/ProfileTileSkeleton.js';
import { UnauthenticatedPrompt } from '@/components/profile/UnauthenticatedPrompt.js';
import { SILENT_AUTH_ATTEMPTED_KEY } from '@/lib/silentAuthConstants.js';

/**
 * @requirements
 * 1. Must be a client component with 'use client' directive.
 * 2. Must own auth state via useUser() from @auth0/nextjs-auth0.
 * 3. Must show ProfileTileSkeleton while auth state is loading.
 * 4. Must show ProfileTileSkeleton when silent auth has not yet been attempted
 *    (a redirect is imminent and the user will be logged in momentarily).
 * 5. Must render AuthenticatedProfile when user is present.
 * 6. Must render UnauthenticatedPrompt when user is null and silent auth is complete.
 * 7. Must use next-intl useTranslations('landing') for all strings.
 * 8. Must contain ZERO visual markup — renders leaf components directly.
 * 9. Must follow the orchestrational/render split pattern.
 * 10. Must NOT use data-testid attributes.
 * 11. Must NOT use boolean flag props to switch between leaf components.
 */

/** Props for ProfileTileContainer. */
export interface ProfileTileContainerProps {
    /** Current locale for building profile/settings href. */
    locale: string;
}

/**
 * Returns true when a silent-auth redirect has not yet been attempted in
 * this browser session. In that scenario a redirect is imminent and we
 * should display a skeleton rather than the sign-in prompt.
 */
function isSilentAuthPending(): boolean {
    try {
        return sessionStorage.getItem(SILENT_AUTH_ATTEMPTED_KEY) === null;
    } catch {
        // sessionStorage unavailable (SSR, privacy mode, etc.) — assume not pending.
        return false;
    }
}

/**
 * Orchestrator that owns client-side auth state and renders the appropriate
 * leaf component directly. Shows a skeleton while auth resolves or while a
 * silent-auth redirect is in flight, preventing the flash of wrong content.
 *
 * @param props - Container props with locale.
 * @returns The rendered profile tile (skeleton, authenticated, or unauthenticated).
 */
export function ProfileTileContainer({ locale }: ProfileTileContainerProps): React.ReactElement {
    const { user, isLoading } = useUser();
    const t = useTranslations('landing');

    if (isLoading) {
        return <ProfileTileSkeleton />;
    }

    if (user) {
        return (
            <AuthenticatedProfile
                name={String(user.name ?? '')}
                picture={String(user.picture ?? '')}
                welcomeText={t('welcome', { name: String(user.name ?? '') })}
                settingsLabel={t('editProfile')}
                settingsHref={`/${locale}/account`}
            />
        );
    }

    // When silent auth hasn't been attempted yet, SilentAuthCheck is about to
    // redirect — show a skeleton so the user doesn't see the sign-in prompt
    // for a split second before being automatically logged in.
    if (isSilentAuthPending()) {
        return <ProfileTileSkeleton />;
    }

    return (
        <UnauthenticatedPrompt
            signInPrefix={t('auth.signInPrefix')}
            signInLabel={t('auth.signInLink')}
            createAccountPrefix={t('auth.createAccountPrefix')}
            createAccountLabel={t('auth.createAccountLink')}
        />
    );
}

ProfileTileContainer.displayName = 'ProfileTileContainer';
