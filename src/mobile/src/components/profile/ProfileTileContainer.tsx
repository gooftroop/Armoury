/**
 * Orchestrational container for the profile tile component.
 *
 * Owns auth state via useAuth0() and routing via useRouter(), then delegates
 * all rendering to ProfileTileView. This keeps the auth boundary co-located
 * with the profile UI instead of bubbling through the landing route.
 *
 * @requirements
 * 1. Must own useAuth0() for user state and auth callbacks.
 * 2. Must own useRouter() for account-settings navigation.
 * 3. Must contain ZERO visual markup — delegate entirely to ProfileTileView.
 * 4. Must provide sign-in, create-account, and settings callbacks to the view.
 *
 * @module profile-tile-container
 */

import * as React from 'react';
import { useRouter } from 'expo-router';
import { useAuth0 } from 'react-native-auth0';

import { ProfileTileView } from '@/components/profile/ProfileTileView.js';

/**
 * Orchestrational wrapper that reads auth state and provides callbacks to ProfileTileView.
 *
 * @returns ProfileTileView with precomputed auth props and handlers.
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

    return (
        <ProfileTileView
            isAuthenticated={isAuthenticated}
            userName={user?.name}
            userPicture={user?.picture}
            onSignIn={handleSignIn}
            onCreateAccount={handleCreateAccount}
            onSettings={handleSettings}
        />
    );
}

ProfileTileContainer.displayName = 'ProfileTileContainer';

export { ProfileTileContainer };
