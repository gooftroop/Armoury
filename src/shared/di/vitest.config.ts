import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/__tests__/**/*.test.ts'],
            passWithNoTests: true,
            coverage: {
                provider: 'v8',
                include: ['src/**/*.ts'],
                exclude: ['src/**/__tests__/**', 'src/**/__mocks__/**', 'src/**/__fixtures__/**', 'src/index.ts'],
                thresholds: {
                    statements: 80,
                    branches: 80,
                    functions: 80,
                    lines: 80,
                },
            },
        },
    }),
);
