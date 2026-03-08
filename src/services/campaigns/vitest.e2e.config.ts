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
                '@campaigns': path.resolve(__dirname),
                '@data': path.resolve(__dirname, '../../shared/data/src'),
                '@models': path.resolve(__dirname, '../../shared/models/src'),
                '@adapters-pglite': path.resolve(__dirname, '../../shared/adapters/pglite/src'),
            },
        },
        test: {
            include: ['e2e/**/*.e2e.test.ts'],
            globalSetup: [path.resolve(__dirname, '../__testing__/dockerSetup.ts')],
            fileParallelism: false,
            testTimeout: 30_000,
        },
    }),
);
