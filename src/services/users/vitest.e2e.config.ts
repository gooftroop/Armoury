import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';
import { e2eEnv } from '../__testing__/e2eEnv.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['e2e/**/*.e2e.test.ts'],
            globalSetup: [path.resolve(__dirname, '../__testing__/dockerSetup.ts')],
            fileParallelism: false,
            testTimeout: 30_000,
            env: { ...e2eEnv },
        },
    }),
);
