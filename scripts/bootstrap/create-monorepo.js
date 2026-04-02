#!/usr/bin/env node

/**
 * Bootstraps a new TypeScript monorepo skeleton.
 *
 * Generates:
 * - Root configs (package.json, turbo.json, tsconfig.json, .nvmrc, etc.)
 * - 5 tooling workspaces (typescript, eslint, prettier, vitest, esbuild)
 * - GitHub Actions CI workflow with format:check step
 * - Husky git hooks (pre-commit, commit-msg)
 * - Dependabot config
 * - Documentation files (parameterized from templates)
 * - OpenCode agent config and skills
 *
 * Usage:
 *   node scripts/bootstrap/create-monorepo.js --name <scope> --dir <output-dir> [--node <version>]
 *
 * Example:
 *   node scripts/bootstrap/create-monorepo.js --name myapp --dir /tmp/myapp
 *   → Creates @myapp/* monorepo at /tmp/myapp
 *
 * All input via CLI args — no interactive prompts (agent-runnable).
 * Uses only Node built-ins (fs, path, child_process).
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1 || idx + 1 >= args.length) {
        return undefined;
    }

    return args[idx + 1];
}

const scope = getArg('name');
const outDir = getArg('dir');
const nodeVersion = getArg('node') || '24';

if (!scope || !outDir) {
    console.error('Usage: node scripts/bootstrap/create-monorepo.js --name <scope> --dir <output-dir> [--node <version>]');
    console.error('Example: node scripts/bootstrap/create-monorepo.js --name myapp --dir /tmp/myapp');
    process.exit(1);
}

const root = resolve(outDir);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templateRoot = join(__dirname, 'templates');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function w(relPath, content) {
    const abs = join(root, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
    console.log(`  created ${relPath}`);
}

function json(relPath, obj) {
    w(relPath, JSON.stringify(obj, null, 4) + '\n');
}

/**
 * Parameterize content — replace template placeholders with scope/org values.
 */
function parameterize(content) {
    const Scope = scope.charAt(0).toUpperCase() + scope.slice(1);

    return content
        .replace(/\{\{ORG\}\}/g, 'your-org')
        .replace(/\{\{SCOPE\}\}/g, Scope)
        .replace(/\{\{scope\}\}/g, scope)
        .replace(/@\{\{scope\}\}/g, `@${scope}`);
}

/**
 * Copy a file from templates/, parameterizing its content.
 */
function copyTemplate(templateRelPath, destRelPath) {
    const templateAbs = join(templateRoot, templateRelPath);
    if (!existsSync(templateAbs)) {
        console.log(`  skipped ${templateRelPath} (not found in templates)`);
        return;
    }

    const content = readFileSync(templateAbs, 'utf-8');
    w(destRelPath || templateRelPath, parameterize(content));
}

/**
 * Recursively copy a directory from templates/, parameterizing all file contents.
 */
