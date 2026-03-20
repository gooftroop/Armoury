'use client';

/**
 * ProfileTileView — pure render component that switches between the
 * authenticated profile display and the unauthenticated sign-in prompt
 * based on the `isAuthenticated` flag.
 *
 * ZERO state, ZERO side effects — delegates entirely to leaf render
 * components.
 *
 * @module ProfileTileView
 */

import * as React from 'react';
import { AuthenticatedProfile } from '@/components/profile/AuthenticatedProfile.js';
import type { AuthenticatedProfileProps } from '@/components/profile/AuthenticatedProfile.js';
import { UnauthenticatedPrompt } from '@/components/profile/UnauthenticatedPrompt.js';
import type { UnauthenticatedPromptProps } from '@/components/profile/UnauthenticatedPrompt.js';

/**
 * @requirements
 * 1. Must be a pure render component — no hooks, no side effects.
 * 2. Must show AuthenticatedProfile when isAuthenticated is true.
 * 3. Must show UnauthenticatedPrompt when isAuthenticated is false.
 * 4. Must NOT use data-testid attributes.
 * 5. Must follow the orchestrational/render split pattern.
 */

/** Props for ProfileTileView. */
export type ProfileTileViewProps =
    | ({ isAuthenticated: true } & AuthenticatedProfileProps)
    | ({ isAuthenticated: false } & UnauthenticatedPromptProps);

/**
 * Renders either the authenticated profile tile or the unauthenticated
 * sign-in prompt depending on auth state.
 *
 * @param props - Discriminated union props keyed on `isAuthenticated`.
 * @returns The appropriate profile tile element.
 */
export function ProfileTileView(props: ProfileTileViewProps): React.ReactElement {
    if (props.isAuthenticated) {
        const { isAuthenticated: _, ...authenticatedProps } = props;

        return <AuthenticatedProfile {...authenticatedProps} />;
    }

    const { isAuthenticated: _, ...unauthenticatedProps } = props;

    return <UnauthenticatedPrompt {...unauthenticatedProps} />;
}

ProfileTileView.displayName = 'ProfileTileView';
