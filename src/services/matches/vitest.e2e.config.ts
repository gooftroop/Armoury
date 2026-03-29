import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';
import { e2eEnv } from '@armoury/e2e';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['e2e/**/*.e2e.test.ts'],
            globalSetup: [fileURLToPath(import.meta.resolve('@armoury/e2e/dockerSetupDbOnly.js'))],
            fileParallelism: false,
            testTimeout: 30_000,
            env: { ...e2eEnv },
        },
    }),
);
