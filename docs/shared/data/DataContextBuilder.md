# DataContextBuilder

Builder for creating `DataContext` instances with fluent configuration. Handles adapter creation, game system registration, and dependency wiring.

**Source:** `src/shared/data/DataContextBuilder.ts`

---

## Exports

### `DataContextBuilder<TGameData>`

Builder class for constructing a fully initialized `DataContext` instance. Provides a fluent API for configuring the game system, platform, adapter, and GitHub client.

```typescript
class DataContextBuilder<TGameData = unknown> {
    system(gameSystem: GameSystem): DataContextBuilder<TGameData>;
    platform(platform: Platform): DataContextBuilder<TGameData>;
    adapter(adapter: DatabaseAdapter): DataContextBuilder<TGameData>;
    github(client: IGitHubClient): DataContextBuilder<TGameData>;
    build(): Promise<DataContext<TGameData>>;
}
```

---

## Methods

### `system(gameSystem)`

Sets the game system for the data context. **Required** — the builder will throw if `build()` is called without a game system.

```typescript
system(gameSystem: GameSystem): DataContextBuilder<TGameData>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `gameSystem` | `GameSystem` | Game system descriptor (e.g., `wh40k10eSystem`). |

**Returns:** `DataContextBuilder<TGameData>` — The builder instance for chaining.

---

### `platform(platform)`

Sets the target platform for adapter creation. The builder will use the adapter factory to create an adapter for the specified platform. Either `platform()` or `adapter()` must be called before `build()`.

```typescript
platform(platform: Platform): DataContextBuilder<TGameData>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `platform` | `Platform` | Target platform (e.g., `Platform.IndexedDB`, `Platform.SQLite`, `Platform.AuroraDSQL`). |

**Returns:** `DataContextBuilder<TGameData>` — The builder instance for chaining.

---

### `adapter(adapter)`

Sets a pre-built adapter instance. Use this when you need full control over adapter creation or when using a custom adapter. Either `platform()` or `adapter()` must be called before `build()`.

```typescript
adapter(adapter: DatabaseAdapter): DataContextBuilder<TGameData>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Pre-initialized database adapter instance. |

**Returns:** `DataContextBuilder<TGameData>` — The builder instance for chaining.

**Note:** When using `adapter()`, the builder will call `adapter.initialize()` during `build()` to ensure the adapter is ready.

---

### `github(client)`

Sets the GitHub client used for remote data access. Optional — if not provided, a stub client will be used that throws on invocation.

```typescript
github(client: IGitHubClient): DataContextBuilder<TGameData>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `IGitHubClient` | GitHub client instance for BSData sync. |

**Returns:** `DataContextBuilder<TGameData>` — The builder instance for chaining.

---

### `build()`

Builds a fully initialized `DataContext` instance. Performs the following steps:

1. Validates that a game system is configured (throws if missing).
2. Validates that either a platform or adapter is configured (throws if missing).
3. Registers the game system (calls `gameSystem.register()`).
4. Creates an adapter via the factory if `platform()` was used, or uses the provided adapter if `adapter()` was used.
5. Initializes the adapter if a pre-built adapter was provided.
6. Creates a GitHub client stub if no client was provided via `github()`.
7. Calls the game system's `createGameContext()` to wire game-specific DAOs.
8. Constructs the `DataContext` with all dependencies.
9. Calls the game context's `sync()` method if provided (triggers initial BSData sync).

```typescript
async build(): Promise<DataContext<TGameData>>;
```

**Returns:** `Promise<DataContext<TGameData>>` — A fully initialized DataContext instance.

**Throws:**

- `Error` — If no game system is configured.
- `Error` — If neither a platform nor an adapter is configured.

---

## Usage Examples

### Basic usage with platform auto-detection

```typescript
import { DataContext } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Use DataContext...
await dc.close();
```

### With GitHub client for authenticated BSData access

```typescript
import { DataContext, createGitHubClient } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

const githubClient = createGitHubClient({
    token: process.env.GITHUB_TOKEN,
});

const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .github(githubClient)
    .build();

await dc.close();
```

### Using a pre-initialized adapter

```typescript
import { DataContext, createAdapter, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

// Create adapter with custom configuration
const adapter = await createAdapter({
    platform: Platform.AuroraDSQL,
    dsqlConfig: {
        clusterEndpoint: 'https://my-cluster.dsql.us-east-1.on.aws',
        region: 'us-east-1',
    },
});

const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .adapter(adapter)
    .build();

await dc.close();
```

---

## Related

- [DataContext](./DataContext.md) — Primary data access facade
- [createAdapter](./factory.md) — Adapter factory function
- [Platform](../types/enums.md#platform) — Platform enum
