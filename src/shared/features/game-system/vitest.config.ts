import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

const GAME_SYSTEM_ROOT = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    baseConfig,
    defineConfig({
        oxc: {
            jsx: {
                runtime: 'automatic',
                importSource: 'react',
            },
        },
        test: {
            include: ['**/__tests__/**/*.test.{ts,tsx}'],
            environment: 'happy-dom',
            setupFiles: [path.resolve(GAME_SYSTEM_ROOT, 'vitest.setup.ts')],
            passWithNoTests: true,
        },
    }),
);
