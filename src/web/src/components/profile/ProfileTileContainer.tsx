'use client';

/**
 * ProfileTileContainer — orchestrational component that owns auth state
 * client-side via the Auth0 useUser() hook and renders the appropriate
 * leaf component directly.
 *
 * Reads user state via SWR (GET /auth/profile). While the auth state is
 * resolving a skeleton placeholder is shown instead of flashing the wrong
 * content.
 *
 * Contains ZERO visual markup — all UI is in AuthenticatedProfile,
 * UnauthenticatedPrompt, and ProfileTileSkeleton.
 *
 * @module ProfileTileContainer
 */

import { useUser } from '@auth0/nextjs-auth0';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { AuthenticatedProfile } from '@/components/profile/AuthenticatedProfile.js';
import { ProfileTileSkeleton } from '@/components/profile/ProfileTileSkeleton.js';
import { UnauthenticatedPrompt } from '@/components/profile/UnauthenticatedPrompt.js';

/**
 * @requirements
 * 1. Must be a client component with 'use client' directive.
 * 2. Must own auth state via useUser() from @auth0/nextjs-auth0.
 * 3. Must show ProfileTileSkeleton while auth state is loading.
 * 4. Must render AuthenticatedProfile when user is present.
 * 5. Must render UnauthenticatedPrompt when user is null/error and auth is resolved.
 * 6. Must use next-intl useTranslations('landing') for all strings.
 * 7. Must contain ZERO visual markup — renders leaf components directly.
 * 8. Must follow the orchestrational/render split pattern.
 * 9. Must NOT use data-testid attributes.
 * 10. Must NOT use boolean flag props to switch between leaf components.
 */

/** Props for ProfileTileContainer. */
export interface ProfileTileContainerProps {
    /** Current locale for building profile/settings href. */
    locale: string;
}

/**
 * Orchestrator that owns client-side auth state and renders the appropriate
 * leaf component directly. Shows a skeleton while auth resolves, preventing
 * the flash of wrong content.
 *
 * @param props - Container props with locale.
 * @returns The rendered profile tile (skeleton, authenticated, or unauthenticated).
 */
export function ProfileTileContainer({ locale }: ProfileTileContainerProps): ReactElement {
    const { user, error, isLoading } = useUser();
    const t = useTranslations('landing');

    if (isLoading && !error) {
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
                signOutLabel={t('signOut')}
                signOutHref="/auth/logout"
            />
        );
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
