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
                '@data': path.resolve(__dirname, 'src'),
                '@models': path.resolve(__dirname, '../models/src'),
                '@clients-github': path.resolve(__dirname, '../clients/github/src'),
                '@providers-bsdata': path.resolve(__dirname, '../providers/bsdata/src'),
                '@wh40k10e': path.resolve(__dirname, '../../systems/wh40k10e/src'),
            },
        },
        test: {
            include: ['**/__tests__/**/*.test.ts'],
        },
    }),
);
