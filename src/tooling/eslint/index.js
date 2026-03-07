import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Creates the base ESLint configuration for Armoury packages.
 *
 * Returns an array of ESLint flat config objects that:
 * 1. Ignores build artifacts (dist/), dependencies (node_modules/), and config files
 * 2. Applies ESLint recommended rules for JavaScript
 * 3. Applies typescript-eslint recommended rules for TypeScript type checking
 * 4. Configures the TypeScript parser with project-based type information:
 *    - Uses tsconfigPath to locate the project's tsconfig.json
 *    - Uses tsconfigRootDir for resolving relative paths in tsconfig
 *    - Enforces strict rules: no unused variables (ignoring _ prefixed), always use braces, padding between statements
 * 5. Relaxes rules for test files (__tests__/**\/*.ts, \*.test.ts) to allow 'any' types and non-null assertions
 *
 * Platform-agnostic (no node/browser globals) for code that runs on web, node, and react native.
 *
 * @param {string} tsconfigPath - Path to the tsconfig.json file (defaults to './tsconfig.json')
 * @param {string} [tsconfigRootDir] - Root directory for tsconfig resolution (defaults to process.cwd())
 * @returns {import('eslint').Linter.Config[]} ESLint configuration array (flat config format for ESLint 9+)
 */
export function createConfig(tsconfigPath = './tsconfig.json', tsconfigRootDir = process.cwd()) {
    return [
        {
            ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
        },
        eslint.configs.recommended,
        ...tseslint.configs.recommended,
        {
            languageOptions: {
                parserOptions: {
                    project: tsconfigPath,
                    tsconfigRootDir: tsconfigRootDir,
                },
            },
            rules: {
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    {
                        argsIgnorePattern: '^_',
                        varsIgnorePattern: '^_',
                    },
                ],
                curly: ['error', 'all'],
                'padding-line-between-statements': [
                    'error',
                    { blankLine: 'always', prev: 'block-like', next: '*' },
                    { blankLine: 'always', prev: '*', next: 'block-like' },
                    { blankLine: 'always', prev: '*', next: 'return' },
                    { blankLine: 'always', prev: '*', next: 'function' },
                    { blankLine: 'always', prev: 'function', next: '*' },
                ],
            },
        },
        {
            files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
            },
        },
    ];
}

export default createConfig;
