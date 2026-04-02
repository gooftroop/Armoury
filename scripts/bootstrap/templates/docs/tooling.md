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
