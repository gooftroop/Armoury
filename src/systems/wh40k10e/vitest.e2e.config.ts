import path from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for end-to-end tests.
 * Provides the `@` → `./src` path alias from the shared base config inline
 * (rather than merging) to avoid inheriting the base `include` pattern.
 * Targets only *.e2e.test.ts files in the e2e directory. Uses a longer timeout
 * since e2e tests may download real data from remote sources and perform full
 * pipeline operations.
 */
export default defineConfig({
    test: {
        globals: true,
        include: ['e2e/**/*.e2e.test.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 180_000,
        fileParallelism: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
        },
    },
});
