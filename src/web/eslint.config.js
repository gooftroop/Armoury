import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createConfig from '@armoury/eslint';

export default [
    { ignores: ['.next/**', 'public/**', 'postcss.config.mjs'] },
    ...createConfig('./tsconfig.json', dirname(fileURLToPath(import.meta.url))),
    {
        files: ['next-env.d.ts'],
        rules: {
            '@typescript-eslint/triple-slash-reference': 'off',
        },
    },
];
