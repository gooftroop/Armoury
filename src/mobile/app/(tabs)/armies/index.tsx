/**
 * Armies Tab Screen
 *
 * Route entry point for "The Forge" tab. Resolves the authenticated user's ID
 * and passes it to ForgeContainer, which owns all data fetching and state.
 *
 * @requirements
 * 1. Must render ForgeContainer with the current user's Auth0 subject ID.
 * 2. Must use default export (Expo Router convention for route files).
 */

import { useAuth0 } from 'react-native-auth0';

import { ForgeContainer } from '@/components/forge/ForgeContainer.js';

/**
 * The Forge tab screen.
 *
 * @returns The rendered ForgeContainer wired to the authenticated user.
 */
export default function TabScreen() {
    const { user } = useAuth0();

    return <ForgeContainer userId={user?.sub ?? ''} />;
}
