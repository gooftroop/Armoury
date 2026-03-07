# Backend Best Practices

**Purpose:** Consolidate all backend coding patterns, conventions, and anti-patterns for the Armoury data layer, services, and shared infrastructure.

**Scope:** `@armoury/shared` (data layer, plugins, validation, clients), `@armoury/authorizer`, `@armoury/campaigns`, and any future backend services.

**Related Documents:**
- `AGENTS.md` (agent behavioral instructions)
- `docs/shared/REQUIREMENTS.md` (data architecture requirements)
- `docs/CODING_STANDARDS.md` (general coding standards)

---

## Table of Contents

1. [General Coding Standards](#1-general-coding-standards)
2. [Adapter Factory Pattern](#2-adapter-factory-pattern)
3. [DataContext Builder Pattern](#3-datacontext-builder-pattern)
4. [Plugin Architecture](#4-plugin-architecture)
5. [Schema Extension System](#5-schema-extension-system)
6. [DAO Patterns](#6-dao-patterns)
7. [Entity Codec & Hydration](#7-entity-codec--hydration)
8. [Data Sync Pipeline](#8-data-sync-pipeline)
9. [Validation Engine](#9-validation-engine)
10. [Error Handling](#10-error-handling)
11. [Lambda Services](#11-lambda-services)
12. [Security](#12-security)
13. [Performance](#13-performance)
14. [Anti-Patterns](#14-anti-patterns)

---

## 1. General Coding Standards

These apply to all backend code. See `docs/CODING_STANDARDS.md` for the full guide.

### Braces and Formatting

Always use braces for control structures, even for single-line statements.

```typescript
// Good
if (condition) {
    doSomething();
}

// Bad
if (condition) doSomething();
```

Add a blank line after block statements and before return statements.

### Constants and Enums

Use constants and enums instead of hardcoded string or number literals.

```typescript
// Good
import { Platform } from '@shared/types/enums.js';
if (adapter.platform === Platform.SQLite) { ... }

// Bad
if (adapter.platform === 'sqlite') { ... }
```

### Documentation

Every exported function, class, interface, type, and field must have JSDoc documentation. Use `@param`, `@returns`, and `@throws` tags for non-trivial functions.

```typescript
/**
 * Retrieves a single entity by its primary key ID.
 *
 * @param store - The entity type/store name (e.g., 'unit', 'faction').
 * @param id - The primary key ID of the entity.
 * @returns The entity if found, or null if not found.
 * @throws DatabaseError if the query fails.
 */
async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
    // implementation
}
```

### Imports

Always use aliased imports — never relative imports. Order: external packages first, then aliased internal imports.

```typescript
// Good
import { describe, it, expect } from 'vitest';
import type { Unit } from '@shared/types/entities.js';

// Bad — relative imports
import type { Unit } from '../../types/entities';
```

Always use `.js` extensions in aliased imports.

### Pure Functions

Prefer pure functions that avoid side effects. When side effects are necessary (I/O, database), isolate them and document clearly.

### Utilities

Utility and helper functions must live in a `utils/` directory co-located with the source code that uses them. Group related helpers into descriptive files by domain. Never duplicate a helper across files.

---

## 2. Adapter Factory Pattern

Use `createAdapter()` to create database adapters. The factory handles full initialization including database connections.

```typescript
import { createAdapter } from '@armoury/shared';
const adapter = await createAdapter({ platform: Platform.IndexedDB });
```

**Rules:**
- Always use the `Platform` enum — never raw strings
- The factory auto-detects platform when none specified (IndexedDB if `window.indexedDB` exists; SQLite otherwise)
- DSQL requires explicit cluster endpoint and region configuration — factory fails fast if missing
- DSQL adapter is dynamically imported to avoid bundling server dependencies in client builds
- The factory calls `adapter.initialize()` before returning — callers receive a ready-to-use adapter

---

## 3. DataContext Builder Pattern

`DataContext` is the single entry point for all data access. Construct via the builder pattern — never instantiate directly.

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';
import type { Wh40kGameData } from '@shared/systems/wh40k10e/dao/Wh40kGameData.js';

const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// App-level DAOs
const account = await dc.accounts.get('user-1');
const friends = await dc.social.listByStatus('accepted');

// Game-specific DAOs
await dc.armies.save(myArmy);

// Game data (async getters, auto-synced from BSData)
const coreRules = await dc.game.coreRules;
const spaceMarines = await dc.game.spaceMarines;

await dc.close();
```

**Rules:**
- `.system()` is required — builder rejects `.build()` without it
- Either `.platform()` or `.adapter()` must be provided
- Builder calls `gameSystem.register()` before adapter initialization
- Builder calls `gameSystem.createGameContext()` to wire plugin DAOs
- Builder executes the game context's `sync()` function if provided
- Always call `dc.close()` when done to release connections

---

## 4. Plugin Architecture

Game-specific code lives under `src/shared/systems/<game-system>/`. Plugins implement the `GameSystem` interface.

### Adding a New Game System Plugin

1. Create plugin directory at `src/shared/systems/<id>/`
2. Implement `GameSystem` interface with identity, data source config, entity kinds, validation rules, hydrators, and schema extensions
3. Define an `EntityKind` enum mapping game-specific entity kinds to adapter store names
4. Augment `PluginEntityMap` in `@shared/data/adapter.js` for type-safe entity access
5. Register entity codecs via `registerEntityCodec()`
6. Register plugin entities via `registerPluginEntity()`
7. Implement `getSchemaExtension()` returning SQLite/IndexedDB/DSQL table definitions
8. Call `registerSchemaExtension()` during plugin registration
9. Export a singleton plugin instance and the `EntityKind` enum

### Registration Rules

- `register()` must register entity kinds, hydrators, codecs, and schemas in global registries
- Registration must be idempotent — multiple calls must not corrupt state
- Plugin code must never modify core code — only extend via registries
- Adapters use the codec registry for serialization — no game-specific imports in adapter code

---

## 5. Schema Extension System

Database schemas are composable — core schema + plugin-provided extensions merged at runtime.

```typescript
import { registerSchemaExtension, getMergedSQLiteSchema } from '@armoury/shared';

// Plugins register their table definitions at initialization
registerSchemaExtension({
    sqlite: { createTablesSQL: '...', storeToTable: {...}, tableColumns: {...} },
    indexedDB: { stores: {...}, storeToTable: {...} },
    dsql: { tables: {...}, storeToTable: {...} },
});

// Adapters call merge functions during initialize()
const schema = getMergedSQLiteSchema();
```

**Rules:**
- Core schema auto-registers at module load time — no explicit consumer action needed
- Plugins should provide definitions for all three platforms for full cross-platform coverage
- SQLite extensions must include column name sets for SQL injection prevention in `ORDER BY`
- Schema registry supports `clearSchemaExtensions()` for test isolation

---

## 6. DAO Patterns

### BaseDAO

`BaseDAO<T>` provides standard CRUD operations (get, list, save, saveMany, delete, deleteAll, count). Concrete DAOs extend it and add domain-specific query methods.

```typescript
class FriendDAO extends BaseDAO<Friend> {
    constructor(adapter: DatabaseAdapter) {
        super(adapter, 'friend');
    }

    /** Lists friends filtered by relationship status. */
    async listByStatus(status: FriendStatus): Promise<Friend[]> {
        return this.adapter.getByField('friend', 'status', status);
    }
}
```

### BSDataBaseDAO

For entities backed by community data files, extend `BSDataBaseDAO<T>`. It provides memoized data loading with sync-on-demand behavior.

**Rules:**
- `load()` returns cached data or syncs from remote — memoizes the promise to prevent duplicate fetches
- `refresh()` forces a re-sync by clearing cached promise and sync status
- `needsSync()` compares local SHA with remote SHA before downloading
- Subclasses must implement `getStoreKey()`, `fetchRemoteData()`, and `getSyncFileKey()`
- Cached promise is cleared on fetch errors to allow retry

---

## 7. Entity Codec & Hydration

### Entity Codecs

Codecs define paired `serialize` (entity → plain record for storage) and `hydrate` (raw record → typed entity) functions.

```typescript
registerEntityCodec('factionData', {
    serialize: (entity: FactionDataModel) => entity.toJSON(),
    hydrate: (raw: Record<string, unknown>) => FactionDataModel.fromJSON(raw),
});
```

**Rules:**
- Adapters check for registered codecs during put/get operations and apply them transparently
- No consumer awareness is required — serialization/deserialization is automatic
- Registry supports `clearCodecRegistry()` for test isolation

### Hydration Registry

A separate hydration registry supports standalone hydrator functions. Codec-based hydration takes precedence over standalone hydrators.

- Entity types that store complex objects as JSON must be flagged with `requiresHydration: true`
- Registry supports `clearHydrationRegistry()` for test isolation

---

## 8. Data Sync Pipeline

### BSData Sync

The system syncs game data from GitHub-hosted BattleScribe community repositories.

**Pipeline:**
1. Fetch `.gst` (game system) and `.cat` (catalogue) XML files from GitHub
2. Parse into typed BattleScribe structures via `parseGameSystem()` and `parseCatalogue()`
3. Extract domain entities (units, weapons, abilities) via extractor functions
4. Store via the database adapter (`put`/`putMany`)
5. Track sync status per file using SHA hash — avoid redundant downloads

### GitHub Client

The `IGitHubClient` interface provides: `listFiles`, `getFileSha`, `downloadFile`, `checkForUpdates`.

**Rules:**
- Always check remote SHA before downloading content
- Support optional ETag for HTTP-level cache validation
- Client configuration must include base URL, auth token, and user agent
- Support checking for updates without downloading content (SHA comparison only)

---

## 9. Validation Engine

The validation engine is game-agnostic. It accepts an army, faction data, and an array of plugin-provided rule functions.

```typescript
const summary = validateArmyWithRules(army, factionData, rules);
// summary.isValid, summary.errorCount, summary.warningCount, summary.results[]
```

**Rules:**
- Each `ValidationResult` includes: unique ID, passed/failed, severity (error/warning/info), category, message
- Results may include constraint ID, army unit ID/name, and additional details for contextual display
- Severity: `error` = illegal army, `warning` = potential issue, `info` = informational
- Categories: points, composition, enhancement, wargear, leader, warlord, transport, detachment, faction, general
- Plugins provide rules as `PluginValidationRule` objects with id, name, and validate function
- The wh40k10e plugin provides 11 rules covering all army construction validation

---

## 10. Error Handling

Use typed error classes from `@armoury/shared/types/errors`.

```typescript
import { GitHubApiError, isGitHubApiError } from '@armoury/shared';

try {
    await client.downloadFile(path);
} catch (error) {
    if (isGitHubApiError(error)) {
        console.error(`GitHub API error: ${error.status}`);
    }

    throw error;
}
```

### Error Hierarchy

| Error Class | Represents | Extends |
|-------------|-----------|---------|
| `DataLayerError` | Root of all data layer errors | `Error` |
| `GitHubApiError` | GitHub API request failures (with HTTP status) | `DataLayerError` |
| `RateLimitError` | GitHub API rate limit exceeded | `DataLayerError` |
| `NetworkError` | Network connectivity failures | `DataLayerError` |
| `XmlParseError` | BattleScribe XML parsing failures | `DataLayerError` |
| `DatabaseError` | Database operation failures (with operation code) | `DataLayerError` |

### Type Guards

Use type guard functions for runtime narrowing: `isDataLayerError`, `isGitHubApiError`, `isRateLimitError`, `isNetworkError`, `isXmlParseError`, `isDatabaseError`.

---

## 11. Lambda Services

### Request Validation

All parsers accept raw request body (`unknown | null`) and return either a typed request object or an `Error`. Route handlers check `result instanceof Error` to determine whether validation passed.

### Response Formatting

Use centralized response helpers (`jsonResponse`, `errorResponse`) from `utils/response.ts`. Never build response objects inline in route handlers.

### Auth Middleware

All protected endpoints must validate requests against the authorizer Lambda. The authorizer returns IAM policy documents allowing or denying access.

### Service Structure

```
src/services/<service>/src/
├── handler.ts           → Lambda entry point
├── router.ts            → Route matching
├── routes/              → Route handlers by domain
├── middleware/           → Auth, error handling
├── utils/               → Response formatting, validation, secrets
└── types.ts             → Service-specific types
```

---

## 12. Security

- **GitHub API tokens:** Never store in client-side code or transmit to browsers — server-only
- **Aurora DSQL:** Use IAM auth tokens — never static passwords
- **Client applications:** No direct database access to server-side stores — all via API Gateway + Lambda
- **Entity isolation:** One user must not access another user's data without explicit sharing
- **User identity:** Auth0 subject identifiers are the canonical user identity (`Account.id` = Auth0 `sub`)
- **SQL injection:** Use parameterized queries; validate ORDER BY column names against schema-defined column sets
- **Input sanitization:** All user inputs sanitized on both client and server

---

## 13. Performance

- **Batch operations:** Use `putMany` instead of repeated single `put` calls for sync operations
- **Transactions:** Use `adapter.transaction()` for atomic multi-step operations — minimize overhead
- **Memoization:** BSDataBaseDAO memoizes loaded data to avoid duplicate fetches within a session
- **SHA checks:** Use SHA comparison only (no content download) to determine if sync is needed
- **Pagination:** Use `limit` and `offset` query options for paginated retrieval — avoid loading entire stores
- **Server-side sorting:** Use `orderBy` and `direction` query options — avoid client-side sort of large datasets
- **Dynamic imports:** Use dynamic imports for platform-specific adapter modules to enable tree-shaking (DSQL adapter only loaded on server)
- **Column whitelisting:** SQLite adapter uses column name whitelisting to prevent SQL injection in dynamic ORDER BY clauses

---

## 14. Anti-Patterns

| Never Do This | Do This Instead |
|---------------|-----------------|
| Instantiate `DataContext` directly | Use `DataContext.builder()` |
| Use raw string platform identifiers | Use `Platform` enum |
| Import game-specific code in adapters | Use the codec/hydration registries |
| Duplicate helper functions across files | Extract to `utils/` directory |
| Skip `adapter.initialize()` before operations | Use the factory (it calls initialize) |
| Modify core code for new game systems | Extend via plugin registries |
| Store derived state redundantly | Compute from source data |
| Suppress type errors with `as any` | Fix the underlying type issue |
| Use empty catch blocks `catch(e) {}` | Handle or rethrow with typed errors |
| Skip JSDoc on exported symbols | Document every export |
| Use relative imports | Use `@shared/` aliases with `.js` extensions |

---

**End of Backend Best Practices**
