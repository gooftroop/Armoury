/**
 * Pure render view for the profile tile.
 *
 * Delegates to AuthenticatedProfile or UnauthenticatedPrompt based on
 * the isAuthenticated prop. Contains no hooks, state, or side effects.
 *
 * @requirements
 * 1. Must render AuthenticatedProfile when isAuthenticated is true.
 * 2. Must render UnauthenticatedPrompt when isAuthenticated is false.
 * 3. Must be a pure render component — no hooks, no side effects.
 * 4. Must forward all relevant props to the appropriate sub-component.
 *
 * @module profile-tile-view
 */

import * as React from 'react';

import { AuthenticatedProfile } from '@/components/profile/AuthenticatedProfile.js';
import { UnauthenticatedPrompt } from '@/components/profile/UnauthenticatedPrompt.js';

/** Props for ProfileTileView. */
export interface ProfileTileViewProps {
    /** Whether the current user is authenticated. */
    isAuthenticated: boolean;
    /** Authenticated user display name. */
    userName?: string;
    /** Authenticated user avatar URL. */
    userPicture?: string;
    /** Auth callback for sign-in action. */
    onSignIn: () => void;
    /** Auth callback for create-account action. */
    onCreateAccount: () => void;
    /** Navigation callback to account settings. */
    onSettings?: () => void;
}

/**
 * Pure render profile tile that switches between authenticated and unauthenticated states.
 *
 * @param props - Profile tile view props.
 * @returns The appropriate profile sub-component based on auth state.
 */
function ProfileTileView({
    isAuthenticated,
    userName,
    userPicture,
    onSignIn,
    onCreateAccount,
    onSettings,
}: ProfileTileViewProps): React.ReactElement {
    if (isAuthenticated) {
        return <AuthenticatedProfile userName={userName} userPicture={userPicture} onSettings={onSettings} />;
    }

    return <UnauthenticatedPrompt onSignIn={onSignIn} onCreateAccount={onCreateAccount} />;
}

ProfileTileView.displayName = 'ProfileTileView';

export { ProfileTileView };
