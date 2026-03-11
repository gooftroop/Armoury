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
                '@adapters-dsql': path.resolve(__dirname, 'src'),
                '@data': path.resolve(__dirname, '../data/src'),
                '@models': path.resolve(__dirname, '../models/src'),
                '@clients-github': path.resolve(__dirname, '../clients/github/src'),
                '@providers-bsdata': path.resolve(__dirname, '../providers/bsdata/src'),
                '@wh40k10e': path.resolve(__dirname, '../../../systems/wh40k10e/src'),
            },
        },
        test: {
            include: ['src/__integration__/**/*.integration.test.ts'],
            fileParallelism: false,
            testTimeout: 30_000,
        },
    }),
);
