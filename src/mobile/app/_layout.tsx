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
import { TamaguiProvider } from 'tamagui';
import { queryClient } from '@/lib/queryClient.js';
import config from '../tamagui.config.ts';
import { AuthProvider } from '@/providers/AuthProvider.js';
import { DataContextProvider } from '@/providers/DataContextProvider.js';

/** Initializes Sentry for mobile error tracking and performance monitoring. */
Sentry.init({
    dsn: process.env['EXPO_PUBLIC_SENTRY_DSN'],
    tracesSampleRate: 1.0,
    enableAutoPerformanceTracing: true,
});

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
                    <DataContextProvider>
                        <Slot />
                    </DataContextProvider>
                </TamaguiProvider>
            </QueryClientProvider>
        </AuthProvider>
    );
}

export default Sentry.wrap(RootLayout);