function copyTemplateDir(templateRelDir, destRelDir) {
    const srcAbs = join(templateRoot, templateRelDir);
    if (!existsSync(srcAbs)) {
        console.log(`  skipped ${templateRelDir}/ (not found in templates)`);
        return;
    }

    const entries = readdirSync(srcAbs, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = join(templateRelDir, entry.name);
        const destPath = join(destRelDir || templateRelDir, entry.name);
        if (entry.isDirectory()) {
            copyTemplateDir(srcPath, destPath);
        } else {
            copyTemplate(srcPath, destPath);
        }
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\nBootstrapping @${scope} monorepo at ${root}\n`);
mkdirSync(root, { recursive: true });

// ---------------------------------------------------------------------------
// Root configs
// ---------------------------------------------------------------------------

console.log('Root configs:');

// package.json
json('package.json', {
    name: scope,
    type: 'module',
    private: true,
    packageManager: 'npm@10.8.1',
    engines: {
        node: '>=24.0.0',
    },
    workspaces: [
        'src/shared/*',
        'src/web',
        'src/mobile',
        'src/tooling/*',
        'src/services/*',
    ],
    scripts: {
        build: 'turbo run build',
        test: 'turbo run test',
        'test:integration': 'turbo run test:integration',
        lint: 'turbo run lint format:check',
        typecheck: 'turbo run typecheck',
        format: 'turbo run format',
        'format:check': 'turbo run format:check',
        'test:e2e': 'turbo run test:e2e',
        prepare: 'husky || true',
    },
    devDependencies: {
        '@commitlint/config-conventional': '^20.4.3',
        '@playwright/test': '^1.58.2',
        '@testing-library/jest-dom': '^6.9.1',
        '@testing-library/react': '^16.3.2',
        '@testing-library/user-event': '^14.6.1',
        'happy-dom': '^20.8.4',
        'lint-staged': '^16.3.2',
        tsx: '^4.21.0',
        turbo: '^2.0.0',
    },
    peerDependencies: {
        typescript: '^5',
    },
});

// turbo.json
json('turbo.json', {
    $schema: 'https://turbo.build/schema.json',
    tasks: {
        build: {
            dependsOn: ['^build', '^generate:types'],
            outputs: ['dist/**', '.next/**', '!.next/cache/**'],
        },
        'generate:types': {
            dependsOn: ['^generate:types'],
            outputs: ['dist/**/*.d.ts', 'dist/**/*.d.ts.map'],
        },
        test: {
            dependsOn: ['^generate:types'],
            outputs: [],
        },
        'test:integration': {
            dependsOn: ['^generate:types'],
            outputs: [],
        },
        'test:e2e': {
            dependsOn: ['^build', '^generate:types'],
            outputs: [],
            cache: false,
        },
        lint: {
            outputs: [],
        },
        typecheck: {
            dependsOn: ['^generate:types'],
            outputs: [],
        },
        format: {
            outputs: [],
        },
        'format:check': {
            outputs: [],
        },
    },
});

// tsconfig.json
json('tsconfig.json', {
    extends: `@${scope}/typescript/base.json`,
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
});

// .nvmrc
w('.nvmrc', `${nodeVersion}\n`);

// .gitignore
w('.gitignore', `# dependencies
node_modules

# output
out
dist
*.tgz

# code coverage
coverage
*.lcov

# logs
logs
_.log
report.[0-9]_.[0-9]_.[0-9]_.[0-9]_.json

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# caches
.eslintcache
.cache
*.tsbuildinfo

# turbo cache
.turbo

# next.js
.next

# expo
.expo

# IntelliJ based IDEs
.idea

# Finder (MacOS) folder config
.DS_Store

# generated system assets (copied at build time) — keep manifest files for system discovery
**/public/systems/**
!**/public/systems/*/
!**/public/systems/*/manifest.json

# agent worktrees
.worktrees

# agent session artifacts
.opencode/plans/
.opencode/scratch/
.sisyphus/

# serverless framework cache
.serverless/

# playwright e2e auth state
e2e/web/.auth/

# playwright test artifacts
playwright-report/
test-results/
blob-report/
`);

// .prettierignore
w('.prettierignore', `node_modules
dist
coverage
*.tsbuildinfo
package-lock.json
bun.lock
.turbo
`);

// .gitattributes
w('.gitattributes', `# Ensure shell scripts always use LF line endings.
*.sh text eol=lf
`);

// .browserslistrc
w('.browserslistrc', '> 0.2%, not dead, not op_mini all, not ios_saf < 15, not safari < 15, not kaios > 0\n');

// commitlint.config.js
w('commitlint.config.js', `export default {
    extends: ['@commitlint/config-conventional'],
};
`);

// lint-staged.config.js
w('lint-staged.config.js', `export default {
    '*.{ts,tsx,js,jsx,json,md,css,html,yaml,yml}': ['prettier --write'],
    '*.{ts,tsx}': () => 'npx turbo run typecheck',
};
`);

// prettier.config.js
w('prettier.config.js', `import config from '@${scope}/prettier' with { type: 'json' };

export default config;
`);

// ---------------------------------------------------------------------------
// Husky git hooks
// ---------------------------------------------------------------------------

console.log('\nGit hooks:');

w('.husky/pre-commit', 'npx lint-staged\n');
w('.husky/commit-msg', 'npx commitlint --edit "$1"\n');

// ---------------------------------------------------------------------------
// GitHub Actions CI
// ---------------------------------------------------------------------------

console.log('\nGitHub Actions:');

w('.github/workflows/ci.yml', `name: CI

on:
    push:
        branches: [main]
    pull_request:
        branches: [main]

permissions:
    contents: read

concurrency:
    group: ci-\${{ github.workflow }}-\${{ github.ref }}
    cancel-in-progress: true

jobs:
    install:
        name: Install dependencies
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v6

            - uses: actions/setup-node@v6
              with:
                  node-version-file: .nvmrc

            - name: Install dependencies
              run: npm ci

            - name: Cache dependencies
              uses: actions/cache/save@v5
              with:
                  path: |
                      node_modules
                      src/*/node_modules
                      src/*/*/node_modules
                  key: \${{ runner.os }}-node-full-\${{ hashFiles('package-lock.json') }}

    test:
        name: Test
        runs-on: ubuntu-latest
        needs: install
        steps:
            - uses: actions/checkout@v6

            - uses: actions/setup-node@v6
              with:
                  node-version-file: .nvmrc

            - name: Restore dependencies
              uses: actions/cache/restore@v5
              with:
                  path: |
                      node_modules
                      src/*/node_modules
                      src/*/*/node_modules
                  key: \${{ runner.os }}-node-full-\${{ hashFiles('package-lock.json') }}

            - name: Run tests
              run: npm run test

    test-integration:
        name: Test Integration
        runs-on: ubuntu-latest
        needs: install
        steps:
            - uses: actions/checkout@v6

            - uses: actions/setup-node@v6
              with:
                  node-version-file: .nvmrc

            - name: Restore dependencies
              uses: actions/cache/restore@v5
              with:
                  path: |
                      node_modules
                      src/*/node_modules
                      src/*/*/node_modules
                  key: \${{ runner.os }}-node-full-\${{ hashFiles('package-lock.json') }}

            - name: Run integration tests
              run: npm run test:integration

    lint:
        name: Lint & Format
        runs-on: ubuntu-latest
        needs: install
        steps:
            - uses: actions/checkout@v6

            - uses: actions/setup-node@v6
              with:
                  node-version-file: .nvmrc

            - name: Restore dependencies
              uses: actions/cache/restore@v5
              with:
                  path: |
                      node_modules
                      src/*/node_modules
                      src/*/*/node_modules
                  key: \${{ runner.os }}-node-full-\${{ hashFiles('package-lock.json') }}

            - name: Run lint and format check
              run: npx turbo run lint format:check

    typecheck:
        name: Typecheck
        runs-on: ubuntu-latest
        needs: install
        steps:
            - uses: actions/checkout@v6

            - uses: actions/setup-node@v6
              with:
                  node-version-file: .nvmrc

            - name: Restore dependencies
              uses: actions/cache/restore@v5
              with:
                  path: |
                      node_modules
                      src/*/node_modules
                      src/*/*/node_modules
                  key: \${{ runner.os }}-node-full-\${{ hashFiles('package-lock.json') }}

            - name: Run typecheck
              run: npm run typecheck

    build:
        name: Build
        runs-on: ubuntu-latest
        needs: [install, test, test-integration, lint, typecheck]
        steps:
            - uses: actions/checkout@v6

            - uses: actions/setup-node@v6
              with:
                  node-version-file: .nvmrc

            - name: Restore dependencies
              uses: actions/cache/restore@v5
              with:
                  path: |
                      node_modules
                      src/*/node_modules
                      src/*/*/node_modules
                  key: \${{ runner.os }}-node-full-\${{ hashFiles('package-lock.json') }}

            - name: Build all packages
              run: npm run build

    test-e2e:
        name: Test E2E
        runs-on: ubuntu-latest
        needs: build
        steps:
            - uses: actions/checkout@v6

            - uses: actions/setup-node@v6
              with:
                  node-version-file: .nvmrc

            - name: Restore dependencies
              uses: actions/cache/restore@v5
              with:
                  path: |
                      node_modules
                      src/*/node_modules
                      src/*/*/node_modules
                  key: \${{ runner.os }}-node-full-\${{ hashFiles('package-lock.json') }}

            - name: Get Playwright version
              id: pw-version
              run: echo "version=$(npx playwright --version | awk '{print $2}')" >> "$GITHUB_OUTPUT"

            - name: Cache Playwright browsers
              id: pw-cache
              uses: actions/cache@v4
              with:
                  path: ~/.cache/ms-playwright
                  key: \${{ runner.os }}-playwright-\${{ steps.pw-version.outputs.version }}

            - name: Install Playwright browsers
              if: steps.pw-cache.outputs.cache-hit != 'true'
              run: npx playwright install --with-deps chromium

            - name: Install Playwright system deps
              if: steps.pw-cache.outputs.cache-hit == 'true'
              run: npx playwright install-deps chromium

            - name: Run e2e tests
              run: npm run test:e2e
`);

// dependabot.yml
w('.github/dependabot.yml', `version: 2
updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
          interval: "monthly"
`);

// ---------------------------------------------------------------------------
// Tooling: typescript
// ---------------------------------------------------------------------------

console.log('\nTooling workspaces:');

json('src/tooling/typescript/package.json', {
    name: `@${scope}/typescript`,
    version: '0.0.0',
    private: true,
    type: 'module',
    exports: {
        './*': './*.json',
        './base.json': './base.json',
        './build.json': './build.json',
        './fix-declaration-paths': './fix-declaration-paths.mjs',
    },
    'lint-staged': {
        '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
    },
});

json('src/tooling/typescript/base.json', {
    $schema: 'https://json.schemastore.org/tsconfig',
    compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        downlevelIteration: true,
        resolveJsonModule: true,
        isolatedModules: true,
        incremental: true,
        noImplicitAny: true,
        noFallthroughCasesInSwitch: true,
        noImplicitOverride: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        noUnusedParameters: true,
        noUncheckedSideEffectImports: true,
        noUnusedLocals: true,
        preserveConstEnums: true,
        strictBindCallApply: true,
        strictFunctionTypes: true,
        strictNullChecks: true,
        strictPropertyInitialization: true,
        resolvePackageJsonExports: true,
        resolvePackageJsonImports: true,
        rewriteRelativeImportExtensions: false,
        useUnknownInCatchVariables: true,
    },
});

json('src/tooling/typescript/build.json', {
    $schema: 'https://json.schemastore.org/tsconfig',
    extends: './base.json',
    compilerOptions: {
        outDir: 'dist',
        rootDir: '.',
        emitDeclarationOnly: true,
    },
    exclude: ['node_modules', 'dist', '**/__tests__/**', '**/__mocks__/**', '**/__fixtures__/**'],
});

// fix-declaration-paths.mjs — copy verbatim, it's generic
w('src/tooling/typescript/fix-declaration-paths.mjs', `#!/usr/bin/env node

/**
 * Rewrites \`@/\` path aliases in emitted \`.d.ts\` files to relative paths.
 *
 * TypeScript preserves path aliases verbatim in declaration output. When a
 * consuming package reads these \`.d.ts\` files, \`@/\` resolves to the consumer's
 * own source root — not the producer's — breaking the type chain. This script
 * runs after \`tsc\` to fix the paths in-place.
 *
 * Usage: node fix-declaration-paths.mjs [distDir]
 *   distDir defaults to \`./dist\` relative to cwd.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

const distDir = resolve(process.cwd(), process.argv[2] || 'dist');

function computeRelativePrefix(filePath) {
    const relFromDist = relative(distDir, dirname(filePath));

    if (relFromDist === '') {
        return './';
    }

    const depth = relFromDist.split('/').length;
    return '../'.repeat(depth);
}

async function main() {
    const entries = await readdir(distDir, { recursive: true });
    const dtsFiles = entries
        .filter((entry) => entry.endsWith('.d.ts'))
        .map((entry) => join(distDir, entry));

    let modifiedCount = 0;

    for (const filePath of dtsFiles) {
        const content = await readFile(filePath, 'utf-8');

        if (!content.includes("'@/") && !content.includes('"@/')) {
            continue;
        }

        const prefix = computeRelativePrefix(filePath);

        const updated = content
            .replace(/(from\\s+['"])@\\//g, \`\$1\${prefix}\`)
            .replace(/(import\\s*\\(\\s*['"])@\\//g, \`\$1\${prefix}\`);

        if (updated !== content) {
            await writeFile(filePath, updated, 'utf-8');
            modifiedCount++;
        }
    }

    if (modifiedCount > 0) {
        console.log(\`fix-declaration-paths: rewrote @/ aliases in \${modifiedCount} .d.ts files\`);
    }
}

main().catch((err) => {
    console.error('fix-declaration-paths failed:', err);
    process.exit(1);
});
`);

// ---------------------------------------------------------------------------
// Tooling: eslint
// ---------------------------------------------------------------------------

json('src/tooling/eslint/package.json', {
    name: `@${scope}/eslint`,
    version: '0.0.0',
    private: true,
    type: 'module',
    exports: {
        '.': './index.js',
        './*': './*.js',
    },
    peerDependencies: {
        '@eslint/js': '^10.0.0',
        eslint: '^10.0.3',
        'eslint-plugin-import-x': '^4.0.0',
        'typescript-eslint': '^8.56.0',
    },
    'lint-staged': {
        '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
    },
});

w('src/tooling/eslint/index.js', `import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Creates the base ESLint configuration for @${scope} packages.
 *
 * Returns an array of ESLint flat config objects that:
 * 1. Ignores build artifacts (dist/), dependencies (node_modules/), and config files
 * 2. Applies ESLint recommended rules for JavaScript
 * 3. Applies typescript-eslint recommended rules for TypeScript type checking
 * 4. Configures the TypeScript parser with project-based type information
 * 5. Relaxes rules for test files
 *
 * @param {string} tsconfigPath - Path to the tsconfig.json file (defaults to './tsconfig.json')
 * @param {string} [tsconfigRootDir] - Root directory for tsconfig resolution (defaults to process.cwd())
 * @returns {import('eslint').Linter.Config[]} ESLint configuration array (flat config format)
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
        {
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: [
                            {
                                group: ['@${scope}/*/*'],
                                message:
                                    "Only import from barrel files using '@${scope}/<package>' — never from subpaths like '@${scope}/<package>/subpath'.",
                            },
                        ],
                    },
                ],
                'no-restricted-syntax': [
                    'error',
                    {
                        selector:
                            'ImportDeclaration[source.value=/\\\\.tsx?$/]',
                        message:
                            'Do not use .ts or .tsx extensions in import paths. Use .js or .jsx extensions instead.',
                    },
                ],
            },
        },
    ];
}

