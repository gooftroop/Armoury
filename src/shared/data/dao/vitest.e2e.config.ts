import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['e2e/**/*.e2e.test.ts'],
            fileParallelism: false,
            testTimeout: 30_000,
        },
    }),
);
