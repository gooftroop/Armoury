# Bootstrap Reference Document

## Section 1: Overview & Purpose

The bootstrap scripts generate fully structured TypeScript monorepo skeletons and workspaces from scratch. Running them once produces a working, opinionated project layout with configs, tooling packages, CI pipelines, git hooks, and documentation already in place.

There are two scripts:

- **`create-monorepo.js`** scaffolds the root monorepo: `package.json`, `turbo.json`, `tsconfig.json`, five shared tooling workspaces (`typescript`, `eslint`, `prettier`, `vitest`, `esbuild`), GitHub Actions CI, Husky git hooks, Dependabot config, documentation files, and OpenCode agent config.
- **`create-workspace.js`** adds a single workspace inside an already-bootstrapped monorepo. It writes the workspace `package.json`, TypeScript configs, ESLint/Prettier configs, a Vitest config, and type-specific boilerplate (handler, app entry, Dockerfile, etc.).

### Design Philosophy

**Node.js built-ins only.** Neither script installs or requires any third-party dependencies. `create-monorepo.js` uses `fs`, `path`, `child_process`, and `url`. `create-workspace.js` uses `fs` and `path`. They run directly with `node` on any machine that has Node.js installed.

**No interactive prompts.** All configuration comes from CLI arguments. There are no readline prompts, confirmation steps, or interactive menus. This makes both scripts safe to call from automated agents, CI pipelines, and shell scripts without human intervention.

**CLI args only.** Every tunable value, including the output directory, scope name, workspace type, and Node version, is passed as a named flag. Unknown or missing required flags cause an immediate exit with a usage message.

**Agent-runnable.** The combination of the above means any automated agent can call these scripts reliably: deterministic input, deterministic output, no side effects beyond writing files and initializing a git repo.

---

## Section 2: CLI Reference & Parameterization Rules

### `create-monorepo.js`

```
node scripts/bootstrap/create-monorepo.js --name <scope> --dir <output-dir> [--node <version>]
```

**Example:**

```bash
node scripts/bootstrap/create-monorepo.js --name myapp --dir /tmp/myapp
# Creates @myapp/* monorepo at /tmp/myapp

node scripts/bootstrap/create-monorepo.js --name myapp --dir /tmp/myapp --node 22
# Same, but pins Node 22 in .nvmrc
```

| Argument | Required | Default | Description |
|---|---|---|---|
| `--name <scope>` | Yes | | The npm scope for the monorepo. Becomes the `@scope` prefix on all generated packages. |
| `--dir <output-dir>` | Yes | | Absolute or relative path where the monorepo root will be created. |
| `--node <version>` | No | `24` | Node.js version written to `.nvmrc` and used in any version-dependent output. |

If either `--name` or `--dir` is missing, the script prints usage and exits with code `1`.

---

### `create-workspace.js`

```
node scripts/bootstrap/create-workspace.js --name <pkg-name> --location <path> --type <type> [--scope <scope>]
```

**Examples:**

```bash
node scripts/bootstrap/create-workspace.js --name models --location src/shared/models --type library --scope myapp
# Creates @myapp/models at src/shared/models/

node scripts/bootstrap/create-workspace.js --name campaigns --location src/services/campaigns --type serverless --scope myapp
# Creates @myapp/campaigns serverless workspace at src/services/campaigns/
```

| Argument | Required | Default | Description |
|---|---|---|---|
| `--name <pkg-name>` | Yes | | The short package name (no scope prefix). Becomes the second part of `@scope/name`. |
| `--location <path>` | Yes | | Path relative to cwd where the workspace will be created. Also registered in the root `package.json` workspaces array if not already covered by a glob. |
| `--type <type>` | Yes | | Workspace type. Must be one of the valid types listed below. |
| `--scope <scope>` | No | Auto-detected | The monorepo scope. If omitted, the script reads the root `package.json` and extracts the name field, stripping any leading `@`. Exits with an error if detection fails. |

If `--name`, `--location`, or `--type` is missing, or if `--type` is not a recognized value, the script prints usage and exits with code `1`.

#### Workspace Types

| Type | Description |
|---|---|
| `library` | Shared library. Produces dual browser and Node ESM bundles via esbuild. Exports from `dist/browser/index.js` and `dist/node/index.js`. |
| `serverless` | AWS Lambda service via Serverless Framework. Includes `serverless.yml` with pre-wired `httpApi` JWT authorizer (`auth0Jwt`), a starter `handler.ts`, integration test config, and auto-updates `serverless-compose.yml`. |
| `nextjs` | Next.js 15 web application. App Router layout, `next.config.js`, TypeScript with Bundler resolution, no test config (Next.js handles its own). |
| `react-native` | Expo 53 / React Native mobile app. Expo Router entry, TypeScript with Bundler resolution, starter home screen. |
| `nestjs` | NestJS 11 service (Docker optional). Includes `Dockerfile`, `docker-compose.yml`, `AppModule`, and `main.ts` bootstrap. |
| `nestjs-docker` | Compatibility alias for `nestjs`. |

---

### The `parameterize()` Function

`create-monorepo.js` uses `parameterize()` to rewrite template file contents before writing them to the output directory. Any file read from `templates/` passes through this function.

#### Replacement Rules

| Placeholder | Replacement | Example (`scope = "myapp"`) |
|---|---|---|
| `{{ORG}}` | The literal string `your-org` | `your-org` |
| `{{SCOPE}}` | Scope with first letter uppercased | `Myapp` |
| `{{scope}}` | Scope in lowercase, as provided | `myapp` |
| `@{{scope}}` | Scope with `@` prefix | `@myapp` |

Note that `@{{scope}}` is replaced before `{{scope}}`, because the replacement patterns run in order via chained `.replace()` calls. The `@{{scope}}` rule must come last in the chain or it would be shadowed by the `{{scope}}` rule. Looking at the source, the `@{{scope}}` replacement actually runs last:

```js
.replace(/\{\{ORG\}\}/g, 'your-org')
.replace(/\{\{SCOPE\}\}/g, Scope)
.replace(/\{\{scope\}\}/g, scope)
.replace(/@\{\{scope\}\}/g, `@${scope}`);
```

Wait, looking more carefully: the `@{{scope}}` regex is `/@\{\{scope\}\}/g`. Because the third replacement turns `{{scope}}` into the raw scope value (`myapp`), by the time the fourth rule runs the string `@{{scope}}` has already been transformed to `@myapp`. The fourth rule would then match `@myapp` only if the regex matched a literal `@myapp`, which it does not. In practice this works correctly because the regex `/@\{\{scope\}\}/g` matches `@{{scope}}` (with the literal curly braces intact) and replaces it before the `{{scope}}` rule could touch the same substring. The ordering ensures `@{{scope}}` is consumed by rule 4 and not partially consumed by rule 3.

#### Exact Source

```js
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
```

---

### Helper Functions

Both scripts share a similar set of small utility functions. These are defined locally in each file rather than shared via a module.

#### `create-monorepo.js` helpers

**`w(relPath, content)`** — Writes a file at `relPath` relative to the monorepo root. Creates any missing parent directories with `mkdirSync(..., { recursive: true })` before writing. Logs each created path to stdout.

```js
function w(relPath, content) {
    const abs = join(root, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
    console.log(`  created ${relPath}`);
}
```

**`json(relPath, obj)`** — Convenience wrapper over `w()`. Serializes `obj` to JSON with 4-space indentation and a trailing newline, then writes it via `w()`.

```js
function json(relPath, obj) {
    w(relPath, JSON.stringify(obj, null, 4) + '\n');
}
```

**`copyTemplate(templateRelPath, destRelPath)`** — Reads a file from the `templates/` directory adjacent to the script, passes its content through `parameterize()`, and writes the result to `destRelPath` (or `templateRelPath` if no destination is specified). Silently skips if the template file does not exist.

```js
function copyTemplate(templateRelPath, destRelPath) {
    const templateAbs = join(templateRoot, templateRelPath);
    if (!existsSync(templateAbs)) {
        console.log(`  skipped ${templateRelPath} (not found in templates)`);
        return;
    }

    const content = readFileSync(templateAbs, 'utf-8');
    w(destRelPath || templateRelPath, parameterize(content));
}
```

**`copyTemplateDir(templateRelDir, destRelDir)`** — Recursively copies a directory from `templates/`, calling `copyTemplate()` on each file and recursing into subdirectories. Silently skips if the source directory does not exist.

```js
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
```

#### `create-workspace.js` helpers

**`w(relPath, content)`** — Same contract as the monorepo version, but paths are relative to `wsRoot` (the resolved workspace directory) rather than the repo root.

```js
function w(relPath, content) {
    const abs = join(wsRoot, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
    console.log(`  created ${join(location, relPath)}`);
}
```

**`json(relPath, obj)`** — Identical to the monorepo version: JSON with 4-space indent and trailing newline, written via `w()`.

```js
function json(relPath, obj) {
    w(relPath, JSON.stringify(obj, null, 4) + '\n');
}
```

**`getArg(name)`** — Used by both scripts for CLI parsing. Scans `process.argv.slice(2)` for `--name` and returns the following token. Returns `undefined` if the flag is absent or has no following value.

```js
function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1 || idx + 1 >= args.length) {
        return undefined;
    }

    return args[idx + 1];
}
```

**`detectScope()`** (`create-workspace.js` only) — Attempts to read the root `package.json` from `cwd` and extract the monorepo scope from its `name` field, stripping any leading `@`. Returns `undefined` on any read or parse error.

```js
function detectScope() {
    try {
        const rootPkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
        if (rootPkg.name) {
            return rootPkg.name.replace(/^@/, '');
        }
    } catch {
        return undefined;
    }

    return undefined;
}
```
# Section 3: Monorepo Bootstrap — Root Configs and Tooling Workspaces

`create-monorepo.js` generates a complete TypeScript monorepo skeleton from a single command. This section covers every file it writes for the root and the five tooling workspaces. Workspace-specific bootstrapping (libraries, services, web, mobile) is covered separately in Section 4.

**Invocation:**

```bash
node scripts/bootstrap/create-monorepo.js --name <scope> --dir <output-dir> [--node <version>]
```

- `--name` sets the npm scope. Every generated package becomes `@<scope>/<name>`.
- `--dir` is the absolute path where the monorepo will be created.
- `--node` pins the Node.js version written to `.nvmrc` (defaults to `24`).

---

## 3.1 Root Configuration Files

### `package.json`

The root manifest configures npm workspaces, Turborepo scripts, engine constraints, and shared dev dependencies.

```json
{
    "name": "<scope>",
    "type": "module",
    "private": true,
    "packageManager": "npm@10.8.1",
    "engines": {
        "node": ">=24.0.0"
    },
    "workspaces": [
        "src/shared/*",
        "src/web",
        "src/mobile",
        "src/tooling/*",
        "src/services/*"
    ],
    "scripts": {
        "build": "turbo run build",
        "test": "turbo run test",
        "test:integration": "turbo run test:integration",
        "lint": "turbo run lint format:check",
        "typecheck": "turbo run typecheck",
        "format": "turbo run format",
        "format:check": "turbo run format:check",
        "test:e2e": "turbo run test:e2e",
        "prepare": "husky || true"
    },
    "devDependencies": {
        "@commitlint/config-conventional": "^20.4.3",
        "@playwright/test": "^1.58.2",
        "@testing-library/jest-dom": "^6.9.1",
        "@testing-library/react": "^16.3.2",
        "@testing-library/user-event": "^14.6.1",
        "happy-dom": "^20.8.4",
        "lint-staged": "^16.3.2",
        "tsx": "^4.21.0",
        "turbo": "^2.0.0"
    },
    "peerDependencies": {
        "typescript": "^5"
    }
}
```

**Key decisions:**

- `"type": "module"` — the entire repo uses ESM. All config files use `.js` with ESM syntax.
- `"prepare": "husky || true"` — Husky installs on `npm install` but won't fail in CI where `.husky/` is absent.
- `lint` combines both `lint` and `format:check` so a single `npm run lint` catches all issues.
- `peerDependencies` on TypeScript keeps it out of the root `node_modules` but signals the requirement.

---

### `turbo.json`

The Turborepo task graph. Every script in `package.json` has a corresponding task here that declares its dependency chain.

```json
{
    "$schema": "https://turbo.build/schema.json",
    "tasks": {
        "build": {
            "dependsOn": ["^build", "^generate:types"],
            "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
        },
        "generate:types": {
            "dependsOn": ["^generate:types"],
            "outputs": ["dist/**/*.d.ts", "dist/**/*.d.ts.map"]
        },
        "test": {
            "dependsOn": ["^generate:types"],
            "outputs": []
        },
        "test:integration": {
            "dependsOn": ["^generate:types"],
            "outputs": []
        },
        "test:e2e": {
            "dependsOn": ["^build", "^generate:types"],
            "outputs": [],
            "cache": false
        },
        "lint": {
            "outputs": []
        },
        "typecheck": {
            "dependsOn": ["^generate:types"],
            "outputs": []
        },
        "format": {
            "outputs": []
        },
        "format:check": {
            "outputs": []
        }
    }
}
```

