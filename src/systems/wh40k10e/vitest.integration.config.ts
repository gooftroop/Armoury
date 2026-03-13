import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for integration tests.
 * Only runs *.integration.test.ts files.
 */
export default defineConfig({
    test: {
        globals: true,
        include: ['**/__tests__/**/*.integration.test.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 60000,
    },
});
