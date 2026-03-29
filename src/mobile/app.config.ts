import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo configuration that enables build-time environment injection.
 *
 * @requirements
 * 1. Must replicate all fields from the original static app.json.
 * 2. Must inject Auth0 domain from EXPO_PUBLIC_AUTH0_DOMAIN env var.
 * 3. Must inject EAS project ID from EAS_PROJECT_ID env var.
 * 4. Must configure EAS Update for OTA channels.
 * 5. Must set runtimeVersion policy to appVersion.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Armoury',
    slug: 'armoury',
    version: '0.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android'],
    newArchEnabled: true,
    scheme: 'armoury',
    ios: {
        bundleIdentifier: 'com.armoury.mobile',
    },
    android: {
        package: 'com.armoury.mobile',
    },
    plugins: [
        '@sentry/react-native/expo',
        'expo-router',
        ['react-native-auth0', { domain: process.env['EXPO_PUBLIC_AUTH0_DOMAIN'] ?? '' }],
    ],
    extra: {
        eas: {
            projectId: process.env['EAS_PROJECT_ID'] ?? '',
        },
    },
    updates: {
        url: `https://u.expo.dev/${process.env['EAS_PROJECT_ID'] ?? ''}`,
    },
    runtimeVersion: {
        policy: 'appVersion',
    },
});
