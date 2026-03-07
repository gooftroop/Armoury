/**
 * Auth0 authentication provider for the mobile application.
 *
 * Wraps the application tree with Auth0Provider from `react-native-auth0`,
 * reading domain and clientId from Expo environment variables. The Auth0 SDK
 * handles secure token storage and session persistence automatically on device.
 *
 * @requirements
 * 1. Must wrap children with Auth0Provider from react-native-auth0.
 * 2. Must read Auth0 domain and clientId from EXPO_PUBLIC_ environment variables.
 * 3. Must throw if required environment variables are missing at initialization.
 *
 * @module auth-provider
 */

import * as React from 'react';
import { Auth0Provider } from 'react-native-auth0';

/**
 * Props for the {@link AuthProvider} component.
 */
export interface AuthProviderProps {
    /** Child components that can access Auth0 via useAuth0(). */
    children: React.ReactNode;
}

/**
 * Auth0 authentication provider for the mobile app.
 *
 * Reads `EXPO_PUBLIC_AUTH0_DOMAIN` and `EXPO_PUBLIC_AUTH0_CLIENT_ID` from the
 * environment and wraps the application tree with `Auth0Provider`. Consumers
 * access authentication state and methods via the `useAuth0` hook from
 * `react-native-auth0`.
 *
 * @param props - Component props containing children to wrap.
 * @returns The Auth0Provider-wrapped React tree.
 * @throws Error if required Auth0 environment variables are not set.
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
    const domain = process.env['EXPO_PUBLIC_AUTH0_DOMAIN'];
    const clientId = process.env['EXPO_PUBLIC_AUTH0_CLIENT_ID'];

    if (!domain || !clientId) {
        throw new Error(
            'Auth0 configuration missing. Set EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID in .env',
        );
    }

    return (
        <Auth0Provider domain={domain} clientId={clientId}>
            {children}
        </Auth0Provider>
    );
}
