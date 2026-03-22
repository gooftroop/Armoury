/**
 * Web workspace Vitest configuration.
 *
 * Extends the shared base config with web-specific settings:
 * - esbuild: Configures automatic JSX transform with React as the import source.
 * - environment: Uses happy-dom for DOM emulation in component tests.
 * - setupFiles: Loads jest-dom matchers via vitest.setup.ts.
 *
 * @requirements
 * - REQ-VTEST-WEB-01: Must extend shared base config via mergeConfig.
 * - REQ-VTEST-WEB-02: Must configure happy-dom environment for DOM testing.
 * - REQ-VTEST-WEB-03: Must load jest-dom setup file for custom matchers.
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        esbuild: {
            jsx: 'automatic',
            jsxImportSource: 'react',
        },
        test: {
            environment: 'happy-dom',
            setupFiles: ['./vitest.setup.ts'],
        },
    }),
);
