import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.resolve(__dirname, '../shared');

export default mergeConfig(
    baseConfig,
    defineConfig({
        resolve: {
            alias: {
                '#': path.resolve(__dirname, '.'),
                '@sentry/react-native': path.resolve(__dirname, '__mocks__/@sentry/react-native.ts'),
                'react-native': path.resolve(__dirname, '__mocks__/react-native.ts'),
                tamagui: path.resolve(__dirname, '__mocks__/tamagui.ts'),
                'expo-router': path.resolve(__dirname, '__mocks__/expo-router.ts'),
                'react-native-auth0': path.resolve(__dirname, '__mocks__/react-native-auth0.ts'),
                // Resolve shared feature packages to their mobile source barrels so
                // vitest uses the mobile components instead of the web/browser build.
                '@armoury/feature-forge': path.resolve(SHARED, 'features/forge/src/index.mobile.ts'),
                '@armoury/feature-profile': path.resolve(SHARED, 'features/profile/src/index.mobile.ts'),
                '@armoury/feature-game-system': path.resolve(SHARED, 'features/game-system/src/index.mobile.ts'),
            },
        },
        test: {
            environment: 'happy-dom',
        },
    }),
);
