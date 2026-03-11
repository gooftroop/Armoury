import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    baseConfig,
    defineConfig({
        resolve: {
            alias: {
                '@mobile': path.resolve(__dirname),
                '@data': path.resolve(__dirname, '../shared/data/src'),
                '@models': path.resolve(__dirname, '../shared/models/src'),
                '@clients-github': path.resolve(__dirname, '../shared/clients/github/src'),
                '@clients-wahapedia': path.resolve(__dirname, '../shared/clients/wahapedia/src'),
                '@providers-bsdata': path.resolve(__dirname, '../shared/providers/bsdata/src'),
                '@validation': path.resolve(__dirname, '../shared/validation/src'),
                '@sentry/react-native': path.resolve(__dirname, '__mocks__/@sentry/react-native.ts'),
                'react-native': path.resolve(__dirname, '__mocks__/react-native.ts'),
                tamagui: path.resolve(__dirname, '__mocks__/tamagui.ts'),
                'expo-router': path.resolve(__dirname, '__mocks__/expo-router.ts'),
                'react-native-auth0': path.resolve(__dirname, '__mocks__/react-native-auth0.ts'),
            },
        },
    }),
);
