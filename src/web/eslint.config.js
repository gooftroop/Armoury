import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createConfig from '@armoury/eslint';

export default [
    { ignores: ['.next/**', 'public/**', 'postcss.config.mjs'] },
    ...createConfig('./tsconfig.json', dirname(fileURLToPath(import.meta.url))),
    {
        files: ['**/*.{ts,tsx}'],
        ignores: [
            '**/*.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            '**/__tests__/**',
            '**/vitest.setup.ts',
            '**/__testing__/**',
        ],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/__testing__/**', './__testing__/**', '../__testing__/**'],
                            message: 'Production code must not import from __testing__/. These modules are test-only.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['next-env.d.ts'],
        rules: {
            '@typescript-eslint/triple-slash-reference': 'off',
        },
    },
];
