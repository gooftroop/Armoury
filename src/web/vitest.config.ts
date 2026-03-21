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
