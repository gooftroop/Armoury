import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            environment: 'happy-dom',
            include: ['**/__tests__/**/*.test.{ts,tsx}'],
            passWithNoTests: true,
            setupFiles: ['@testing-library/jest-dom/vitest'],
        },
    }),
);