**Task dependency graph:**

| Task | Upstream dependencies | Caching |
|---|---|---|
| `build` | All upstream `build` + `generate:types` must complete first | Yes — `dist/**`, `.next/**` |
| `generate:types` | All upstream `generate:types` must complete first | Yes — `.d.ts` + `.d.ts.map` |
| `test` | Upstream type generation | Yes (no outputs) |
| `test:integration` | Upstream type generation | Yes (no outputs) |
| `test:e2e` | Full upstream build + type generation | **No** — always re-runs |
| `lint` | None | Yes (no outputs) |
| `typecheck` | Upstream type generation | Yes (no outputs) |
| `format` | None | Yes (no outputs) |
| `format:check` | None | Yes (no outputs) |

The `^` prefix means "run that task in all dependencies first." `generate:types` is a separate task from `build` so consumers can get declaration files without triggering the full bundle step.

---

### `tsconfig.json`

The root TypeScript config used for repo-wide tooling. Individual workspaces extend `@<scope>/typescript/build.json` directly.

```json
{
    "extends": "@<scope>/typescript/base.json",
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

---

### `.nvmrc`

```
24
```

Populated from `--node <version>` (defaults to `24`). Used by `actions/setup-node` in CI via `node-version-file: .nvmrc`.

---

### `.npmrc`

Not generated by `create-monorepo.js`. Add manually if you need registry or auth config.

---

### `.gitignore`

```
# dependencies
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
```

---

### `.prettierignore`

```
node_modules
dist
coverage
*.tsbuildinfo
package-lock.json
bun.lock
.turbo
```

---

### Additional root files

These are also written at the root but don't need deep explanation:

**`.gitattributes`**
```
# Ensure shell scripts always use LF line endings.
*.sh text eol=lf
```

**`.browserslistrc`**
```
> 0.2%, not dead, not op_mini all, not ios_saf < 15, not safari < 15, not kaios > 0
```

**`commitlint.config.js`**
```js
export default {
    extends: ['@commitlint/config-conventional'],
};
```

**`lint-staged.config.js`**
```js
export default {
    '*.{ts,tsx,js,jsx,json,md,css,html,yaml,yml}': ['prettier --write'],
    '*.{ts,tsx}': () => 'npx turbo run typecheck',
};
```

**`prettier.config.js`**
```js
import config from '@<scope>/prettier' with { type: 'json' };

export default config;
```

---

## 3.2 Tooling Workspaces

All five tooling packages live under `src/tooling/`. They are private, never published, and consumed only within the monorepo. Each extends or provides config for the tool it wraps.

---

### `@<scope>/typescript`

**Location:** `src/tooling/typescript/`

Provides shared TypeScript compiler configurations and the `fix-declaration-paths` post-processing script.

#### `package.json`

```json
{
    "name": "@<scope>/typescript",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./*": "./*.json",
        "./base.json": "./base.json",
        "./build.json": "./build.json",
        "./fix-declaration-paths": "./fix-declaration-paths.mjs"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

#### `base.json`

The base TypeScript compiler options. All workspace configs extend this directly or via `build.json`.

```json
{
    "$schema": "https://json.schemastore.org/tsconfig",
    "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "declaration": true,
        "declarationMap": true,
        "downlevelIteration": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "incremental": true,
        "noImplicitAny": true,
        "noFallthroughCasesInSwitch": true,
        "noImplicitOverride": true,
        "noImplicitReturns": true,
        "noImplicitThis": true,
        "noUnusedParameters": true,
        "noUncheckedSideEffectImports": true,
        "noUnusedLocals": true,
        "preserveConstEnums": true,
        "strictBindCallApply": true,
        "strictFunctionTypes": true,
        "strictNullChecks": true,
        "strictPropertyInitialization": true,
        "resolvePackageJsonExports": true,
        "resolvePackageJsonImports": true,
        "rewriteRelativeImportExtensions": false,
        "useUnknownInCatchVariables": true
    }
}
```

**Notable settings:**

- `module: NodeNext` + `moduleResolution: NodeNext` — full ESM with package.json `exports` resolution.
- `rewriteRelativeImportExtensions: false` — imports must use `.js`/`.jsx` extensions explicitly.
- All strict variants are individually enabled rather than relying solely on `"strict": true` — this makes the config self-documenting and immune to future changes in what `strict` enables.
- `incremental: true` — enables `.tsbuildinfo` caching for faster subsequent compiles.

#### `build.json`

Extends `base.json` for workspace builds. Adds output directory config and strips test files.

```json
{
    "$schema": "https://json.schemastore.org/tsconfig",
    "extends": "./base.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": ".",
        "emitDeclarationOnly": true
    },
    "exclude": [
        "node_modules",
        "dist",
        "**/__tests__/**",
        "**/__mocks__/**",
        "**/__fixtures__/**"
    ]
}
```

`emitDeclarationOnly: true` — type declarations are emitted by `tsc`, but JavaScript bundles come from esbuild. This avoids double-compilation and keeps the build pipeline clean.

#### `fix-declaration-paths.mjs`

A post-build script that rewrites `@/` path aliases in emitted `.d.ts` files to relative paths. TypeScript preserves aliases verbatim in declaration output, which breaks type resolution in consuming packages.

```js
#!/usr/bin/env node

/**
 * Rewrites `@/` path aliases in emitted `.d.ts` files to relative paths.
 *
 * TypeScript preserves path aliases verbatim in declaration output. When a
 * consuming package reads these `.d.ts` files, `@/` resolves to the consumer's
 * own source root — not the producer's — breaking the type chain. This script
 * runs after `tsc` to fix the paths in-place.
 *
 * Usage: node fix-declaration-paths.mjs [distDir]
 *   distDir defaults to `./dist` relative to cwd.
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
            .replace(/(from\s+['"])@\//g, `$1${prefix}`)
            .replace(/(import\s*\(\s*['"])@\//g, `$1${prefix}`);

        if (updated !== content) {
            await writeFile(filePath, updated, 'utf-8');
            modifiedCount++;
        }
    }

    if (modifiedCount > 0) {
        console.log(`fix-declaration-paths: rewrote @/ aliases in ${modifiedCount} .d.ts files`);
    }
}

main().catch((err) => {
    console.error('fix-declaration-paths failed:', err);
    process.exit(1);
});
```

**How it works:**

1. Recursively reads all `.d.ts` files under `dist/`.
2. Skips files that don't contain `@/` references.
3. For each file, computes the correct relative prefix by measuring how many directories deep the file is from `dist/`. A file at `dist/foo.d.ts` gets `./`, a file at `dist/utils/bar.d.ts` gets `../`.
4. Replaces both `from '@/...` and `import('@/...` patterns.
5. Only writes the file if something actually changed.

Run it in a workspace's `generate:types` script after `tsc`:

```json
"generate:types": "tsc -p tsconfig.build.json && node node_modules/@<scope>/typescript/fix-declaration-paths.mjs"
```

---

### `@<scope>/eslint`

**Location:** `src/tooling/eslint/`

Exports a `createConfig` factory that produces a flat ESLint config array.

#### `package.json`

```json
{
    "name": "@<scope>/eslint",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": "./index.js",
        "./*": "./*.js"
    },
    "peerDependencies": {
        "@eslint/js": "^10.0.0",
        "eslint": "^10.0.3",
        "eslint-plugin-import-x": "^4.0.0",
        "typescript-eslint": "^8.56.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

Peer dependencies keep ESLint out of the tooling package itself. Each consuming workspace installs the peers it needs.

#### `index.js`

```js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Creates the base ESLint configuration for @<scope> packages.
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
                                group: ['@<scope>/*/*'],
                                message:
                                    "Only import from barrel files using '@<scope>/<package>' — never from subpaths like '@<scope>/<package>/subpath'.",
                            },
                        ],
                    },
                ],
                'no-restricted-syntax': [
                    'error',
                    {
                        selector: 'ImportDeclaration[source.value=/\\.tsx?$/]',
                        message:
                            'Do not use .ts or .tsx extensions in import paths. Use .js or .jsx extensions instead.',
                    },
                ],
            },
        },
    ];
}

