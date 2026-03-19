# Armoury Style Guide

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
import { Platform } from '@armoury/models';
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
 * Parses a game data catalogue XML file and extracts unit data.
 */
export function parseCatalogue(xml: string): Catalogue {
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
| `@armoury/<package>` | Cross-workspace barrel import | All workspaces |

Order imports as follows:

1. External packages (node_modules)
2. Aliased internal imports (`@/...`, `#/...`, `@armoury/<package>`, etc.)

```typescript
// Good — aliased imports with .js extension
import { describe, it, expect } from 'vitest';
import type { Unit } from '@armoury/systems';
import { FactionDataModel } from '@armoury/systems';
import type { DatabaseAdapter } from '@armoury/data-context';
import { makeArmy } from '@/e2e/__fixtures__/makeArmy.js';

// Bad — relative import
import type { Unit } from '../../models/UnitModel.js';
import { FactionDataModel } from './FactionDataModel.js';

// Bad — .ts extension
import type { Unit } from '@/models/UnitModel.ts';
```

### File Extensions

**All imports use `.js` (or `.jsx`) extensions.** Do not use `.ts`/`.tsx` extensions in import paths. TypeScript with `NodeNext` module resolution requires output-compatible extensions in import specifiers.

```typescript
// Good
import { Platform } from '@armoury/models';
import type { CrusadeUnitRank } from '@armoury/data-dao';
import { FactionDataModel } from '@/models/FactionDataModel.js';
import { makeAccount } from '@/utils/makeAccount.js';

// Bad — missing extension
import { makeAccount } from '@/utils/makeAccount';

// Bad — .ts extension
import { makeAccount } from '@/utils/makeAccount.ts';
```

## Naming Conventions

- **Files**: camelCase (`xmlParser.ts`, `dataManager.ts`)
    - **Exception — React components**: PascalCase matching the component name (`ArmyBuilder.tsx`, `UnitCard.tsx`)
    - **Exception — Data models**: PascalCase matching the class name (`FactionDataModel.ts`, `UnitModel.ts`)
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
 * @param store - The entity type/store name (e.g., 'unit', 'faction').
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
 * Configuration for the Aurora DSQL adapter.
 */
export interface DSQLAdapterConfig {
    /** The Aurora DSQL cluster endpoint hostname. */
    clusterEndpoint: string;

    /** The AWS region of the DSQL cluster. */
    region: string;
}

// Bad - no field comments
export interface DSQLAdapterConfig {
    clusterEndpoint: string;
    region: string;
}
```

#### Inline Comments

Use inline comments sparingly for non-obvious logic, complex algorithms, and business rule explanations. Do not comment obvious code.

```typescript
// Good - explains non-obvious business rule
// Aurora DSQL does not support serial columns, so we use text() for all primary keys
export const units = pgTable('units', {
    id: text('id').primaryKey(),
});

// Bad - states the obvious
// Create a new date
const now = new Date();
```

#### Module-Level File Headers

Each source file should have a top-level JSDoc block summarizing what the module does. This is especially important for files with complex logic or non-obvious purpose.

```typescript
/**
 * Aurora DSQL database adapter using Drizzle ORM and pg driver.
 * Connects to Aurora DSQL via IAM auth tokens from @aws-sdk/dsql-signer.
 */
```

### 7. Utility and Helper Functions

Utility and helper functions must live in a `utils/` directory colocated with the source code that uses them. Group related helpers into descriptive files by domain. Do not scatter helpers across handler or route files.

```
src/services/campaigns/src/
├── handler.ts
├── router.ts
├── routes/
│   ├── campaigns.ts
│   └── participants.ts
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
export const wh40k10eSystem = new Wh40k10eSystem();

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
export { createAdapter, type AdapterFactoryConfig } from '@armoury/data-dao';
export { registerHydrator, getHydrator, clearHydrationRegistry } from '@armoury/data-dao';
export type { DatabaseAdapter, EntityType, EntityMap } from '@armoury/data-context';
```

Use `// === Section Name ===` separators for logical groupings in larger barrel files:

```typescript
// === Core Exports (game-system-agnostic) ===

export { createAdapter } from '@armoury/data-dao';
export { Platform } from '@armoury/models';

// === DataContext (v2 DAO-based API) ===

export { DataContext } from '@armoury/data-context';
export { DataContextBuilder } from '@armoury/data-context';
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
export type BattleSize = 'Incursion' | 'StrikeForce' | 'Onslaught';
export type EntityType = keyof EntityMap;
export type SortDirection = 'asc' | 'desc';
```

### Type-Only Imports

Use `import type { X }` when importing only types. This enables tree-shaking and makes the import's purpose explicit.

```typescript
// Good — type-only import
import type { Unit } from '@armoury/models';
import type { DatabaseAdapter } from '@armoury/data-context';

// Good — mixed import (values + types)
import { Platform } from '@armoury/models';
import { registerEntityCodec, type EntityCodec } from '@armoury/data-dao';

// Bad — importing types without 'type' keyword
import { Unit } from '@armoury/models';
```

### Type Guards

Name type guard functions with an `is` prefix. Return type must use `x is T` predicate syntax.

```typescript
// Good — type guard with is* prefix and predicate return type
export function isRangedWeapon(weapon: Weapon): weapon is RangedWeapon {
    return weapon.type === 'ranged';
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
export interface Army {
    /** When this army was created. ISO 8601 */
    createdAt: string;
    /** When this army was last updated. ISO 8601 */
    updatedAt: string;
}

// Bad — Date objects (not serializable)
export interface Army {
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

### No `data-testid` Attributes

**Never** use `data-testid` attributes in source code or test selectors. They couple tests to implementation details, bypass the accessibility layer, and provide no value to end users.

Instead, use **accessible selectors** that reflect how real users and assistive technologies interact with the UI:

| Approach | Selector | When to Use |
|---|---|---|
| Role + name | `getByRole('button', { name: /submit/i })` | Interactive elements (buttons, links, inputs) |
| Label | `getByLabelText('Email address')` | Form controls with visible labels |
| Text | `getByText('Sign In')` | Static text content |
| Semantic structure | `page.locator('nav').getByRole('link')` | Structural queries (e.g. links inside a nav) |

```typescript
// Good — accessible selectors
const submitButton = page.getByRole('button', { name: /submit/i });
const emailInput = page.getByLabel('Email');
const userTile = page.getByRole('status', { name: /welcome/i });

// Bad — data-testid (FORBIDDEN)
const submitButton = page.locator('[data-testid="submit-button"]');
```

This rule applies to **all** testing layers: unit tests (Testing Library), E2E tests (Playwright), and component tests.
### Fixture Factories

Create `make*` functions in `__fixtures__/` that accept `Partial<T>` overrides and return a complete object with sensible defaults. Export them from an `__fixtures__/index.ts` barrel file.

```typescript
// __fixtures__/makeArmy.ts
import type { Army } from '@armoury/models';

/** Creates a minimal Army fixture. */
export function makeArmy(overrides: Partial<Army> = {}): Army {
    return {
        id: 'army-1',
        ownerId: 'auth0|user-1',
        name: 'Ultramarines Strike Force',
        factionId: 'space-marines',
        factionName: 'Space Marines',
        // ... all required fields with defaults
        ...overrides,
    };
}
```

### Registry Isolation

When testing code that uses global registries (codec, hydration, schema), call the registry's `clear*` function in `beforeEach` to prevent cross-test pollution.

```typescript
import { clearCodecRegistry } from '@armoury/data-dao';

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
const publicDsn = process.env['EXPO_PUBLIC_SENTRY_DSN'];

// Bad — dot notation
const token = process.env.GITHUB_TOKEN;
```

## Error Handling

Use typed error classes from `@armoury/models`:

```typescript
import { GitHubApiError, isGitHubApiError } from '@armoury/models';

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

For PostgreSQL-compatible backends (Aurora DSQL, PGlite), use `uuid` with `defaultRandom()`:

```typescript
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';

// Good — auto-generated UUID primary key
export const units = pgTable('units', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
});

// Bad — no default, requires application to generate ID
export const units = pgTable('units', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
});
```

For SQLite backends, use `text` with a UUID default or `integer` with autoincrement as appropriate for the use case:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Good — auto-generated text UUID (requires SQLite UUID extension or application trigger)
export const units = sqliteTable('units', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
});

// Good — auto-increment integer primary key
export const syncStatus = sqliteTable('sync_status', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fileKey: text('file_key').notNull(),
});
```