export default createConfig;
`);

// ---------------------------------------------------------------------------
// Tooling: prettier
// ---------------------------------------------------------------------------

json('src/tooling/prettier/package.json', {
    name: `@${scope}/prettier`,
    version: '0.0.0',
    private: true,
    type: 'module',
    exports: {
        '.': './index.json',
        './*': './*.json',
    },
    peerDependencies: {
        prettier: '^3.0.0',
    },
    'lint-staged': {
        '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
    },
});

json('src/tooling/prettier/index.json', {
    tabWidth: 4,
    useTabs: false,
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 120,
});

// ---------------------------------------------------------------------------
// Tooling: vitest
// ---------------------------------------------------------------------------

json('src/tooling/vitest/package.json', {
    name: `@${scope}/vitest`,
    version: '0.0.0',
    private: true,
    type: 'module',
    exports: {
        '.': {
            types: './vitest.config.d.ts',
            default: './vitest.config.js',
        },
        './*': {
            types: './*.d.ts',
            default: './*.js',
        },
    },
    peerDependencies: {
        vitest: '^4.0.0',
    },
    'lint-staged': {
        '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
    },
});

w('src/tooling/vitest/vitest.config.js', `import path from 'path';

/**
 * Base Vitest configuration for @${scope} packages.
 *
 * Provides a shared test configuration that:
 * - globals: true -- Makes describe, it, expect available without imports.
 * - include pattern -- Discovers test files only in __tests__ directories.
 * - exclude -- Skips node_modules and dist directories.
 * - resolve.alias -- Maps the \`@\` path alias to \`./src\`.
 *
 * Consumers should merge this config with their own using mergeConfig().
 */