export default createConfig;
```

**Config layers, in order:**

1. **Ignore block** — skips `dist/`, `node_modules/`, and `*.config.{js,ts}` files.
2. **`eslint.configs.recommended`** — base JS rules.
3. **`tseslint.configs.recommended`** (spread) — TypeScript-aware rules with type checking.
4. **Language options** — wires up the TypeScript parser to the workspace's tsconfig via `project` + `tsconfigRootDir`. Both are parameterized so each workspace can pass its own paths.
5. **Custom rules** — `no-unused-vars` with `_` prefix escape, mandatory `curly` braces, and blank-line padding around blocks and returns.
6. **Test file overrides** — relaxes `no-explicit-any` and `no-non-null-assertion` in test files.
7. **Import restrictions** — two rules enforce monorepo discipline:
   - `no-restricted-imports` blocks deep imports like `@<scope>/models/internal` — consumers must use barrel files only.
   - `no-restricted-syntax` blocks `.ts`/`.tsx` extensions in import paths — use `.js`/`.jsx` per NodeNext resolution.

**Usage in a workspace:**

```js
// eslint.config.js
import { createConfig } from '@<scope>/eslint';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default createConfig('./tsconfig.json', __dirname);
```

---

### `@<scope>/prettier`

**Location:** `src/tooling/prettier/`

Exports a single shared Prettier config as JSON.

#### `package.json`

```json
{
    "name": "@<scope>/prettier",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": "./index.json",
        "./*": "./*.json"
    },
    "peerDependencies": {
        "prettier": "^3.0.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

#### `index.json`

```json
{
    "tabWidth": 4,
    "useTabs": false,
    "semi": true,
    "trailingComma": "all",
    "singleQuote": true,
    "printWidth": 120
}
```

The root `prettier.config.js` imports this with an import attribute (`with { type: 'json' }`), which is required to import JSON as a module in Node.js ESM.

---

### `@<scope>/vitest`

**Location:** `src/tooling/vitest/`

Exports a shared `baseConfig` object that workspaces merge into their own Vitest configs.

#### `package.json`

```json
{
    "name": "@<scope>/vitest",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": {
            "types": "./vitest.config.d.ts",
            "default": "./vitest.config.js"
        },
        "./*": {
            "types": "./*.d.ts",
            "default": "./*.js"
        }
    },
    "peerDependencies": {
        "vitest": "^4.0.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

The exports map includes `types` conditions so TypeScript can find the declarations when workspaces import the config.

#### `vitest.config.js`

```js
import path from 'path';

/**
 * Base Vitest configuration for @<scope> packages.
 *
 * Provides a shared test configuration that:
 * - globals: true -- Makes describe, it, expect available without imports.
 * - include pattern -- Discovers test files only in __tests__ directories.
 * - exclude -- Skips node_modules and dist directories.
 * - resolve.alias -- Maps the `@` path alias to `./src`.
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
```

**Key decisions:**

- `globals: true` — no need to import `describe`, `it`, `expect` in every test file.
- `include` pattern targets `__tests__/` directories only, not arbitrary `*.test.ts` files anywhere in the tree.
- `resolve.alias` maps `@` to `./src` at the workspace root, matching the `paths` alias in `tsconfig.json` that workspaces configure.

**Usage in a workspace:**

```js
// vitest.config.ts
import { mergeConfig } from 'vitest/config';
import { baseConfig } from '@<scope>/vitest';

export default mergeConfig(baseConfig, {
    test: {
        environment: 'happy-dom',
    },
});
```

---

### `@<scope>/esbuild`

**Location:** `src/tooling/esbuild/`

Provides three build configurations: shared utilities (`base.js`), dual-target library builds (`library.js`), and Node-only service builds (`service.js`).

#### `package.json`

```json
{
    "name": "@<scope>/esbuild",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./*": "./*.js",
        "./base": "./base.js",
        "./library": "./library.js",
        "./service": "./service.js"
    },
    "dependencies": {
        "browserslist-to-esbuild": "^2.1.1",
        "esbuild": "^0.27.3"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

Unlike the other tooling packages, `esbuild` uses `dependencies` (not `peerDependencies`) because the build scripts import esbuild directly — they're not consumed as a library.

#### `base.js`

Shared utilities used by both `library.js` and `service.js`.

```js
/**
 * Shared esbuild utilities for the @<scope> monorepo.
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
```

**Three utilities:**

- **`getExternalDeps(cwd)`** — reads the workspace's `package.json` and collects all dependency names from `dependencies`, `peerDependencies`, and `devDependencies`. These are passed as `external` to esbuild so they're never bundled in.
- **`getBrowserTargets()`** — calls `browserslist-to-esbuild()`, which reads the root `.browserslistrc` and returns the equivalent esbuild target list.
- **`baseOptions(entryPoints, cwd)`** — returns the shared options: bundled ESM, source maps enabled, all deps external, logging at `info`.
- **`parseEntryPoints()`** — reads entry points from the `ESBUILD_ENTRIES` env var (comma-separated) or `--entry` CLI flags. This lets Turborepo or npm scripts pass entries without modifying the build file itself.

#### `library.js`

Dual-target builds for shared library packages. Runs two esbuild invocations in parallel.

```js
/**
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
```

**Dual-target design:**

Both builds run in parallel via `Promise.all`. They share the same `baseOptions` (same entry points, same externals, ESM format, source maps) but diverge on:

| | Browser bundle | Node bundle |
|---|---|---|
| `outdir` | `dist/browser/` | `dist/node/` |
| `platform` | `browser` | `node` |
| `target` | From `.browserslistrc` via `browserslist-to-esbuild` | `['node22']` |

A consuming workspace's `package.json` then uses conditional exports to route each environment to the right bundle:

```json
"exports": {
    ".": {
        "browser": "./dist/browser/index.js",
        "default": "./dist/node/index.js"
    }
}
```

#### `service.js`

Node-only builds for Lambda service packages.

```js
/**
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
```

Differences from `library.js`:

- Default entry point is `src/handler.ts` instead of `src/index.ts`.
- Single build targeting `node22`, output to `dist/` directly (no subdirectory).
- `packages: 'external'` is set explicitly. For Lambda, you want all node_modules excluded from the bundle — they're either in the Lambda layer or the deployment package separately. This is belt-and-suspenders alongside `getExternalDeps`.

---

## 3.3 Tooling Workspace Summary

| Package | What it provides | Consumed via |
|---|---|---|
| `@<scope>/typescript` | `base.json`, `build.json`, `fix-declaration-paths.mjs` | `extends` in tsconfig files; script in `generate:types` |
| `@<scope>/eslint` | `createConfig()` factory | `import` in `eslint.config.js` |
| `@<scope>/prettier` | `index.json` Prettier options | `import` in `prettier.config.js` |
| `@<scope>/vitest` | `baseConfig` object | `mergeConfig()` in `vitest.config.ts` |
| `@<scope>/esbuild` | `base.js`, `library.js`, `service.js` | `node` script in package.json `build` |

All five packages are `private: true`, use `type: "module"`, and carry a `lint-staged` config that runs Prettier on commit.
# Section 3a: CI, Git Hooks, Documentation Templates, and Skills

This section covers everything `create-monorepo.js` generates after root configs and tooling workspaces. The steps run in this order: GitHub Actions workflow, Husky hooks, documentation templates, skills copy, placeholder directories, then git init.

---

## 3a.1 GitHub Actions CI Workflow

Written to `.github/workflows/ci.yml`. The pipeline has 8 jobs with a clear dependency chain: `install` runs first, then `test`, `test-integration`, `lint`, `typecheck` all run in parallel off `install`, then `build` gates on all four, then `test-e2e` runs after `build`.

All jobs restore the npm dependency cache by key `${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}`. Only the `install` job saves it. The node version comes from `.nvmrc` in every job.

Exact generated content:

```yaml
name: CI

on:
    push:
        branches: [main]
    pull_request:
        branches: [main]

permissions:
    contents: read

concurrency:
    group: ci-${{ github.workflow }}-${{ github.ref }}
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
                  key: ${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}

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
                  key: ${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}

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
                  key: ${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}

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
                  key: ${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}

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
                  key: ${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}

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
                  key: ${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}

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
                  key: ${{ runner.os }}-node-full-${{ hashFiles('package-lock.json') }}

            - name: Get Playwright version
              id: pw-version
              run: echo "version=$(npx playwright --version | awk '{print $2}')" >> "$GITHUB_OUTPUT"

            - name: Cache Playwright browsers
              id: pw-cache
              uses: actions/cache@v4
              with:
                  path: ~/.cache/ms-playwright
                  key: ${{ runner.os }}-playwright-${{ steps.pw-version.outputs.version }}

            - name: Install Playwright browsers
              if: steps.pw-cache.outputs.cache-hit != 'true'
              run: npx playwright install --with-deps chromium

            - name: Install Playwright system deps
              if: steps.pw-cache.outputs.cache-hit == 'true'
              run: npx playwright install-deps chromium

            - name: Run e2e tests
              run: npm run test:e2e
```

### Job dependency graph

```
install
├── test          ──┐
├── test-integration─┤
├── lint          ──┤─── build ─── test-e2e
└── typecheck     ──┘
```

`build` won't run unless all four parallel jobs pass. `test-e2e` only runs after a successful build.

### Playwright caching

The E2E job caches Playwright browsers by version under `~/.cache/ms-playwright`. On a cache hit it runs `playwright install-deps chromium` (system deps only, no browser download). On a miss it runs `playwright install --with-deps chromium` (full install).

---

## 3a.2 Husky Git Hooks

### `.husky/pre-commit`

```sh
npx lint-staged
```

### `.husky/commit-msg`

```sh
npx commitlint --edit "$1"
```

### `commitlint.config.js`

Extends `@commitlint/config-conventional`. Enforces conventional commit format on every commit message.

```js
export default {
    extends: ['@commitlint/config-conventional'],
};
```

### `lint-staged.config.js`

Two rules run on staged files before commit:

1. Prettier formats all common file types in place.
2. TypeScript files trigger `npx turbo run typecheck` across the whole monorepo (not just staged files — the function form bypasses the default per-file behavior).

```js
export default {
    '*.{ts,tsx,js,jsx,json,md,css,html,yaml,yml}': ['prettier --write'],
    '*.{ts,tsx}': () => 'npx turbo run typecheck',
};
```

Note: `husky` runs via the `prepare` lifecycle script in `package.json` (`"prepare": "husky || true"`). The `|| true` keeps `npm install` from failing in CI environments where husky isn't needed.

---

## 3a.3 Documentation Templates

The script copies four files from `templates/` into the generated repo, running each through `parameterize()` first. Parameterization rewrites these placeholders:

| Placeholder | Replaced with |
|---|---|
| `{{ORG}}` | `your-org` |
| `{{SCOPE}}` | Scope with capital first letter (e.g. `Myapp`) |
| `{{scope}}` | Lowercase scope (e.g. `myapp`) |
| `@{{scope}}` | Scoped package prefix (e.g. `@myapp`) |

The four copies, in source order:

```
templates/docs/CODING_STANDARDS.md   →  docs/CODING_STANDARDS.md
templates/docs/tooling.md            →  docs/tooling.md
templates/CONTRIBUTING.md            →  CONTRIBUTING.md
templates/.opencode/AGENTS.md        →  .opencode/AGENTS.md
```

If a template file doesn't exist at runtime, the copy is skipped with a log message rather than throwing. The full content of these templates is covered in Section 5.

---

## 3a.4 OpenCode Config

Written to `opencode.jsonc`:

```json
{
    "$schema": "https://opencode.ai/config.json",
    "instructions": [".opencode/AGENTS.md"],
    "compaction": {
        "auto": true,
        "prune": true,
        "reserved": 12000
    },
    "agent": {
        "compaction": {
            "model": "github-copilot/claude-haiku-4.5"
        }
    }
}
```

---

## 3a.5 Skills Directory

The script reads `templates/.opencode/skills/`, iterates every subdirectory, and copies each one recursively to `.opencode/skills/<skill-name>/`. File contents are parameterized during the copy.

19 skill directories are copied:

1. `accessibility`
2. `aws-advisor`
3. `aws-sts-auth`
4. `best-practices`
5. `code-reviewer`
6. `core-web-vitals`
7. `docs-writer`
8. `figma`
9. `figma-implement-design`
10. `gh-address-comments`
11. `gh-fix-ci`
12. `git-worktree-agent-workflow`
13. `mastering-github-cli`
14. `perf-web-optimization`
15. `security-best-practices`
16. `security-threat-model`
17. `sentry`
18. `seo`
19. `technical-design-doc-creator`

If `templates/.opencode/skills/` doesn't exist, the whole block is skipped with a single log line.

---

## 3a.6 Placeholder Directories

Four workspace directories are created with empty `.gitkeep` files so they exist in version control before any packages are added:

| Directory | Purpose |
|---|---|
| `src/shared/` | Shared library packages (`@scope/*`) |
| `src/services/` | Backend service packages |
| `src/web/` | Web application workspace |
| `src/mobile/` | Mobile application workspace |

Each gets `src/<dir>/.gitkeep` written as an empty file.

---

## 3a.7 Git Init Sequence

After all files are written, the script initializes a git repository:

```bash
git init
git add -A
```

No initial commit is created by the script. Both commands run with `stdio: 'pipe'` so their output doesn't surface to the user. If git isn't available or either command fails, the error is caught and the script logs `git init skipped (git not available or error)` and continues without throwing.
# Section 4: Workspace Bootstrap (`create-workspace.js`)

This script generates a new workspace inside an existing monorepo. It is fully non-interactive — all input comes from CLI flags — making it safe to run from automated agents and CI pipelines.

---

## 4.1 Usage

```
node scripts/bootstrap/create-workspace.js \
  --name <pkg-name> \
  --location <path> \
  --type <type> \
  [--scope <scope>]
```

**Required flags:**

| Flag | Description |
|---|---|
| `--name` | Short package name, e.g. `models` |
| `--location` | Relative path from repo root, e.g. `src/shared/models` |
| `--type` | One of `library`, `serverless`, `nextjs`, `react-native`, `nestjs` (`nestjs-docker` accepted as compatibility alias) |

**Optional flags:**

| Flag | Description |
|---|---|
| `--scope` | npm scope without `@`, e.g. `myapp`. Auto-detected if omitted. |

**Example:**

```bash
node scripts/bootstrap/create-workspace.js \
  --name models \
  --location src/shared/models \
  --type library \
  --scope myapp
# → Creates @myapp/models at src/shared/models/
```

---

## 4.2 Argument Parsing

The script uses a simple positional parser over `process.argv.slice(2)`. No third-party arg parser is involved.

```js
function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1 || idx + 1 >= args.length) {
        return undefined;
    }
    return args[idx + 1];
}
```

The four resolved values are:

```js
const name     = getArg('name');
const location = getArg('location');
const type     = getArg('type');
const scope    = getArg('scope') || detectScope();
```

If any of `name`, `location`, or `type` are missing, the script prints usage and exits with code 1. If `type` is not in `VALID_TYPES`, it also exits 1. If `scope` cannot be resolved (no flag and detection fails), it exits 1 with a message asking you to pass `--scope` explicitly.

---

## 4.3 Scope Detection

When `--scope` is not provided, `detectScope()` reads the root `package.json` and strips the leading `@` from its `name` field:

```js
function detectScope() {
    try {
        const rootPkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
        if (rootPkg.name) {
            return rootPkg.name.replace(/^@/, '');
        }
    } catch {
        return undefined;
    }
    return undefined;
}
```

**Algorithm:**

1. Read `package.json` from the current working directory (repo root).
2. If `rootPkg.name` exists, strip a leading `@` and return the result.
3. On any read/parse error, return `undefined`.
4. If `undefined` is returned, the caller exits with an error.

So a root `package.json` with `"name": "@myapp"` or `"name": "myapp"` both yield scope `myapp`.

---

## 4.4 Path Resolution

Two path values are derived after argument parsing:

```js
const pkgName = `@${scope}/${name}`;   // e.g. @myapp/models
const wsRoot  = resolve(location);     // absolute path on disk
```

All file writes use `wsRoot` as the base. The `w()` helper joins relative paths onto it and creates intermediate directories automatically:

```js
function w(relPath, content) {
    const abs = join(wsRoot, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf-8');
    console.log(`  created ${join(location, relPath)}`);
}

function json(relPath, obj) {
    w(relPath, JSON.stringify(obj, null, 4) + '\n');
}
```

The workspace root directory itself is created before any type-specific generator runs:

```js
mkdirSync(wsRoot, { recursive: true });
```

---

## 4.5 Node Version Detection

The `nodeVersion` constant is resolved once at startup via an IIFE. It reads `.nvmrc` from the repo root. If the file is absent or unreadable, it falls back to `'24'`.

```js
const nodeVersion = (() => {
    try {
        const nvmrc = readFileSync(resolve('.nvmrc'), 'utf-8').trim();
        return nvmrc;
    } catch {
        return '24';
    }
})();
```

This value is used only by the `nestjs` generator (and `nestjs-docker` alias path) for the `FROM node:${nodeVersion}-alpine` lines in the Dockerfile.

---

## 4.6 Shared Files (All Workspace Types)

Every workspace type calls a subset of the following shared writers. The exact set called per type is documented in the per-type sections below.

### `eslint.config.js`

```js
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createConfig from '@<scope>/eslint';

export default createConfig('./tsconfig.json', dirname(fileURLToPath(import.meta.url)));
```

### `prettier.config.js`

```js
import config from '@<scope>/prettier' with { type: 'json' };

export default config;
```

### `.prettierignore`

```
node_modules
dist
coverage
```

### `vitest.config.ts`

```ts
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@<scope>/vitest';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['**/__tests__/**/*.test.ts'],
            passWithNoTests: true,
        },
    }),
);
```

### `tsconfig.json` (standard variant)

```json
{
    "extends": "@<scope>/typescript/base.json",
    "compilerOptions": {
        "noEmit": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", "dist"]
}
```

### `tsconfig.build.json`

```json
{
    "extends": "@<scope>/typescript/build.json",
    "compilerOptions": {
        "rootDir": "./src",
        "outDir": "dist",
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src/**/*.ts"],
    "exclude": [
        "node_modules",
        "dist",
        "src/**/__tests__/**",
        "src/**/__mocks__/**",
        "src/**/__fixtures__/**"
    ]
}
```

### `src/index.ts` (standard barrel)

```ts
/**
 * @<scope>/<name>
 *
 * @requirements
 * TODO: Define requirements for this module.
 */

export {};
```

---

## 4.7 Workspace Type: `library`

**Files generated:**

- `package.json`
- `tsconfig.json` (standard)
- `tsconfig.build.json`
- `eslint.config.js`
- `prettier.config.js`
- `vitest.config.ts`
- `src/index.ts`

Note: `.prettierignore` is **not** written for `library`.

### `package.json`

```json
{
    "name": "@<scope>/<name>",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "main": "./dist/node/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "browser": "./dist/browser/index.js",
            "default": "./dist/node/index.js"
        }
    },
    "scripts": {
        "build": "node --import=tsx --input-type=module -e \"import '@<scope>/esbuild/library'\"",
        "generate:types": "tsc -p tsconfig.build.json && node --input-type=module -e \"await import('@<scope>/typescript/fix-declaration-paths')\"",
        "test": "vitest run",
        "lint": "eslint .",
        "typecheck": "tsc --noEmit",
        "format": "prettier --write .",
        "format:check": "prettier --check ."
    },
    "devDependencies": {
        "@<scope>/eslint": "*",
        "@<scope>/prettier": "*",
        "@<scope>/typescript": "*",
        "@<scope>/vitest": "*",
        "@<scope>/esbuild": "*",
        "eslint": "^10.0.3",
        "prettier": "^3.0.0",
        "vitest": "^4.0.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs}": "eslint --fix",
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

The `exports` map provides three conditions: `types` for TypeScript, `browser` for bundler/browser targets, and `default` for Node. The build script delegates to `@<scope>/esbuild/library` which is expected to produce both `/dist/node/` and `/dist/browser/` bundles.

---

## 4.8 Workspace Type: `serverless`

**Files generated:**

- `package.json`
- `tsconfig.json` (serverless variant — includes `e2e/**/*.ts`)
- `tsconfig.build.json`
- `eslint.config.js`
- `prettier.config.js`
- `.prettierignore`
- `vitest.config.ts`
- `serverless.yml`
- `src/handler.ts`
- `serverless-compose.yml` updated at repo root (see Section 4.12)

### `package.json`

```json
{
    "name": "@<scope>/<name>",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "main": "dist/handler.js",
    "exports": {
        ".": "./dist/handler.js"
    },
    "scripts": {
        "build": "node --import=tsx --input-type=module -e \"import '@<scope>/esbuild/service'\"",
        "generate:types": "tsc -p tsconfig.build.json && node --input-type=module -e \"await import('@<scope>/typescript/fix-declaration-paths')\"",
        "dev": "serverless offline",
        "test": "vitest run",
        "test:integration": "vitest run --config vitest.integration.config.ts",
        "lint": "eslint .",
        "typecheck": "tsc --noEmit",
        "format": "prettier --write .",
        "format:check": "prettier --check ."
    },
    "dependencies": {},
    "devDependencies": {
        "@<scope>/eslint": "*",
        "@<scope>/prettier": "*",
        "@<scope>/typescript": "*",
        "@<scope>/vitest": "*",
        "@<scope>/esbuild": "*",
        "@eslint/js": "^10.0.0",
        "@types/aws-lambda": "^8.10.0",
        "eslint": "^10.0.3",
        "prettier": "^3.0.0",
        "serverless-offline": "^14.5.0",
        "typescript": "^5.0.0",
        "typescript-eslint": "^8.56.0",
        "vitest": "^4.0.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs}": "eslint --fix",
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

### `tsconfig.json` (serverless variant)

The serverless `tsconfig.json` differs from the standard one: it drops `noEmit` (the build produces output), and expands `include` to also cover `e2e/**/*.ts`.

```json
{
    "extends": "@<scope>/typescript/base.json",
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src/**/*.ts", "e2e/**/*.ts"]
}
```

### `serverless.yml`

```yaml
service: <scope>-<name>

provider:
    name: aws
    runtime: nodejs22.x
    architecture: arm64
    stage: ${opt:stage, 'dev'}
    region: ${opt:region, 'us-east-1'}
    memorySize: 256
    timeout: 29
    environment:
        NODE_OPTIONS: '--enable-source-maps'

build:
    esbuild:
        bundle: true
        minify: true
        sourcemap: true
        target: es2022
        platform: node
        format: esm
        mainFields:
            - module
            - main

plugins:
    - serverless-offline

custom:
    serverless-offline:
        httpPort: 3000
        lambdaPort: 3002
        noPrependStageInUrl: true

functions:
    <name>:
        handler: src/handler.handler
        events:
            - http:
                  path: /<name>
                  method: ANY
            - http:
                  path: /<name>/{proxy+}
                  method: ANY
```

Notable defaults: `arm64` architecture, `nodejs22.x` runtime, 256 MB memory, 29-second timeout (one second under API Gateway's 30-second limit). The esbuild config targets ESM with `esm` format and `es2022` target. The offline plugin listens on port 3000 (HTTP) and 3002 (Lambda invocation).

### `src/handler.ts`

```ts
/**
 * Lambda handler entry point for @<scope>/<name>.
 *
 * @requirements
 * TODO: Define requirements for this service.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Hello from <name>' }),
    };
}
```

---

## 4.9 Workspace Type: `nextjs`

**Files generated:**

- `package.json`
- `tsconfig.json` (Next.js variant)
- `eslint.config.js`
- `prettier.config.js`
- `.prettierignore`
- `next.config.js`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/index.ts`

Note: `tsconfig.build.json` and `vitest.config.ts` are **not** written for `nextjs`.

### `package.json`

```json
{
    "name": "@<scope>/<name>",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint",
        "typecheck": "tsc --noEmit",
        "format": "prettier --write .",
        "format:check": "prettier --check ."
    },
    "dependencies": {
        "next": "^15.0.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0"
    },
    "devDependencies": {
        "@<scope>/eslint": "*",
        "@<scope>/prettier": "*",
        "@<scope>/typescript": "*",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "eslint": "^10.0.3",
        "prettier": "^3.0.0",
        "typescript": "^5.0.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs}": "eslint --fix",
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

### `tsconfig.json` (Next.js variant)

Next.js requires `moduleResolution: "Bundler"` and JSX preservation. It also adds a `@web/*` path alias alongside the standard `@/*`, and excludes `.next` instead of `dist`.

```json
{
    "extends": "@<scope>/typescript/base.json",
    "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "jsx": "preserve",
        "noEmit": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"],
            "@web/*": ["./src/*"]
        }
    },
    "include": ["src/**/*.ts", "src/**/*.tsx", "next-env.d.ts"],
    "exclude": ["node_modules", ".next"]
}
```

### `next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [],
};

