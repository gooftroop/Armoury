import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['src/__integration__/**/*.integration.test.ts'],
            fileParallelism: false,
            testTimeout: 30_000,
        },
    }),
);
