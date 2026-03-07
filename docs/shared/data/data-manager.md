# DataManager

> **Legacy API.** For new code, use [DataContext](../../shared/index.md#datacontext-primary-api) which provides a DAO-based architecture with auto-syncing game data.

Primary facade for app-level and game-specific data access. Wraps a database adapter with typed repositories and a builder for wiring.

**Source:** `src/shared/data/data-manager.ts`

## Builder Pattern

```typescript
import { DataManager, PluginRegistry, Platform } from '@armoury/shared';
import { wh40k10ePlugin, EntityKind } from '@shared/systems/wh40k10e/plugin.js';

PluginRegistry.register(wh40k10ePlugin);

const dm = await DataManager.builder()
    .plugin(wh40k10ePlugin)       // required — sets phantom types
    .platform(Platform.IndexedDB) // creates adapter via factory
    .build();
```

The builder also accepts a pre-initialized adapter as an escape hatch:

```typescript
const dm = await DataManager.builder()
    .plugin(wh40k10ePlugin)
    .adapter(myAdapter)           // skips factory, uses provided adapter
    .build();
```

## Repositories

### `dm.accounts` — `Repository<Account>`

CRUD for user account entities.

### `dm.social` — `SocialRepository`

Extends `Repository<Friend>` with `getByStatus(status: FriendStatus): Promise<Friend[]>`.

### `dm.campaigns` — `Repository<CampaignTypeOf<P>>`

CRUD for campaign entities. The concrete type is extracted from the plugin's phantom `CampaignType` (e.g., `MasterCampaign` for wh40k10e).

### `dm.matches` — `Repository<MatchTypeOf<P>>`

CRUD for match entities. The concrete type is extracted from the plugin's phantom `MatchType` (e.g., `MatchRecord` for wh40k10e).

### `dm.gameData` — `GameDataAccessor<GameEntityMapOf<P>>`

Enum-based accessor for game-specific entities:

```typescript
const units = await dm.gameData.list(EntityKind.Unit);
const army = await dm.gameData.get(EntityKind.Army, 'army-1');
await dm.gameData.save(EntityKind.Unit, myUnit);
await dm.gameData.deleteAll(EntityKind.Weapon);

// Search by field value (e.g., find all units belonging to a faction)
const smUnits = await dm.gameData.getByField(EntityKind.Unit, 'factionId', 'adeptus-astartes');

// Combine getByField with QueryOptions for pagination and sorting
const weapons = await dm.gameData.getByField(
    EntityKind.Weapon,
    'unitId',
    'intercessor-squad',
    { orderBy: 'name', direction: 'asc', limit: 10 },
);
```

## Repository Interface

All repositories share this interface:

| Method      | Signature                                  |
|-------------|--------------------------------------------|
| `get`       | `(id: string) => Promise<T \| null>`       |
| `list`      | `(options?: QueryOptions<T>) => Promise<T[]>` |
| `save`      | `(entity: T) => Promise<void>`             |
| `saveMany`  | `(entities: T[]) => Promise<void>`         |
| `delete`    | `(id: string) => Promise<void>`            |
| `deleteAll` | `() => Promise<void>`                      |
| `count`     | `() => Promise<number>`                    |

## GameDataAccessor Interface

| Method       | Signature                                                              |
|--------------|------------------------------------------------------------------------|
| `get`        | `<K>(kind: K, id: string) => Promise<TMap[K] \| null>`                |
| `list`       | `<K>(kind: K, options?) => Promise<TMap[K][]>`                        |
| `getByField` | `<K>(kind: K, field: keyof TMap[K], value: string, options?) => Promise<TMap[K][]>` |
| `save`       | `<K>(kind: K, entity: TMap[K]) => Promise<void>`                      |
| `saveMany`   | `<K>(kind: K, entities: TMap[K][]) => Promise<void>`                  |
| `delete`     | `<K>(kind: K, id: string) => Promise<void>`                           |
| `deleteAll`  | `<K>(kind: K) => Promise<void>`                                       |

## Lifecycle

```typescript
const dm = await DataManager.builder().plugin(p).platform(Platform.IndexedDB).build();
// ... use dm ...
await dm.close(); // closes underlying adapter connection
```

## Sync

`dm.sync()` is a placeholder that returns a `SyncResult`. Full sync orchestration is handled by the system's BSData DataManager (see `systems/wh40k10e/DataManager.ts`).