export default nextConfig;
```

### `src/app/layout.tsx`

The title uses the scope name with its first letter capitalised (e.g. scope `myapp` → title `Myapp`).

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '<Scope>',
    description: '',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
```

### `src/app/page.tsx`

```tsx
export default function HomePage() {
    return (
        <main>
            <h1><Scope></h1>
        </main>
    );
}
```

### `src/index.ts`

Same as the standard barrel export (see Section 4.6).

---

## 4.10 Workspace Type: `react-native`

**Files generated:**

- `package.json`
- `tsconfig.json` (React Native variant)
- `eslint.config.js`
- `prettier.config.js`
- `src/app/index.tsx`
- `src/index.ts`

Note: `.prettierignore`, `tsconfig.build.json`, and `vitest.config.ts` are **not** written for `react-native`.

### `package.json`

```json
{
    "name": "@<scope>/<name>",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "main": "expo-router/entry",
    "scripts": {
        "dev": "expo start",
        "build": "expo export",
        "lint": "eslint .",
        "typecheck": "tsc --noEmit",
        "format": "prettier --write .",
        "format:check": "prettier --check ."
    },
    "dependencies": {
        "expo": "^53.0.0",
        "expo-router": "^5.0.0",
        "react": "^19.0.0",
        "react-native": "^0.79.0"
    },
    "devDependencies": {
        "@<scope>/eslint": "*",
        "@<scope>/prettier": "*",
        "@<scope>/typescript": "*",
        "@types/react": "^19.0.0",
        "eslint": "^10.0.3",
        "prettier": "^3.0.0",
        "typescript": "^5.0.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs}": "eslint --fix",
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

The `main` field is hardcoded to `expo-router/entry` — Expo Router's required entry point convention.

### `tsconfig.json` (React Native variant)

Uses `jsx: "react-native"` and `moduleResolution: "Bundler"`. Adds `@mobile/*` as an additional path alias. Excludes only `node_modules` (no `dist`).

```json
{
    "extends": "@<scope>/typescript/base.json",
    "compilerOptions": {
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "jsx": "react-native",
        "noEmit": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"],
            "@mobile/*": ["./src/*"]
        }
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "exclude": ["node_modules"]
}
```

### `src/app/index.tsx`

The heading text uses the scope name with its first letter capitalised.

```tsx
import { Text, View } from 'react-native';

export default function HomeScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text><Scope></Text>
        </View>
    );
}
```

### `src/index.ts`

Same as the standard barrel export (see Section 4.6).

---

## 4.11 Workspace Type: `nestjs`

**Files generated:**

- `package.json`
- `tsconfig.json` (standard)
- `tsconfig.build.json`
- `eslint.config.js`
- `prettier.config.js`
- `.prettierignore`
- `vitest.config.ts`
- `Dockerfile`
- `docker-compose.yml`
- `src/main.ts`
- `src/app.module.ts`
- `src/index.ts`

### `package.json`

```json
{
    "name": "@<scope>/<name>",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "build": "nest build",
        "dev": "nest start --watch",
        "start": "node dist/main.js",
        "test": "vitest run",
        "lint": "eslint .",
        "typecheck": "tsc --noEmit",
        "format": "prettier --write .",
        "format:check": "prettier --check .",
        "docker:up": "docker compose up -d",
        "docker:down": "docker compose down"
    },
    "dependencies": {
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/platform-express": "^11.0.0",
        "reflect-metadata": "^0.2.0"
    },
    "devDependencies": {
        "@<scope>/eslint": "*",
        "@<scope>/prettier": "*",
        "@<scope>/typescript": "*",
        "@<scope>/vitest": "*",
        "@nestjs/cli": "^11.0.0",
        "eslint": "^10.0.3",
        "prettier": "^3.0.0",
        "typescript": "^5.0.0",
        "vitest": "^4.0.0"
    },
    "lint-staged": {
        "*.{ts,tsx,js,jsx,mjs,cjs}": "eslint --fix",
        "*.{ts,tsx,js,jsx,mjs,cjs,json,md,css,html,yaml,yml}": "prettier --write"
    }
}
```

### `Dockerfile`

`<nodeVersion>` is resolved from `.nvmrc` at repo root, falling back to `24`.

```dockerfile
FROM node:<nodeVersion>-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:<nodeVersion>-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### `docker-compose.yml`

```yaml
services:
    <name>:
        build: .
        ports:
            - "3000:3000"
        environment:
            NODE_ENV: development
```

### `src/main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}

bootstrap();
```

### `src/app.module.ts`

```ts
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [],
})
export class AppModule {}
```

### `src/index.ts`

Same as the standard barrel export (see Section 4.6).

---

## 4.12 serverless-compose.yml Update Logic

After generating a `serverless` workspace, `updateServerlessCompose()` runs automatically. It resolves `serverless-compose.yml` relative to the current working directory (repo root).

**Case 1: File does not exist**

A new `serverless-compose.yml` is created with a `services` block containing only the new service:

```yaml
services:
    <name>:
        path: <location>
```

**Case 2: File exists, service already present**

The function checks whether the string `    <name>:` (four-space indent) already appears in the file content. If it does, the file is left unchanged and a skip message is logged.

**Case 3: File exists, service not yet present**

The new service entry is appended to the end of the existing file content:

```
\n    <name>:\n        path: <location>\n
```

The write is done with `writeFileSync` directly (not through the `w()` helper), since the target is the repo root rather than inside `wsRoot`.

---

## 4.13 Root Workspace Registration

After the type-specific generator runs, `updateRootWorkspaces()` registers the new workspace path in the root `package.json`.

### Algorithm

1. Resolve `package.json` from the current working directory. If the file doesn't exist, skip and log.
2. Read the `workspaces` array (defaults to `[]` if absent).
3. **Glob coverage check:** iterate existing workspace entries. For each entry:
   - If the entry contains `*`, convert it to a regex by replacing every `*` with `[^/]+`, wrap with `^...$`, and test `location` against it.
   - If the entry has no `*`, check for strict equality with `location`.
   - If any entry matches, the path is already covered. Log and return without writing.
4. **Exact path check:** if `workspaces` already includes the exact `location` string, log and return.
5. Push `location` onto the array, write the updated `package.json` back to disk with 4-space indentation.

### Glob matching detail

```js
const isGlobCovered = workspaces.some((ws) => {
    if (!ws.includes('*')) {
        return ws === location;
    }
    // Simple glob matching: "src/shared/*" matches "src/shared/models"
    const pattern = ws.replace(/\*/g, '[^/]+');
    return new RegExp(`^${pattern}$`).test(location);
});
```

The glob replacement is intentionally simple: each `*` maps to `[^/]+`, which matches one or more non-slash characters. This correctly handles single-level globs like `src/shared/*` but does not handle `**` or brace expansion. The intent is to avoid re-registering a workspace when the parent directory is already covered by a glob.

**Examples:**

| Existing entry | New location | Covered? |
|---|---|---|
| `src/shared/*` | `src/shared/models` | Yes |
| `src/shared/*` | `src/shared/models/deep` | No (contains `/`) |
| `src/services/*` | `src/shared/models` | No |
| `src/shared/models` | `src/shared/models` | Yes (exact match) |

---

## 4.14 Execution Flow Summary

```
parse args
  ↓
detectScope() if --scope omitted
  ↓
validate name, location, type, scope
  ↓
read .nvmrc → nodeVersion
  ↓
mkdirSync(wsRoot)
  ↓
switch(type)
  ├── library        → generateLibrary()
  ├── serverless     → generateServerless() → updateServerlessCompose()
  ├── nextjs         → generateNextJs()
  ├── react-native   → generateReactNative()
  └── nestjs         → generateNestJs()    (nestjs-docker accepted as alias)
  ↓
updateRootWorkspaces()
  ↓
print next steps
```

The `nodeVersion` IIFE runs at module load time, before any generator is called, so it's available to `generateNestJs()` via closure.

---

## 4.15 File Matrix by Workspace Type

| File | library | serverless | nextjs | react-native | nestjs |
|---|:---:|:---:|:---:|:---:|:---:|
| `package.json` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tsconfig.json` | standard | serverless variant | nextjs variant | rn variant | standard |
| `tsconfig.build.json` | ✓ | ✓ | | | ✓ |
| `eslint.config.js` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `prettier.config.js` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `.prettierignore` | | ✓ | ✓ | | ✓ |
| `vitest.config.ts` | ✓ | ✓ | | | ✓ |
| `src/index.ts` | ✓ | | ✓ | ✓ | ✓ |
| `serverless.yml` | | ✓ | | | |
| `src/handler.ts` | | ✓ | | | |
| `src/app/layout.tsx` | | | ✓ | | |
| `src/app/page.tsx` | | | ✓ | | |
| `src/app/index.tsx` | | | | ✓ | |
| `Dockerfile` | | | | | ✓ |
| `docker-compose.yml` | | | | | ✓ |
| `src/main.ts` | | | | | ✓ |
| `src/app.module.ts` | | | | | ✓ |
# Section 5: Template Documents and Regeneration Algorithm

This section serves two purposes. Part 1 is the complete verbatim content of every template file the bootstrap scripts copy into place, so a reader can reconstruct any generated artifact without access to the source repository. Part 2 is an algorithm an automated agent can follow to reproduce the full bootstrap output from scratch using only this document and sections 1 through 4.

---

## Part 1: Template Documents — Full Content

The four templates below are copied by `create-monorepo.js` after the tooling workspaces are written. Parameterization placeholders (`{{SCOPE}}`, `{{scope}}`, `@{{scope}}`) are preserved exactly as they appear in the source files. The scripts perform a global find-and-replace on these placeholders at write time using the `--name` argument (see Section 2 for parameterization rules).

---

### Template 1: Agent Instructions

**Source:** `scripts/bootstrap/templates/.opencode/AGENTS.md`
**Destination:** `.opencode/AGENTS.md` (monorepo root)

```markdown
# {{SCOPE}} - Agent Instructions

Behavioral rules for LLM agents on this monorepo. For coding conventions, see `docs/CODING_STANDARDS.md`.

## Documentation Map

| Document                   | Contains                                                    | When to Read                                    |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `docs/CODING_STANDARDS.md` | Code style, naming, exports, types, testing, error handling | Before writing or modifying code                |
| `docs/tooling.md`          | Shared configs, workspace scripts, adding workspaces        | When modifying tooling configs or adding workspaces |

### Document Loading Strategy

**Do NOT read documentation files upfront.** Read them lazily, only when entering the relevant scope:

- **Discovery/Planning**: Use this file (AGENTS.md) and `grep` only. Do not read CODING_STANDARDS.md or other docs.
- **Implementation**: Load `git-worktree-agent-workflow` skill **before any code changes**. Read `docs/CODING_STANDARDS.md` before writing code. Read workspace-specific docs only for the workspace you're modifying.
- **Integration**: Load `mastering-github-cli` skill. Do not re-read coding standards.
- **Never read a doc "just in case"** — grep for the specific section you need if unsure.

## Project Overview

TypeScript monorepo with cross-platform workspaces (web, mobile, server) and shared tooling conventions.

## Runtime & Tooling

- **Node**: `>=24.0.0` (see `.nvmrc`) | **Package manager**: npm (workspaces) | **Module**: ESM
- **Build**: Turborepo → esbuild for JS, `tsc --emitDeclarationOnly` for types
- **TypeScript**: Strict mode, `ES2022` target, `NodeNext` module resolution (`Bundler` for web/mobile)

For tooling configuration details (Vitest, TypeScript, ESLint, Prettier), workspace script conventions, and adding new workspaces, see `docs/tooling.md`.

## Skills Reference

Available skills in `.opencode/skills/`. Load via the `skill` tool only when needed — do not read SKILL.md files upfront.

**Git & CI**: `git-worktree-agent-workflow` (**before any code changes**), `mastering-github-cli`, `gh-fix-ci`, `gh-address-comments`, `code-reviewer`
**Frontend**: `accessibility`, `core-web-vitals`, `perf-web-optimization`, `seo`, `figma`, `figma-implement-design`
**Security**: `security-best-practices`, `security-threat-model`
**Docs & Design**: `docs-writer`, `technical-design-doc-creator`
**Infrastructure**: `aws-advisor`, `sentry`
**Quality**: `best-practices`

## Coding & Testing Conventions

**Read `docs/CODING_STANDARDS.md` before writing or modifying code.** It covers: code style, naming, exports, types, imports, file extensions, error handling, database schema, and testing patterns.

Key rules:

- Every source file must have a `@requirements` block at the top (after imports).
- Follow TDD: requirements → test plan → tests → implementation → refactor.
- Every test file must have a test plan at the top mapping requirements to test cases.
- Comment **why**, not **what**. JSDoc on public APIs only.
- Tests should be meaningful — do not add tests purely for coverage.

## Task Workflow

Every task follows a discovery → plan → implement → integrate flow. The level of ceremony depends on risk.

### Risk Levels

| Risk Level | Examples | Approach |
|-----------|----------|----------|
| **Trivial** | Typo fixes, comment updates, single-line config changes | Execute directly, present result. No approval needed. |
| **Low** | Doc edits, single-file changes in established patterns, test additions | Quick plan → implement → integrate |
| **Medium** | Feature in established patterns, multi-file edits, refactors within one module | Present findings → plan with approval → implement → integrate |
| **High** | Cross-module refactors, schema changes, new architecture patterns, security-sensitive changes | Present findings → plan with approval → implement with review gates → integrate |

When uncertain about risk level, **default to Medium**. The human can always say "just do it" to skip gates.

### Discovery

Understand the problem before proposing solutions. Read relevant code, identify root cause or affected areas, list unknowns and risks.

**Gate** (Medium/High risk): Present findings → wait for human approval.

### Planning

Break work into the smallest possible incremental changes. Identify blocking vs. parallelizable work. Each increment should be a single, independently mergeable PR. Include a test plan.

**Gate** (Medium/High risk): Present plan → wait for human approval.

### Implementation (per increment)

**⚠️ MANDATORY: Load `git-worktree-agent-workflow` skill BEFORE writing any code.** All code changes MUST happen inside a git worktree — no exceptions unless the human explicitly says "skip worktree" or "work on main".

Implement one increment at a time. Run linting, type checks, and tests on affected packages. Summarize what changed and what was verified.

**Gate** (Medium/High risk): After each increment → wait for human feedback.

### Integration

Commit, push, create PR. Load `mastering-github-cli` skill. Worktree skill should already be loaded from Implementation.

**Gate** (Medium/High risk): Present PR for review before starting the next increment.

### Approval Signals

Recognize these approval patterns:

- **Explicit approval**: "Approved", "LGTM", "Go ahead", "Proceed"
- **Forward intent**: "Continue", "Continue if you have next steps", "Keep going", "What's next?"
- **Conditional approval**: "Proceed with [option]", "Do [X] first, then [Y]"

If the human expresses forward intent and there are pending tasks in your todo list, **continue working**. Do not re-ask for permission that was already granted. Silence after a gate presentation (no response at all) is the only case where you should wait — an explicit message with forward language is approval.

### Approval Persistence

**An approved plan remains approved across the entire implementation.** Once the human approves a plan:

- Do not re-ask for permission to perform operations that are part of the approved plan (builds, tests, linting, multi-file edits, npm install in worktrees).
- Each completed increment within the plan gets a brief summary, not a new approval request.
- Only re-ask if you encounter a significant deviation from the approved plan (unexpected error, scope change, new risk discovered).

**Routine operations that never require confirmation** (when part of an approved plan or trivial task):
- Running builds, tests, linting, typechecks
- `npm install` in worktrees
- Git commits (but NOT force push)
- File creation/editing within the approved scope
- Running formatters

**Destructive operations that always require confirmation** (even within an approved plan):
- `git push --force`, `git reset --hard`, branch deletion on remote
- Production deployments, database migrations
- `rm -rf` on directories outside `.worktrees/`
- Any operation that cannot be undone

### TODO Continuation

The system may inject a `TODO CONTINUATION` directive when you have incomplete tasks. This is a **legitimate signal to resume work**, not noise to ignore. When you receive it:

1. Check your todo list for the next pending task.
2. If the human's last message expressed approval or forward intent, continue immediately.
3. If the human's last message redirected the approach, follow the redirect instead.
4. If there was no human message (pure system directive after inactivity), continue with the next pending task.

**Never stall on a TODO continuation when prior approval was given.**

### Approval Recovery After Compaction

When context is compacted (long sessions), approval state may be lost. To recover:

1. Check your todo list — items marked `completed` indicate prior work was approved.
2. Check the last human message — forward intent signals still apply.
3. If both indicate prior approval, **resume work**. Do not restart from discovery.
4. If uncertain, present a one-line summary: "Resuming [task] — prior steps were approved. OK to continue?"

## Agile Delivery

- **Commit small, commit fast.** Each PR is one focused, reviewable change.
- **Blocking work first.** Do prerequisite work before parallel work.
- **One concern per PR.** Do not bundle refactoring with bug fixes or features.

## Human Collaboration Protocol

You are a partner, not an autonomous executor. The human drives decisions.

- **Never auto-advance** past approval gates (at Medium/High risk). Always present results and wait.
- **Never assume approval.** Silence is not consent. Ask explicitly.
- **Never expand scope.** If you discover additional work, report it — don't do it.
- **Present options, not decisions.** When tradeoffs exist, lay them out. Let the human choose.
- **Ask before destructive operations.** See the destructive operations list above. Routine operations within an approved plan do not require confirmation.

### When You Are Stuck

If you have attempted a fix twice without success:

1. Stop making changes.
2. Revert to the last known working state.
3. Present what you tried, what failed, and why.
4. Ask for guidance.

## Resource Efficiency

### Delegation Efficiency

Agent spawns consume requests proportional to their complexity. Direct tool calls within a single turn are free. The goal is maximum ROI: quality × success rate / requests consumed.

**Core principle**: Delegate by default, but delegate *efficiently*. Optimize by reducing redundancy, scope, and round-trips — not by avoiding delegation.

**Efficiency guidelines**:

- Use direct tools (grep, glob, LSP, codesearch, context7) to pin down specifics *after* delegation surfaces the broad picture. Don't re-search what you already delegated.
- When explore/librarian results arrive, extract what you need and cancel the agent. Don't let background agents run indefinitely.
- Prefer 2 targeted agents over 5 broad ones. Scale up to 3-5 only when questions are genuinely independent and each requires multi-step reasoning.
- One follow-up per question maximum. If a delegated search didn't find it, try a different tool or approach — don't retry the same query.

### Delegation Scope & Retry Discipline

Prefer more, smaller delegations over fewer, larger ones — 4 focused tasks of 10 items each beats 2 broad tasks of 20 items. Smaller scopes are cheaper to retry and reduce blast radius of failures.

When a delegated task fails, times out, or produces incomplete results:

- **Why** did it fail? (scope too large, output too long, ambiguous instructions)
- **What** can be reduced? (split into smaller chunks, narrow the scope)
- **Propose** the adjusted approach to the human before retrying.

One retry with the same parameters is acceptable. A second failure requires a different strategy.

## Research Protocol

When performing research: (1) Define specific questions — research is done when answered. (2) Timebox: Quick 3 min, Focused 5 min, Deep 10 min, Max 15 min. (3) Report findings and let the user decide next steps. Never self-authorize additional research rounds.

## Anti-Patterns

Key rules to always keep in mind:

- Never implement before the human approves your plan (at Medium/High risk).
- Never expand scope beyond what was requested.
- Never iterate on a broken fix more than twice without stopping to reassess.
- Never re-ask for confirmation on routine operations that are part of an already-approved plan.
```

---

### Template 2: Tooling Documentation

**Source:** `scripts/bootstrap/templates/docs/tooling.md`
**Destination:** `docs/tooling.md` (monorepo root)

```markdown
# Tooling Packages

Shared configuration packages for the {{SCOPE}} monorepo. Each package lives under `src/tooling/` and is consumed by workspace packages as a dev dependency.

All tooling packages are:

- Private (`"private": true`)
- ESM (`"type": "module"`)
- Configuration-only (no runtime code shipped to users)
- Installed via npm workspaces (symlinked from `node_modules/@{{scope}}/`)

## @{{scope}}/typescript

**Location:** `src/tooling/typescript/`
**Package name:** `@{{scope}}/typescript`

Shared TypeScript compiler configurations. Exports three JSON configs that workspaces extend.

### Exported Configs

#### `base.json`

Foundation config inherited by all others. Sets strict type-checking defaults for cross-platform ESM code.

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "declaration": true,
        "declarationMap": true,
        "resolveJsonModule": true,
        "isolatedModules": true
    }
}
```

#### `build.json`

Extends `base.json`. Used for production builds (`tsc -p tsconfig.build.json`). Adds output directory and excludes test/mock files.

```json
{
    "extends": "./base.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "."
    },
    "exclude": ["node_modules", "dist", "**/__tests__/**", "**/__mocks__/**", "**/__fixtures__/**"]
}
```

#### `test.json`

Extends `base.json`. Used for test compilation. Disables declaration output since test files don't need `.d.ts` files.

```json
{
    "extends": "./base.json",
    "compilerOptions": {
        "declaration": false,
        "declarationMap": false
    }
}
```

### Usage

In a workspace `tsconfig.json`:

```json
{
    "extends": "@{{scope}}/typescript/base.json",
    "compilerOptions": {
        "rootDir": ".",
        "outDir": "dist",
        "baseUrl": ".",
        "paths": {
            "@shared/*": ["./*"]
        }
    },
    "include": ["**/*.ts"],
    "exclude": ["node_modules", "dist", "**/__tests__/**", "**/__mocks__/**", "**/__fixtures__/**"]
}
```

### Package Definition

```json
{
    "name": "@{{scope}}/typescript",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./base.json": "./base.json",
        "./test.json": "./test.json",
        "./build.json": "./build.json"
    }
}
```

## @{{scope}}/eslint

**Location:** `src/tooling/eslint/`
**Package name:** `@{{scope}}/eslint`

Shared ESLint flat config for TypeScript projects. Uses ESLint 9+ flat config format with `typescript-eslint`.

### Configuration Factory

Exports a `createConfig()` function that returns an ESLint flat config array:

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export function createConfig(tsconfigPath = './tsconfig.json', tsconfigRootDir = process.cwd()) {
    return [
        // Ignore patterns
        { ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'] },
        // ESLint recommended
        eslint.configs.recommended,
        // TypeScript ESLint recommended
        ...tseslint.configs.recommended,
        // Custom rules
        {
            languageOptions: {
                parserOptions: {
                    project: tsconfigPath,
                    tsconfigRootDir: tsconfigRootDir,
                },
            },
            rules: {
                /* ... */
            },
        },
        // Test file overrides
        {
            files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
            },
        },
    ];
}
```

