/**
 * Base Vitest configuration for Armoury packages.
 *
 * Provides a shared test configuration that:
 * - globals: true -- Makes describe, it, expect, and other test globals available without imports.
 * - include pattern -- Discovers test files only in __tests__ directories with .test.ts suffix.
 * - exclude -- Skips scanning node_modules and dist directories.
 *
 * Consumers should merge this config with their own using mergeConfig() from vitest/config
 * to extend or override specific test options.
 *
 * Tests should be located in __tests__ folders following the Armoury file organization pattern.
 */
export const baseConfig = {
    test: {
        globals: true,
        include: ['**/__tests__/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
    },
};

export default baseConfig;
