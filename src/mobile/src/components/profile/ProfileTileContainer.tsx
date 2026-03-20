/**
 * Orchestrational container for the profile tile component.
 *
 * Owns auth state via useAuth0() and routing via useRouter(), then renders
 * the appropriate leaf component directly. This keeps the auth boundary
 * co-located with the profile UI instead of bubbling through the landing route.
 *
 * @requirements
 * 1. Must own useAuth0() for user state and auth callbacks.
 * 2. Must own useRouter() for account-settings navigation.
 * 3. Must contain ZERO visual markup — render leaf components directly.
 * 4. Must provide sign-in, create-account, and settings callbacks.
 * 5. Must NOT use boolean flag props to switch between leaf components.
 *
 * @module profile-tile-container
 */

import * as React from 'react';
import { useRouter } from 'expo-router';
import { useAuth0 } from 'react-native-auth0';

import { AuthenticatedProfile } from '@/components/profile/AuthenticatedProfile.js';
import { UnauthenticatedPrompt } from '@/components/profile/UnauthenticatedPrompt.js';

/**
 * Orchestrational wrapper that reads auth state and renders the appropriate leaf component.
 *
 * @returns AuthenticatedProfile or UnauthenticatedPrompt based on auth state.
 */
function ProfileTileContainer(): React.ReactElement {
    const { user, authorize } = useAuth0();
    const router = useRouter();
    const isAuthenticated = user !== null && user !== undefined;

    const handleSignIn = (): void => {
        void authorize({ scope: 'openid profile email' });
    };

    // Auth0 universal login handles both sign-in and registration on the same screen
    const handleCreateAccount = (): void => {
        void authorize({ scope: 'openid profile email' });
    };

    const handleSettings = (): void => {
        router.push('/account');
    };

    if (isAuthenticated) {
        return <AuthenticatedProfile userName={user?.name} userPicture={user?.picture} onSettings={handleSettings} />;
    }

    return <UnauthenticatedPrompt onSignIn={handleSignIn} onCreateAccount={handleCreateAccount} />;
}

ProfileTileContainer.displayName = 'ProfileTileContainer';

export { ProfileTileContainer };
