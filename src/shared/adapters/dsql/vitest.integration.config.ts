import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['src/__integration__/**/*.integration.test.ts'],
            globalSetup: ['src/__integration__/dsqlDockerSetup.ts'],
            fileParallelism: false,
            testTimeout: 30_000,
        },
    }),
);
