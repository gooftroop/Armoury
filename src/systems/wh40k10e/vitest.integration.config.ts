import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest configuration for integration tests.
 * Only runs *.integration.test.ts files.
 */
export default defineConfig({
    resolve: {
        alias: {
            '@wh40k10e': path.resolve(__dirname, 'src'),
            '@shared': path.resolve(__dirname, '../../shared'),
            '@data': path.resolve(__dirname, '../../shared/data/src'),
            '@models': path.resolve(__dirname, '../../shared/models/src'),
        },
    },
    test: {
        globals: true,
        include: ['**/__tests__/**/*.integration.test.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 60000,
    },
});
