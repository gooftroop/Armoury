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
                '@friends': path.resolve(__dirname),
                '@shared': path.resolve(__dirname, '../../shared'),
            },
        },
        test: {
            include: ['e2e/**/*.e2e.test.ts'],
            globalSetup: [path.resolve(__dirname, '../__testing__/dockerSetup.ts')],
            fileParallelism: false,
            testTimeout: 30_000,
            env: {
                AWS_ENDPOINT_URL: 'http://localhost:4566',
                AWS_ACCESS_KEY_ID: 'test',
                AWS_SECRET_ACCESS_KEY: 'test',
                AWS_REGION: 'us-east-1',
                IS_LOCAL: 'true',
            },
        },
    }),
);
