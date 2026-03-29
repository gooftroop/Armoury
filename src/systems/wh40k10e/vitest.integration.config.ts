import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

/**
 * Vitest configuration for integration tests.
 * Extends the shared base config (which provides the `@` → `./src` path alias)
 * and overrides the include pattern to target only *.integration.test.ts files.
 * Uses a longer timeout since integration tests exercise more of the stack.
 */
export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/__tests__/**/*.integration.test.ts'],
            exclude: ['node_modules', 'dist'],
            testTimeout: 60_000,
        },
    }),
);
