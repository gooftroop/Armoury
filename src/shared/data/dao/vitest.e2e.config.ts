import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vitest/config';
import { e2eEnv } from '@armoury/e2e';

/**
 * Vitest configuration for end-to-end tests.
 * Uses standalone defineConfig (rather than merging with baseConfig) to avoid
 * inheriting the base `include` pattern, which causes multiple Vite resolution
 * contexts and module resolution failures in CI.
 */
export default defineConfig({
    test: {
        globals: true,
        include: ['e2e/**/*.e2e.test.ts'],
        exclude: ['node_modules', 'dist'],
        globalSetup: [fileURLToPath(import.meta.resolve('@armoury/e2e/dockerSetupDbOnly.js'))],
        fileParallelism: false,
        testTimeout: 30_000,
        env: { ...e2eEnv },
    },
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
        },
    },
});