export const baseConfig = {
    test: {
        globals: true,
        include: ['**/__tests__/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
    },
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
        },
    },
};

export default baseConfig;
`);

// ---------------------------------------------------------------------------
// Tooling: esbuild
// ---------------------------------------------------------------------------

json('src/tooling/esbuild/package.json', {
    name: `@${scope}/esbuild`,
    version: '0.0.0',
    private: true,
    type: 'module',
    exports: {
        './*': './*.js',
        './base': './base.js',
        './library': './library.js',
        './service': './service.js',
    },
    dependencies: {
        'browserslist-to-esbuild': '^2.1.1',
        esbuild: '^0.27.3',
    },
    'lint-staged': {
        '*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}': 'prettier --write',
    },
});

w('src/tooling/esbuild/base.js', `/**
 * Shared esbuild utilities for the @${scope} monorepo.
 *
 * Provides common build configuration: dependency externalization,
 * browserslist target resolution, and base esbuild options.
 */

import browserslistToEsbuild from 'browserslist-to-esbuild';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Reads the package.json from the calling workspace and returns
 * all dependency names to externalize.
 *
 * @param cwd - The workspace root directory.
 * @returns Array of package names to mark as external.
 */
export function getExternalDeps(cwd) {
    const pkgPath = resolve(cwd, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
    ];
}

