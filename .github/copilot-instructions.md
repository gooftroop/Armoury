<!-- GitHub Copilot Instructions for the Armoury monorepo -->

# Armoury — Copilot Instructions

TypeScript monorepo for managing tabletop game army data using community data files. Cross-platform (web, mobile, server) with adapters for different storage backends and a plugin architecture for game system support.

## Tech Stack

- **Node** `>=24.0.0`, **npm workspaces**, **ESM only**
- **TypeScript**: strict mode, `ES2022` target, `NodeNext` module resolution (`Bundler` for web/mobile)
- **Build**: Turborepo + esbuild (JS) + `tsc --emitDeclarationOnly` (types)
- **Test**: Vitest
- **Web**: Next.js 15, Tailwind v4, Radix UI
- **Mobile**: Expo 53, React Native, Tamagui

## Monorepo Structure

| Path | Package | Description |
|------|---------|-------------|
| `src/shared` | `@armoury/shared` | Core business logic, data layer, types, validation |
| `src/systems` | `@armoury/systems` | Game system plugins (wh40k10e) |
| `src/web` | `@armoury/web` | Next.js SSR web app |
| `src/mobile` | `@armoury/mobile` | Expo/React Native mobile app |
| `src/services/authorizer` | `@armoury/authorizer` | Lambda authorizer |
| `src/services/campaigns` | `@armoury/campaigns` | Lambda campaigns service |
| `src/tooling/*` | `@armoury/eslint`, `typescript`, `vitest`, `prettier`, `esbuild` | Shared tooling configs |

## Path Aliases

| Alias | Resolves To | Available In |
|-------|-------------|--------------|
| `@shared/*` | `src/shared/*` | All workspaces |
| `@streams/*` | `src/shared/streams/*` | `@armoury/streams` only |
| `@wh40k10e/*` | `src/systems/src/wh40k10e/*` | `@armoury/systems`, `@armoury/shared` (tests only) |
| `@web/*` | `src/web/*` | `@armoury/web` only |
| `@mobile/*` | `src/mobile/*` | `@armoury/mobile` only |
| `@campaigns/*` | `src/services/campaigns/*` | `@armoury/campaigns` only |

## Import Rules

- Prefer aliased imports over relative imports everywhere.
- **Relative imports use `.ts` extension** (TypeScript rewrites these automatically).
- **Aliased imports use `.js` extension** (TypeScript cannot rewrite non-relative paths in `.d.ts` output — TS2877).
- Import order: external packages, aliased internal, relative.

```typescript
// Good
import { describe, it, expect } from 'vitest';
import type { Unit } from '@wh40k10e/models/UnitModel.js';
import { Platform } from '@shared/types/enums.js';
import { makeArmy } from '../__fixtures__/makeArmy.ts';

// Bad — wrong extension on aliased import
import { Platform } from '@shared/types/enums.ts';

// Bad — relative when alias is available
import type { Unit } from '../../models/UnitModel.ts';
```

## Naming Conventions

- **Files**: camelCase (`xmlParser.ts`, `dataManager.ts`)
  - Exception: React components use PascalCase (`ArmyBuilder.tsx`)
  - Exception: Data models use PascalCase matching the class (`FactionDataModel.ts`)
- **Classes**: PascalCase (`GitHubClient`, `DataManager`)
- **Functions**: camelCase (`createAdapter`, `parseXml`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_RETRIES`, `DEFAULT_USER_AGENT`)
- **Enums**: PascalCase for enum and values (`Platform.SQLite`)

## Export Rules

Named exports only. No default exports unless a framework requires it.

```typescript
// Good
export function createAdapter(config: AdapterFactoryConfig): Promise<DatabaseAdapter> { ... }
export class GitHubClient { ... }

// Bad
export default function createAdapter() { ... }

// OK — Next.js requires default exports for pages/layouts
export default function HomePage() { ... }
```

Use barrel `index.ts` files at module boundaries. Separate type re-exports from value re-exports.

```typescript
// src/shared/data/index.ts
export { createAdapter, type AdapterFactoryConfig } from '@shared/data/factory.ts';
export type { DatabaseAdapter } from '@shared/data/adapter.ts';
```

## Type Rules

- `interface` for data shapes and contracts (objects with known fields).
- `type` for unions, aliases, mapped types, and utility types.
- `import type { X }` for type-only imports.
- Type guards use `is` prefix and `x is T` predicate syntax.
- Dates are ISO 8601 strings (`string`), not `Date` objects.
- Prefix unused parameters with `_`.

```typescript
export interface Army {
    id: string;
    /** When this army was created. ISO 8601 */
    createdAt: string;
}

export type BattleSize = 'Incursion' | 'StrikeForce' | 'Onslaught';

export function isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
}
```

## Testing

- Unit tests: `__tests__/*.test.ts` colocated with source.
- Integration tests: `__integration__/*.integration.test.ts`, separate vitest config.
- End-to-end tests: `e2e/*.e2e.test.ts` at workspace root.
- Mocks: `__mocks__/` colocated with source.
- Fixtures: `__fixtures__/` colocated with tests, using `make*` factory functions.

Always import test functions explicitly from `vitest`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

Fixture factories accept `Partial<T>` overrides:

```typescript
export function makeArmy(overrides: Partial<Army> = {}): Army {
    return { id: 'army-1', name: 'Test Force', ...overrides };
}
```

## Error Handling

Use typed error classes from `@armoury/shared/types/errors`. Always call `Object.setPrototypeOf` in custom error constructors. Provide an `is*` type guard for every custom error.

```typescript
export class DatabaseError extends DataLayerError {
    constructor(message: string, readonly operation: string) {
        super(message, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
}
```

## Code Style

- Always use braces for control structures.
- Prefer constants and enums over hardcoded string/number literals.
- Prefer pure functions. Isolate and document side effects.
- Add a blank line after block statements, function definitions, and before `return`.
- JSDoc on every exported function, class, interface, type, and field.
- Access environment variables via bracket notation: `process.env['KEY']`.
- Every source file must have a module-level JSDoc block and a `@requirements` comment block after imports.

## Database Schema

- Every table needs an auto-generated primary key. Don't rely on application code for ID generation.
- PostgreSQL (Aurora DSQL, PGlite): `uuid('id').defaultRandom().primaryKey()`
- SQLite: `text('id').primaryKey().$defaultFn(() => crypto.randomUUID())`

```typescript
// Postgres
export const units = pgTable('units', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
});

// SQLite
export const units = sqliteTable('units', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
});
```
