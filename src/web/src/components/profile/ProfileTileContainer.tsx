'use client';

/**
 * ProfileTileContainer — orchestrational component that determines auth
 * state from props and renders the appropriate leaf component directly.
 *
 * Owns the translation hook (useTranslations) and maps raw user data
 * into the localised strings needed by the render layer. Contains ZERO
 * visual markup — all UI is in AuthenticatedProfile and UnauthenticatedPrompt.
 *
 * @module ProfileTileContainer
 */

import { useTranslations } from 'next-intl';
import * as React from 'react';

import { AuthenticatedProfile } from '@/components/profile/AuthenticatedProfile.js';
import { UnauthenticatedPrompt } from '@/components/profile/UnauthenticatedPrompt.js';

/**
 * @requirements
 * 1. Must be a client component with 'use client' directive.
 * 2. Must accept optional user prop — present means authenticated.
 * 3. Must use next-intl useTranslations('landing') for all strings.
 * 4. Must contain ZERO visual markup — renders leaf components directly.
 * 5. Must follow the orchestrational/render split pattern (like ForgeContainer).
 * 6. Must NOT use data-testid attributes.
 * 7. Must NOT use boolean flag props to switch between leaf components.
 */

/** Props for ProfileTileContainer. */
export interface ProfileTileContainerProps {
    /** Auth0 user profile subset. When absent, the user is unauthenticated. */
    user?: {
        /** User display name. */
        name: string;
        /** Profile picture URL. */
        picture: string;
        /** Auth0 subject identifier. */
        sub: string;
    };
    /** Current locale for building profile/settings href. */
    locale: string;
}

/**
 * Orchestrator that resolves auth state from props and renders the
 * appropriate leaf component directly. No visual output of its own.
 *
 * @param props - Container props with optional user and locale.
 * @returns The rendered profile tile (authenticated or unauthenticated).
 */
export function ProfileTileContainer({ user, locale }: ProfileTileContainerProps): React.ReactElement {
    const t = useTranslations('landing');

    if (user) {
        return (
            <AuthenticatedProfile
                name={user.name}
                picture={user.picture}
                welcomeText={t('welcome', { name: user.name })}
                settingsLabel={t('editProfile')}
                settingsHref={`/${locale}/account`}
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