/**
 * Resolves browserslist targets to esbuild-compatible target strings.
 *
 * @returns Array of esbuild target strings.
 */
export function getBrowserTargets() {
    return browserslistToEsbuild();
}

/**
 * Shared esbuild options common to all builds.
 *
 * @param entryPoints - Entry point file paths relative to cwd.
 * @param cwd - The workspace root directory.
 * @returns Base esbuild build options.
 */
export function baseOptions(entryPoints, cwd) {
    return {
        entryPoints: entryPoints.map((e) => resolve(cwd, e)),
        bundle: true,
        format: 'esm',
        sourcemap: true,
        external: getExternalDeps(cwd),
        logLevel: 'info',
    };
}

/**
 * Parses entry points from ESBUILD_ENTRIES env var or --entry CLI flags.
 *
 * @returns Array of entry point paths, or undefined if none specified.
 */
export function parseEntryPoints() {
    const envEntries = process.env.ESBUILD_ENTRIES;
    if (envEntries) {
        return envEntries
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean);
    }

    const args = process.argv.slice(2);
    const entryPoints = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--entry' && args[i + 1]) {
            entryPoints.push(args[i + 1]);
            i++;
        }
    }

    return entryPoints.length > 0 ? entryPoints : undefined;
}
`);

w('src/tooling/esbuild/library.js', `/**
 * esbuild configuration for shared library packages.
 *
 * Builds dual browser + node ESM bundles for cross-platform consumption.
 *
 * Output structure:
 *   dist/browser/ — Browser-targeted ESM bundle
 *   dist/node/    — Node-targeted ESM bundle
 */