### Rules Enforced

| Rule                                | Config                                               | Purpose                                                           |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `@typescript-eslint/no-unused-vars` | `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'` | Catch unused variables, allow `_` prefix                          |
| `curly`                             | `'all'`                                              | Always require braces for control flow                            |
| `padding-line-between-statements`   | Multiple configs                                     | Blank lines after/before blocks, before returns, around functions |

### Test File Relaxations

In `**/__tests__/**/*.ts` and `**/*.test.ts`:

- `@typescript-eslint/no-explicit-any` -- OFF (test mocks often need `any`)
- `@typescript-eslint/no-non-null-assertion` -- OFF (test assertions use `!`)

### Usage

In a workspace `eslint.config.js`:

```javascript
import createConfig from '@{{scope}}/eslint';

export default createConfig('./tsconfig.test.json');
```

### Package Definition

```json
{
    "name": "@{{scope}}/eslint",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": "./index.js"
    },
    "peerDependencies": {
        "@eslint/js": "^9.0.0",
        "eslint": "^9.0.0",
        "typescript-eslint": "^8.0.0"
    }
}
```

## @{{scope}}/prettier

**Location:** `src/tooling/prettier/`
**Package name:** `@{{scope}}/prettier`

Shared Prettier configuration as a JSON file.

### Configuration (`index.json`)

