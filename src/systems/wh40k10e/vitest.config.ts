import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/__tests__/**/*.test.ts'],
            exclude: ['**/__tests__/**/*.integration.test.ts', '**/node_modules/**'],
        },
    }),
);