import * as esbuild from 'esbuild';
import { resolve } from 'node:path';
import { baseOptions, getBrowserTargets, parseEntryPoints } from './base.js';

async function buildLibrary({ entryPoints = ['src/index.ts'], cwd = process.cwd() } = {}) {
    const base = baseOptions(entryPoints, cwd);
    const browserTargets = getBrowserTargets();

    await Promise.all([
        esbuild.build({
            ...base,
            outdir: resolve(cwd, 'dist/browser'),
            platform: 'browser',
            target: browserTargets,
        }),
        esbuild.build({
            ...base,
            outdir: resolve(cwd, 'dist/node'),
            platform: 'node',
            target: ['node22'],
        }),
    ]);
}

const cwd = process.cwd();
const entryPoints = parseEntryPoints();

buildLibrary({ entryPoints, cwd }).catch((err) => {
    console.error(err);
    process.exit(1);
});
`);

w('src/tooling/esbuild/service.js', `/**
 * esbuild configuration for Lambda service packages.
 *
 * Builds a node-only ESM bundle for server-side execution.
 *
 * Output structure:
 *   dist/ — Node-targeted ESM bundle
 */

import * as esbuild from 'esbuild';
import { resolve } from 'node:path';
import { baseOptions, parseEntryPoints } from './base.js';