```json
{
    "tabWidth": 4,
    "useTabs": false,
    "semi": true,
    "trailingComma": "all",
    "singleQuote": true,
    "printWidth": 120
}
```

| Option          | Value   | Notes                                      |
| --------------- | ------- | ------------------------------------------ |
| `tabWidth`      | 4       | 4-space indentation                        |
| `useTabs`       | false   | Spaces, not tabs                           |
| `semi`          | true    | Always use semicolons                      |
| `trailingComma` | `"all"` | Trailing commas everywhere (cleaner diffs) |
| `singleQuote`   | true    | Single quotes for strings                  |
| `printWidth`    | 120     | 120 character line width                   |

### Usage

In a workspace `prettier.config.js`:

```javascript
import config from '@{{scope}}/prettier' with { type: 'json' };

export default config;
```

Note: The `with { type: 'json' }` import attribute is required because the config is a `.json` file and the project uses `"type": "module"` (ESM).

### Package Definition

```json
{
    "name": "@{{scope}}/prettier",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": "./index.json"
    },
    "peerDependencies": {
        "prettier": "^3.0.0"
    }
}
```

## @{{scope}}/vitest

**Location:** `src/tooling/vitest/`
**Package name:** `@{{scope}}/vitest`

Shared Vitest configuration for test suites.

### Base Config (`vitest.config.js`)

```javascript
export const baseConfig = {
    test: {
        globals: true,
        include: ['**/__tests__/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
    },
};
```

| Option    | Value                       | Purpose                                              |
| --------- | --------------------------- | ---------------------------------------------------- |
| `globals` | `true`                      | `describe`, `it`, `expect` available without imports |
| `include` | `**/__tests__/**/*.test.ts` | Tests must be in `__tests__/` directories            |
| `exclude` | `node_modules`, `dist`      | Skip build output and dependencies                   |

### Type Definitions (`vitest.config.d.ts`)

```typescript
import type { UserConfig } from 'vitest/config';

export declare const baseConfig: {
    test: UserConfig['test'];
};
export default baseConfig;
```

### Usage

In a workspace `vitest.config.ts`:

```typescript
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@{{scope}}/vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
    baseConfig,
    defineConfig({
        resolve: {
            alias: {
                '@shared': path.resolve(__dirname),
            },
        },
        test: {
            exclude: ['**/__tests__/**/*.integration.test.ts', '**/node_modules/**'],
        },
    }),
);
```

The workspace config:

1. Merges the base config with workspace-specific settings
2. Adds a `@shared` path alias for imports
3. Excludes integration tests from the default test run

### Integration Test Config

Integration tests use a separate config that includes only `*.integration.test.ts` files and sets a longer timeout (60s). These require the `GITHUB_TOKEN` environment variable.

### Package Definition

```json
{
    "name": "@{{scope}}/vitest",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": {
            "types": "./vitest.config.d.ts",
            "default": "./vitest.config.js"
        }
    },
    "peerDependencies": {
        "vitest": "^4.0.0"
    }
}
```

## Monorepo Wiring

### Root `package.json` Workspaces

```json
{
    "workspaces": [
        "src/shared",
        "src/tooling/eslint",
        "src/tooling/prettier",
        "src/tooling/typescript",
        "src/tooling/vitest"
    ]
}
```

### Dependency Graph

```
@{{scope}}/shared (consumer)
  devDependencies:
    @{{scope}}/eslint      -> src/tooling/eslint/
    @{{scope}}/prettier    -> src/tooling/prettier/
    @{{scope}}/typescript  -> src/tooling/typescript/
    @{{scope}}/vitest      -> src/tooling/vitest/

Root (provides peer dependencies)
  devDependencies:
    eslint               (satisfies @{{scope}}/eslint peer dep)
    @eslint/js           (satisfies @{{scope}}/eslint peer dep)
    typescript-eslint    (satisfies @{{scope}}/eslint peer dep)
    prettier             (satisfies @{{scope}}/prettier peer dep)
    vitest               (satisfies @{{scope}}/vitest peer dep)
    typescript           (used by all workspaces)
    turbo                (task runner)
    husky                (git hooks)
    lint-staged          (pre-commit formatting/linting)
    @commitlint/cli      (commit message validation)
    @commitlint/config-conventional
```

### Turbo Tasks (`turbo.json`)

| Task               | Dependencies              | Env Vars       |
| ------------------ | ------------------------- | -------------- |
| `build`            | `^build` (upstream first) | --             |
| `test`             | `^build`                  | --             |
| `test:integration` | `^build`                  | `GITHUB_TOKEN` |
| `lint`             | --                        | --             |
| `typecheck`        | `^build`                  | --             |
| `format`           | --                        | --             |
| `format:check`     | --                        | --             |

### Git Hooks (Husky)

| Hook         | Action                                                     |
| ------------ | ---------------------------------------------------------- |
| `pre-commit` | Runs `lint-staged` (ESLint fix + Prettier on staged files) |
| `commit-msg` | Runs `commitlint` (enforces conventional commits)          |

### Adding a New Workspace

1. Create the package directory (e.g., `src/web/`)
2. Add a `package.json` with `"name": "@{{scope}}/web"` and tooling dev dependencies
3. Add the path to root `package.json` workspaces array
4. Create config files extending the shared configs:
    - `tsconfig.json` extending `@{{scope}}/typescript/base.json`
    - `eslint.config.js` importing from `@{{scope}}/eslint`
    - `prettier.config.js` importing from `@{{scope}}/prettier`
    - `vitest.config.ts` merging with `@{{scope}}/vitest`
5. Run `npm install` to link the new workspace
```

---

### Template 3: Coding Standards

**Source:** `scripts/bootstrap/templates/docs/CODING_STANDARDS.md`
**Destination:** `docs/CODING_STANDARDS.md` (monorepo root)

```markdown
# {{SCOPE}} Style Guide

## Core Rules

### 1. Always Use Braces

Always use braces for control structures, even for single-line statements.

```typescript
// Good
if (condition) {
    doSomething();
}

// Bad
if (condition) doSomething();
if (condition) doSomething();
```

### 2. Prefer Constants and Enums

Use constants and enums instead of hardcoded string or number literals.

```typescript
// Good
import { Platform } from '@{{scope}}/models';
if (adapter.platform === Platform.SQLite) { ... }

// Bad
if (adapter.platform === 'sqlite') { ... }
```

Define enums for finite sets of related values:

```typescript
export enum Platform {
    SQLite = 'sqlite',
    IndexedDB = 'indexeddb',
}
```

### 3. Document Functions

Every function should have a comment explaining what it does.

```typescript
/**
 * Parses a configuration file and extracts validated settings.
 */
export function parseConfig(raw: string): Config {
    // implementation
}
```

For simple, self-explanatory functions, a single-line comment suffices:

```typescript
/** Returns the full name combining first and last name. */
function getFullName(first: string, last: string): string {
    return `${first} ${last}`;
}
```

### 4. Blank Lines After Blocks

Add a blank line after block statements (if/else, for, while, try/catch, switch), function definitions, and before return statements. This improves visual separation of logical sections.

```typescript
// Good
const name = getName();
const age = getAge();

if (age < 18) {
    throw new Error('Too young');
}

const result = process(name, age);

return result;

// Bad - no breathing room
const name = getName();
const age = getAge();
if (age < 18) {
    throw new Error('Too young');
}
const result = process(name, age);
return result;
```

This is enforced by ESLint via `padding-line-between-statements`.

### 5. Pure Functions

Prefer pure functions that avoid side effects.

```typescript
// Good - pure function
function calculateTotal(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad - side effect (mutates external state)
let total = 0;
function addToTotal(item: Item): void {
    total += item.price;
}
```

When side effects are necessary (I/O, database, etc.), isolate them and document clearly.

## File Organization

### Imports

