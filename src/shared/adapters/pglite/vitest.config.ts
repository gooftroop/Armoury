import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

/**
 * @requirements
 * - REQ-ADAPTERS-PGLITE-VITEST-01: Unit tests must inherit the shared Vitest base config.
 * - REQ-ADAPTERS-PGLITE-VITEST-02: Test discovery must include files under __tests__ with .test.ts suffix.
 */

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/__tests__/**/*.test.ts'],
        },
    }),
);
