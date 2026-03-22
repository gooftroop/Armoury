/**
 * @requirements
 * 1. Must initialize Sentry for error tracking.
 * 2. Must render QueryClientProvider with the shared queryClient.
 * 3. Must render TamaguiProvider with the shared config and defaultTheme="dark".
 * 4. Must wrap the layout with Sentry.wrap.
 * 5. Must render the child routes using the Expo Router Slot component.
 * 6. Must wrap the layout with AuthProvider for Auth0 authentication.
 * 7. Must wrap the layout with DataContextProvider for game system data management.
 */

import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { useAuth0 } from 'react-native-auth0';
import { TamaguiProvider } from 'tamagui';
import { queryClient } from '@/lib/queryClient.js';
import { LandingSkeleton } from '@/components/LandingSkeleton.js';
import config from '#/tamagui.config.js';
import { AuthProvider } from '@/providers/AuthProvider.js';
import { DataContextProvider } from '@/providers/DataContextProvider.js';
import { PresenceProvider } from '@/providers/PresenceProvider.js';

/** Initializes Sentry for mobile error tracking and performance monitoring. */
Sentry.init({
    dsn: process.env['EXPO_PUBLIC_SENTRY_DSN'],
    tracesSampleRate: 1.0,
    enableAutoPerformanceTracing: true,
});

/** Auth-aware inner layout that gates app routes until Auth0 resolves. */
function AuthGatedLayout(): React.ReactElement {
    const { isLoading } = useAuth0();

    if (isLoading) {
        return <LandingSkeleton />;
    }

    return (
        <DataContextProvider>
            <PresenceProvider>
                <Slot />
            </PresenceProvider>
        </DataContextProvider>
    );
}

/**
 * Root layout component providing global context and styles.
 *
 * @returns The root layout tree.
 */
function RootLayout() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <TamaguiProvider config={config} defaultTheme="dark">
                    <AuthGatedLayout />
                </TamaguiProvider>
            </QueryClientProvider>
        </AuthProvider>
    );
}

export default Sentry.wrap(RootLayout);