**Prefer aliased imports over relative imports.** This applies to the entire codebase, across all workspaces. Every workspace defines path aliases in its `tsconfig.json` and mirrors them in `vitest.config.ts`. Use the appropriate alias for the workspace you are in.

**Exception**: Relative imports are acceptable in `e2e/`, `__fixtures__/`, and `__testing__/` directories when importing across workspace boundaries where no alias is available.

Available alias conventions (see each workspace's `tsconfig.json` for exact mappings):

| Alias | Purpose | Available In |
|-------|---------|--------------|
| `@/*` | Within-workspace self-reference (`./src/*`) | All workspaces |
| `#/*` | Workspace root | All workspaces |
| `@{{scope}}/<package>` | Cross-workspace barrel import | All workspaces |

Order imports as follows:

1. External packages (node_modules)
2. Aliased internal imports (`@/...`, `#/...`, `@{{scope}}/<package>`, etc.)

```typescript
// Good — aliased imports with .js extension
import { describe, it, expect } from 'vitest';
import type { Item } from '@{{scope}}/models';
import { ItemDataModel } from '@{{scope}}/models';
import type { DatabaseAdapter } from '@{{scope}}/data';
import { makeItem } from '@/e2e/__fixtures__/makeItem.js';

// Bad — relative import
import type { Item } from '../../models/ItemModel.js';
import { ItemDataModel } from './ItemDataModel.js';

// Bad — .ts extension
import type { Item } from '@/models/ItemModel.ts';
```

### File Extensions

**All imports use `.js` (or `.jsx`) extensions.** Do not use `.ts`/`.tsx` extensions in import paths. TypeScript with `NodeNext` module resolution requires output-compatible extensions in import specifiers.

```typescript
// Good
import { Platform } from '@{{scope}}/models';
import type { EntityRank } from '@{{scope}}/data';
import { ItemDataModel } from '@/models/ItemDataModel.js';
import { makeAccount } from '@/utils/makeAccount.js';

// Bad — missing extension
import { makeAccount } from '@/utils/makeAccount';

// Bad — .ts extension
import { makeAccount } from '@/utils/makeAccount.ts';
```

## Naming Conventions

- **Files**: camelCase (`xmlParser.ts`, `dataManager.ts`)
    - **Exception — React components**: PascalCase matching the component name (`Dashboard.tsx`, `ItemCard.tsx`)
    - **Exception — Data models**: PascalCase matching the class name (`ItemDataModel.ts`, `CategoryModel.ts`)
- **Classes**: PascalCase (`GitHubClient`, `DataManager`)
- **Functions**: camelCase (`createAdapter`, `parseXml`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_USER_AGENT`)
- **Enums**: PascalCase for enum, PascalCase for values (`Platform.SQLite`)

### 6. Detailed Comments

Every exported function, class, interface, type, and field must have JSDoc documentation. Comments should explain what the code does, what parameters it accepts, and what it returns.

#### Function Comments

Use `@param` and `@returns` tags for non-trivial functions. Include `@throws` when the function can throw specific error types.

```typescript
// Good - detailed JSDoc with params, returns, and throws
/**
 * Retrieves a single entity by its primary key ID.
 *
 * Queries the specified store table using the Drizzle ORM select builder.
 * Returns the first matching row deserialized to the entity type, or null
 * if no row matches the given ID.
 *
 * @param store - The entity type/store name (e.g., 'item', 'category').
 * @param id - The primary key ID of the entity.
 * @returns The entity if found, or null if not found.
 * @throws DatabaseError if the query fails.
 */
async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
    // implementation
}

// Good - simple function, single-line JSDoc is sufficient
/** Returns the full name combining first and last name. */
function getFullName(first: string, last: string): string {
    return `${first} ${last}`;
}

// Bad - no documentation
async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
    // implementation
}
```

#### Interface and Type Comments

Every interface and its fields should have JSDoc comments explaining their purpose.

```typescript
// Good
/**
 * Configuration for the database adapter.
 */
export interface DatabaseAdapterConfig {
    /** The database cluster endpoint hostname. */
    clusterEndpoint: string;

    /** The AWS region of the database cluster. */
    region: string;
}

// Bad - no field comments
export interface DatabaseAdapterConfig {
    clusterEndpoint: string;
    region: string;
}
```

#### Inline Comments

Use inline comments sparingly for non-obvious logic, complex algorithms, and business rule explanations. Do not comment obvious code.

```typescript
// Good - explains non-obvious constraint
// PostgreSQL does not support serial columns in all configurations, so we use uuid for primary keys
export const items = pgTable('items', {
    id: uuid('id').defaultRandom().primaryKey(),
});

// Bad - states the obvious
// Create a new date
const now = new Date();
```

#### Module-Level File Headers

Each source file should have a top-level JSDoc block summarizing what the module does. This is especially important for files with complex logic or non-obvious purpose.

```typescript
/**
 * PostgreSQL database adapter using Drizzle ORM and pg driver.
 * Connects to the database via IAM auth tokens.
 */
```

### 7. Utility and Helper Functions

Utility and helper functions must live in a `utils/` directory colocated with the source code that uses them. Group related helpers into descriptive files by domain. Do not scatter helpers across handler or route files.

```
src/services/example-service/src/
├── handler.ts
├── router.ts
├── routes/
│   ├── resources.ts
│   └── members.ts
└── utils/
    ├── response.ts       → jsonResponse, errorResponse
    ├── validation.ts     → type guards, request parsers
    └── secrets.ts        → Secrets Manager fetch + caching
```

Guidelines:

- **Deduplicate**: If two or more files share the same helper, extract it to `utils/`. Never duplicate a helper across files.
- **Group by domain**: Put related helpers in one file (e.g., all response builders in `response.ts`, all type guards in `validation.ts`).
- **Single-use helpers**: If a helper is only used by one file and is small (under ~15 lines), keep it in that file. Extract it when it grows or gains a second consumer.
- **Pure functions preferred**: Utility functions should be pure when possible. If a util needs side effects (network calls, file I/O), document it clearly.
- **Export explicitly**: Only export helpers that are used outside the file. Keep internal-only helpers unexported.

```typescript
// Good - deduplicated in utils/response.ts
import { jsonResponse, errorResponse } from '@/utils/response.js';

// Bad - duplicated across route files
function jsonResponse(statusCode: number, payload: unknown): ApiResponse { ... }
// (same function copy-pasted in another file)
```

## Exports

### Named Exports Only

Use named exports for all modules. Do not use default exports unless a framework requires them (Next.js `page.tsx`/`layout.tsx`, Expo app entry).

```typescript
// Good — named export
export function createAdapter(config: AdapterFactoryConfig): Promise<DatabaseAdapter> { ... }
export class GitHubClient { ... }
export const exampleSystem = new ExampleSystem();

// Bad — default export (unless framework-required)
export default function createAdapter() { ... }
```

Framework-required default exports:

```typescript
// OK — Next.js requires default exports for pages and layouts
export default function HomePage() { ... }
export default function RootLayout({ children }: { children: React.ReactNode }) { ... }
```

### Barrel Files (`index.ts`)

Use barrel files at module boundaries to define the public API. Use named re-exports. Separate type-only exports from value exports.

```typescript
// src/shared/data/index.ts
export { createAdapter, type AdapterFactoryConfig } from '@{{scope}}/data';
export { registerHydrator, getHydrator, clearHydrationRegistry } from '@{{scope}}/data';
export type { DatabaseAdapter, EntityType, EntityMap } from '@{{scope}}/data';
```

Use `// === Section Name ===` separators for logical groupings in larger barrel files:

```typescript
// === Core Exports ===

export { createAdapter } from '@{{scope}}/data';
export { Platform } from '@{{scope}}/models';

// === DataContext (v2 DAO-based API) ===

export { DataContext } from '@{{scope}}/data';
export { DataContextBuilder } from '@{{scope}}/data';
```

## Types

### `interface` vs `type`

Use `interface` for data shapes and contracts (objects with known fields). Use `type` for unions, aliases, mapped types, and utility types.

```typescript
// Good — interface for data shapes
export interface Entity {
    id: string;
    name: string;
}

export interface DatabaseAdapter {
    get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null>;
}

// Good — type for unions, aliases, and mapped types
export type Size = 'Small' | 'Medium' | 'Large';
export type EntityType = keyof EntityMap;
export type SortDirection = 'asc' | 'desc';
```

### Type-Only Imports

Use `import type { X }` when importing only types. This enables tree-shaking and makes the import's purpose explicit.

```typescript
// Good — type-only import
import type { Item } from '@{{scope}}/models';
import type { DatabaseAdapter } from '@{{scope}}/data';

// Good — mixed import (values + types)
import { Platform } from '@{{scope}}/models';
import { registerEntityCodec, type EntityCodec } from '@{{scope}}/data';

// Bad — importing types without 'type' keyword
import { Item } from '@{{scope}}/models';
```

### Type Guards

Name type guard functions with an `is` prefix. Return type must use `x is T` predicate syntax.

```typescript
// Good — type guard with is* prefix and predicate return type
export function isSpecialItem(item: Item): item is SpecialItem {
    return item.type === 'special';
}

export function isGitHubApiError(error: unknown): error is GitHubApiError {
    return error instanceof GitHubApiError;
}
```

Provide a type guard for every custom error class and every discriminated union.

### Date Representation

Use ISO 8601 strings (`string` type) for dates in interfaces, not `Date` objects. This ensures serialization compatibility across all platforms and storage backends.

```typescript
// Good — ISO 8601 string
export interface Entity {
    /** When this entity was created. ISO 8601 */
    createdAt: string;
    /** When this entity was last updated. ISO 8601 */
    updatedAt: string;
}

// Bad — Date objects (not serializable)
export interface Entity {
    createdAt: Date;
    updatedAt: Date;
}
```

### Unused Parameters

Prefix unused parameters with `_` to satisfy the linter. Do not delete required parameters to avoid breaking function signatures.

```typescript
// Good — unused parameter prefixed with _
export function registerPluginEntity(kind: string, _metadata: unknown): void {
    pluginEntityRegistry.set(kind, _metadata);
}

// Bad — unnamed parameter or suppressed lint warning
export function registerPluginEntity(kind: string, metadata: unknown): void { ... } // lint error: unused
```

This is enforced by ESLint via `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'`.

## Testing

### Test File Location

- **Unit tests**: `__tests__/` directories colocated with source, named `*.test.ts`
- **Integration tests**: `__integration__/` directories colocated with source, named `*.integration.test.ts`, run with separate vitest config
- **End-to-end tests**: `e2e/` directory at the workspace root, named `*.e2e.test.ts`
- **Mocks**: `__mocks__/` directories colocated with source
- **Fixtures**: `__fixtures__/` directories colocated with tests

### Fixture Factories

Create `make*` functions in `__fixtures__/` that accept `Partial<T>` overrides and return a complete object with sensible defaults. Export them from an `__fixtures__/index.ts` barrel file.

```typescript
// __fixtures__/makeItem.ts
import type { Item } from '@{{scope}}/models';

/** Creates a minimal Item fixture. */
export function makeItem(overrides: Partial<Item> = {}): Item {
    return {
        id: 'item-1',
        ownerId: 'auth0|user-1',
        name: 'Example Item',
        categoryId: 'category-1',
        categoryName: 'Category One',
        // ... all required fields with defaults
        ...overrides,
    };
}
```

### Registry Isolation

When testing code that uses global registries (codec, hydration, schema), call the registry's `clear*` function in `beforeEach` to prevent cross-test pollution.

```typescript
import { clearCodecRegistry } from '@{{scope}}/data';

describe('codec registry', () => {
    beforeEach(() => {
        clearCodecRegistry();
    });

    it('registers a codec for an entity type', () => { ... });
});
```

### Test Structure

- Top-level `describe` for the module or class under test
- Nested `describe` per method or feature
- `it` for individual behaviors — describe what should happen, not how

```typescript
describe('codec registry', () => {
    describe('registerEntityCodec', () => {
        it('registers a codec for an entity type', () => { ... });
        it('overwrites previous codec when same store is registered twice', () => { ... });
    });
});
```

### Test Imports

Always explicitly import test functions from `vitest`, even though globals are enabled. This makes dependencies explicit and aids IDE navigation.

```typescript
// Good — explicit imports
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Avoid — relying on globals
describe('test', () => { ... }); // works but implicit
```

## Environment Variables

Access environment variables using bracket notation, not dot notation. This prevents TypeScript from inferring a narrower type and avoids issues with property access on `process.env`.

```typescript
// Good — bracket notation
const token = process.env['GITHUB_TOKEN'];
const dsn = process.env['SENTRY_DSN'];

// Bad — dot notation
const token = process.env.GITHUB_TOKEN;
```

## Error Handling

Use typed error classes from `@{{scope}}/models`:

```typescript
import { GitHubApiError, isGitHubApiError } from '@{{scope}}/models';

try {
    await client.downloadFile(path);
} catch (error) {
    if (isGitHubApiError(error)) {
        console.error(`GitHub API error: ${error.status}`);
    }

    throw error;
}
```

### Custom Error Classes

