import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@armoury/vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    baseConfig,
    defineConfig({
        resolve: {
            alias: {
                '@validation': path.resolve(__dirname, 'src'),
                '@providers-bsdata': path.resolve(__dirname, '../providers/bsdata/src'),
            },
        },
        test: {
            include: ['**/__tests__/**/*.test.ts'],
        },
    }),
);
