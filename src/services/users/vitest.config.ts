import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            exclude: ['node_modules', 'dist', '**/*.e2e.test.ts'],
        },
    }),
);
