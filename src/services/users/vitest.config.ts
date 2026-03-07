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
                '@users': path.resolve(__dirname),
                '@shared': path.resolve(__dirname, '../../shared'),
            },
        },
        test: {
            exclude: ['node_modules', 'dist', '**/*.e2e.test.ts'],
        },
    }),
);