async function buildService({ entryPoints = ['src/handler.ts'], cwd = process.cwd() } = {}) {
    const base = baseOptions(entryPoints, cwd);

    await esbuild.build({
        ...base,
        outdir: resolve(cwd, 'dist'),
        platform: 'node',
        target: ['node22'],
        packages: 'external',
    });
}

const cwd = process.cwd();
const entryPoints = parseEntryPoints();

buildService({ entryPoints, cwd }).catch((err) => {
    console.error(err);
    process.exit(1);
});
`);

// ---------------------------------------------------------------------------
// Documentation files — copy and parameterize
// ---------------------------------------------------------------------------

console.log('\nDocumentation:');

// Core docs
copyTemplate('docs/CODING_STANDARDS.md');
// AGENT_CATEGORIES.md excluded — too domain-specific to parameterize cleanly.
copyTemplate('docs/tooling.md');
copyTemplate('CONTRIBUTING.md');

// Agent instructions
copyTemplate('.opencode/AGENTS.md');

// ---------------------------------------------------------------------------
// OpenCode config
// ---------------------------------------------------------------------------

console.log('\nOpenCode config:');

json('opencode.jsonc', {
    $schema: 'https://opencode.ai/config.json',
    instructions: ['.opencode/AGENTS.md'],
    compaction: {
        auto: true,
        prune: true,
        reserved: 12000,
    },
    agent: {
        compaction: {
            model: 'github-copilot/claude-haiku-4.5',
        },
    },
});

// ---------------------------------------------------------------------------
// Skills — copy all skill directories
// ---------------------------------------------------------------------------

console.log('\nSkills:');

const skillsDir = join(templateRoot, '.opencode/skills');
if (existsSync(skillsDir)) {
    const skills = readdirSync(skillsDir, { withFileTypes: true });
    for (const skill of skills) {
        if (skill.isDirectory()) {
            copyTemplateDir(
                join('.opencode/skills', skill.name),
                join('.opencode/skills', skill.name),
            );
        }
    }
} else {
    console.log('  skipped .opencode/skills/ (not found in templates)');
}

// ---------------------------------------------------------------------------
// Placeholder directories
// ---------------------------------------------------------------------------

console.log('\nPlaceholder directories:');

const placeholderDirs = [
    'src/shared',
    'src/services',
    'src/web',
    'src/mobile',
];

for (const dir of placeholderDirs) {
    mkdirSync(join(root, dir), { recursive: true });
    w(join(dir, '.gitkeep'), '');
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

console.log('\nREADME:');

const scopeTitle = scope.charAt(0).toUpperCase() + scope.slice(1);

w('README.md', `# ${scopeTitle}

A TypeScript monorepo.

## Prerequisites

- **Node.js** \`>=${nodeVersion}.0.0\` (see \`.nvmrc\`)
- **npm** (ships with Node)

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm run test

# Lint all packages
npm run lint

# Type check all packages
npm run typecheck

# Format all files
npm run format
\`\`\`

## Monorepo Structure

| Path | Package | Description |
|------|---------|-------------|
| \`src/shared/*\` | \`@${scope}/*\` | Shared libraries |
| \`src/web\` | \`@${scope}/web\` | Web application |
| \`src/mobile\` | \`@${scope}/mobile\` | Mobile application |
| \`src/services/*\` | \`@${scope}/*\` | Backend services |
| \`src/tooling/*\` | \`@${scope}/*\` | Shared tooling configs |

Root scripts delegate to [Turborepo](https://turbo.build/repo).
`);

// ---------------------------------------------------------------------------
// Init git repo
// ---------------------------------------------------------------------------

console.log('\nInitializing git repo...');

try {
    execSync('git init', { cwd: root, stdio: 'pipe' });
    execSync('git add -A', { cwd: root, stdio: 'pipe' });
    console.log('  git init + add complete');
} catch (err) {
    console.log('  git init skipped (git not available or error)');
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

console.log(`\n✓ Monorepo @${scope} bootstrapped at ${root}`);
console.log('\nNext steps:');
console.log(`  cd ${root}`);
console.log('  npm install');
console.log('  npm run build');
console.log('');