When creating custom error classes that extend `Error` (or another custom error), always call `Object.setPrototypeOf` in the constructor. This ensures `instanceof` checks work correctly when targeting ES5 or when errors cross module boundaries.

```typescript
export class DatabaseError extends DataLayerError {
    readonly operation: string;

    constructor(message: string, operation: string) {
        super(message, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
        this.operation = operation;
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}
```

Provide a corresponding `is*` type guard for every custom error class:

```typescript
export function isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
}
```

## Database Schema

### Auto-Generated IDs

Every SQL table must have an auto-generated primary key ID. Tables must not rely on application code to generate IDs — the database itself must handle ID generation.

For PostgreSQL-compatible backends, use `uuid` with `defaultRandom()`:

```typescript
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

// Good — auto-generated UUID primary key
export const items = pgTable('items', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
});

// Bad — no default, requires application to generate ID
export const items = pgTable('items', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
});
```

For SQLite backends, use `text` with a UUID default or `integer` with autoincrement as appropriate for the use case:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Good — auto-generated text UUID (requires SQLite UUID extension or application trigger)
export const items = sqliteTable('items', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
});

// Good — auto-increment integer primary key
export const syncStatus = sqliteTable('sync_status', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fileKey: text('file_key').notNull(),
});
```
```

---

### Template 4: Contributing Guide

**Source:** `scripts/bootstrap/templates/CONTRIBUTING.md`
**Destination:** `CONTRIBUTING.md` (monorepo root)

```markdown
# Contributing to {{SCOPE}}

## Getting Started

1. Clone the repository
2. Run `npm install` to install all dependencies
3. Run `npm run build` to build all packages

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Run type checking: `npm run typecheck`
6. Commit your changes (see commit message format below)
7. Open a pull request

## Code Style

Please follow the coding standards in [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md).

Key points:

- Always use braces for control structures
- Use enums and constants instead of hardcoded values
- Document all functions with comments
- Write pure functions when possible

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages will be validated by commitlint.

Format: `<type>(<scope>): <description>`

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change without feature/fix
- `test`: Adding tests
- `chore`: Maintenance tasks
- `build`: Build system changes

Examples:

```
feat(shared): add adapter factory
fix(shared): handle null response from GitHub API
docs: update README with setup instructions
```

## Testing

- Unit tests go in `__tests__/` folders next to the source files
- Mock data goes in `__mocks__/` folders
- Test fixtures go in `__fixtures__/` folders

Run tests:

```bash
npm run test           # Run all tests
npm run test -- --watch  # Watch mode
```

## Pull Request Process

1. Ensure all tests pass
2. Ensure linting passes
3. Update documentation if needed
4. Request review from maintainers
```

---

## Part 2: Agent Regeneration Algorithm

This algorithm lets an agent reproduce the complete bootstrap output from this document alone, with no access to the original scripts. Each step references the section in this document that contains the content to write.

The algorithm assumes no existing state beyond a Node.js installation and a designated empty target directory. All file content is in sections 3, 3a, 4, and this section (5).

---

### Prerequisites

1. **Node.js** `>=24.0.0` must be installed. Verify with `node --version`. The scripts use only built-in Node.js modules (`fs`, `path`, `child_process`, `url`), so no npm install is needed to run them.
2. **Empty target directory** for the monorepo. The directory must either not exist yet or be completely empty. The bootstrap script does not overwrite existing files.
3. **Scope name** decided in advance. This becomes the `@scope` prefix on every generated package. It must be a valid npm package name fragment (lowercase, no spaces). Examples: `myapp`, `acme`, `widgets`.
4. All parameterization rules from **Section 2** apply. Every `{{SCOPE}}` in template content is replaced with the uppercase scope name. Every `{{scope}}` and `@{{scope}}` is replaced with the lowercase scope name.

---

### Step-by-Step: Recreate Monorepo (`create-monorepo.js` order of operations)

The monorepo bootstrap writes files in a fixed sequence. Reproduce that sequence exactly to match the expected output.

**Step 1 — Parse arguments**

Collect `--name <scope>` (required), `--dir <output-dir>` (required), and `--node <version>` (optional, default `24`). If either required flag is missing, abort with a usage message. See **Section 2** for the full CLI reference.

**Step 2 — Create the output directory**

Create `<output-dir>` if it does not exist. All subsequent paths are relative to this directory.

**Step 3 — Write root configuration files**

Write each file listed in **Section 3.1** in this order:

1. `package.json` — root manifest with workspaces array, Turborepo scripts, engines, and all dev dependencies listed in Section 3.1
2. `turbo.json` — Turborepo pipeline with the seven tasks (`build`, `test`, `test:integration`, `lint`, `typecheck`, `format`, `format:check`) and their dependency and env-var declarations (see the Turbo Tasks table in Template 2 above, and full content in Section 3.1)
3. `tsconfig.json` — root TypeScript config (content in Section 3.1)
4. `.nvmrc` — single line containing the Node.js version from `--node` flag
5. `.gitignore` — standard Node/TypeScript ignores (content in Section 3.1)
6. `.prettierignore` — directories to skip during formatting (content in Section 3.1)
7. `.commitlintrc.json` — extends `@commitlint/config-conventional` (content in Section 3.1)
8. `.lintstagedrc.json` — pre-commit lint and format rules (content in Section 3.1)

**Step 4 — Write the five tooling workspaces**

For each tooling package, create its directory and write the files listed in **Section 3.2**. The order within each package matches the section. Write them in this package order:

1. `src/tooling/typescript/` — `package.json`, `base.json`, `build.json`, `test.json`
2. `src/tooling/eslint/` — `package.json`, `index.js`
3. `src/tooling/prettier/` — `package.json`, `index.json`
4. `src/tooling/vitest/` — `package.json`, `vitest.config.js`, `vitest.config.d.ts`
5. `src/tooling/esbuild/` — `package.json`, `esbuild.config.js` (content in Section 3.2)

The full `package.json` contents for each tooling workspace are in the Template 2 "Package Definition" subsections above. The `index.js` / config file contents are in Section 3.2.

**Step 5 — Write the GitHub Actions CI workflow**

Create `.github/workflows/ci.yml` using the full content from **Section 3a.1**. The workflow has 8 jobs: `install`, `test`, `test-integration`, `lint`, `typecheck`, `build`, `test-e2e`, and reads the Node version from `.nvmrc`.

**Step 6 — Write Husky git hooks**

1. Create `.husky/pre-commit` (content in **Section 3a.2**) — runs `lint-staged`
2. Create `.husky/commit-msg` (content in **Section 3a.2**) — runs `commitlint`
3. Make both files executable (`chmod +x`)

**Step 7 — Write documentation templates**

Apply placeholder substitution (see Section 2 parameterization rules) and write:

1. `docs/CODING_STANDARDS.md` — full content from **Template 3** above (Part 1, Section 5)
2. `docs/tooling.md` — full content from **Template 2** above (Part 1, Section 5)
3. `CONTRIBUTING.md` — full content from **Template 4** above (Part 1, Section 5)
4. `README.md` — generated stub (content in **Section 3a.3**)

**Step 8 — Write OpenCode agent config**

Apply placeholder substitution and write:

1. `.opencode/AGENTS.md` — full content from **Template 1** above (Part 1, Section 5)

**Step 9 — Copy skills**

Copy the entire `scripts/bootstrap/skills/` directory to `.opencode/skills/`. This is a recursive directory copy with no content transformation.

**Step 10 — Create placeholder directories**

Create empty placeholder directories with `.gitkeep` files (content in **Section 3a.4**):

- `src/shared/` (placeholder until first workspace is added)

**Step 11 — Initialize git**

Run `git init` in the output directory. Then run `npm install` to install all dev dependencies and link the workspace symlinks. Then run `npx husky install` (or the equivalent Husky v9 init command) to activate the git hooks.

---

### Step-by-Step: Recreate Workspace (`create-workspace.js` order of operations)

This script runs inside an already-bootstrapped monorepo. The monorepo must exist and `npm install` must have already been run (so tooling packages are linked).

**Step 1 — Parse arguments**

Collect `--name <pkg-name>` (required), `--location <path>` (required), `--type <type>` (required), and `--scope <scope>` (optional). If `--scope` is omitted, auto-detect it by reading the root `package.json` `name` field. See **Section 2** for the full flag table and valid `--type` values.

**Step 2 — Resolve the full package name**

Combine scope and name: `@<scope>/<name>`. This becomes the `name` field in the workspace's `package.json`.

**Step 3 — Create the workspace directory**

Create `<repo-root>/<location>/` if it does not exist.

**Step 4 — Write the workspace `package.json`**

Write `<location>/package.json` using the template for the given `--type`. All five type variants are in **Section 4.2**. Apply scope and name substitution.

**Step 5 — Write TypeScript configs**

Write two files using the content from **Section 4.3**:

1. `<location>/tsconfig.json` — extends `@<scope>/typescript/base.json`
2. `<location>/tsconfig.build.json` — extends `@<scope>/typescript/build.json`

**Step 6 — Write ESLint and Prettier configs**

1. `<location>/eslint.config.js` — imports from `@<scope>/eslint` (Section 4.4)
2. `<location>/prettier.config.js` — imports from `@<scope>/prettier` (Section 4.4)

**Step 7 — Write Vitest config**

Write `<location>/vitest.config.ts` using the content from **Section 4.5**. The workspace merges the base config and adds a `@shared` path alias.

**Step 8 — Write type-specific boilerplate**

Based on `--type`, write the additional files listed in **Section 4.6**:

- `library` — `src/index.ts` stub
- `serverless` — `src/handler.ts`, `src/index.ts`, optional `Dockerfile` content
- `nextjs` — `src/app/page.tsx`, `src/app/layout.tsx`, `next.config.ts`, `public/` placeholder
- `react-native` — `app/_layout.tsx`, `app/index.tsx`, `app.json`
- `nestjs` — `src/main.ts`, `src/app.module.ts`, `Dockerfile`, `docker-compose.yml` (`nestjs-docker` accepted as alias)

**Step 9 — Register in root workspaces**

Open `<repo-root>/package.json` and add `"<location>"` to the `workspaces` array if it is not already present.

**Step 10 — Install dependencies**

Run `npm install` from the repo root to link the new workspace and resolve its dependencies.

---

### Verification Checklist

After running both scripts (monorepo then one workspace), confirm the following. A passing check means the regeneration matched the expected output.

**File existence checks**

- [ ] `package.json` exists at repo root and contains `"type": "module"`
- [ ] `turbo.json` exists at repo root and contains a `"pipeline"` (or `"tasks"`) key
- [ ] `.nvmrc` exists and contains exactly the Node.js version number (e.g., `24`)
- [ ] `.github/workflows/ci.yml` exists and references 8 jobs
- [ ] `.husky/pre-commit` and `.husky/commit-msg` both exist and are executable
- [ ] `docs/CODING_STANDARDS.md` and `docs/tooling.md` both exist
- [ ] `CONTRIBUTING.md` exists at repo root
- [ ] `.opencode/AGENTS.md` exists
- [ ] `src/tooling/typescript/`, `src/tooling/eslint/`, `src/tooling/prettier/`, `src/tooling/vitest/`, `src/tooling/esbuild/` all exist with a `package.json` inside each

**Parameterization checks**

- [ ] No file contains the literal string `{{SCOPE}}`, `{{scope}}`, or `@{{scope}}` after generation
- [ ] `package.json` at repo root has `"name": "<your-scope>"` (the bare scope, not `@scope/scope`)
- [ ] Every tooling `package.json` has a `"name"` starting with `@<scope>/`
- [ ] `docs/CODING_STANDARDS.md` heading reads `# <SCOPE> Style Guide` (uppercased scope)
- [ ] `CONTRIBUTING.md` heading reads `# Contributing to <SCOPE>` (uppercased scope)
- [ ] `.opencode/AGENTS.md` heading reads `# <SCOPE> - Agent Instructions` (uppercased scope)

**Content integrity checks**

- [ ] `src/tooling/typescript/base.json` contains `"strict": true` and `"moduleResolution": "Bundler"`
- [ ] `src/tooling/prettier/index.json` contains `"tabWidth": 4` and `"printWidth": 120`
- [ ] `src/tooling/vitest/vitest.config.js` exports `baseConfig` with `globals: true`
- [ ] `.husky/pre-commit` calls `lint-staged`
- [ ] `.husky/commit-msg` calls `commitlint`
- [ ] `turbo.json` includes a `test:integration` task with `GITHUB_TOKEN` in its env vars

**Workspace checks (after `create-workspace.js`)**

- [ ] `<location>/package.json` exists with the correct scoped package name
- [ ] `<location>/tsconfig.json` has an `extends` field pointing to `@<scope>/typescript/base.json`
- [ ] `<location>/eslint.config.js` imports from `@<scope>/eslint`
- [ ] `<location>/vitest.config.ts` imports `baseConfig` from `@<scope>/vitest`
- [ ] `<location>` appears in the root `package.json` workspaces array
- [ ] `npm install` completes without errors after workspace registration
