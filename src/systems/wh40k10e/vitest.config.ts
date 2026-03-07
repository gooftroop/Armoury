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
                '@wh40k10e': path.resolve(__dirname, 'src'),
                '@data': path.resolve(__dirname, '../../shared/data/src'),
                '@models': path.resolve(__dirname, '../../shared/models/src'),
                '@clients-github': path.resolve(__dirname, '../../shared/clients/github/src'),
                '@clients-wahapedia': path.resolve(__dirname, '../../shared/clients/wahapedia/src'),
                '@providers-bsdata': path.resolve(__dirname, '../../shared/providers/bsdata/src'),
                '@validation': path.resolve(__dirname, '../../shared/validation/src'),
            },
        },
        test: {
            include: ['**/__tests__/**/*.test.ts'],
            exclude: ['**/__tests__/**/*.integration.test.ts', '**/node_modules/**'],
        },
    }),
);
