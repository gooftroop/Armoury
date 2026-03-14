import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

/**
 * Vitest configuration for web integration tests.
 *
 * Extends the shared base config (which provides the `@` → `./src` path alias)
 * and overrides the include pattern to target `__integration__/` test files.
 * Uses a longer timeout since integration tests exercise more of the stack.
 */
export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/__integration__/**/*.integration.test.ts'],
            exclude: ['node_modules', 'dist', '.next'],
            testTimeout: 60_000,
        },
    }),
);
