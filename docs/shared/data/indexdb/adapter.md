# IndexedDBAdapter

Database adapter for web browsers using IndexedDB via the Dexie ORM.

**Source:** `src/shared/data/indexdb/adapter.ts`

## Exports

### `IndexedDBAdapter` (class)

Manages persistent storage of tabletop game army data, user accounts, campaigns, and match records in the browser. Uses Dexie for automatic schema versioning and migrations.

```typescript
class IndexedDBAdapter extends BaseDatabaseAdapter
```

#### Properties

| Property   | Type                 | Description                  |
| ---------- | -------------------- | ---------------------------- |
| `platform` | `Platform.IndexedDB` | Always `Platform.IndexedDB`. |

#### Constructor

```typescript
constructor(databaseName?: string)
```

| Parameter      | Type     | Default     | Description                  |
| -------------- | -------- | ----------- | ---------------------------- |
| `databaseName` | `string` | `'armoury'` | The IndexedDB database name. |

#### Methods

All methods implement the `DatabaseAdapter` interface. See [adapter.md](../adapter.md) for full interface documentation.

| Method                               | Description                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `initialize()`                       | Opens the Dexie database. Schema creation and migrations are handled automatically by Dexie version definitions. |
| `close()`                            | Closes the IndexedDB connection via `Dexie.close()`.                                                             |
| `get(store, id)`                     | Uses Dexie `Table.get()`. Reconstructs `FactionDataModel` via `fromJSON()`.                                      |
| `getAll(store)`                      | Uses Dexie `Table.toArray()`. Reconstructs `FactionDataModel` instances via `fromJSON()`.                        |
| `getByField(store, field, value)`    | Uses Dexie `Table.where().equals()` for indexed queries.                                                         |
| `put(store, entity)`                 | Uses Dexie `Table.put()`. Serializes `FactionDataModel` via `toJSON()`.                                          |
| `putMany(store, entities)`           | Wraps multiple `put()` calls in a Dexie transaction.                                                             |
| `delete(store, id)`                  | Uses Dexie `Table.where('id').equals(id).delete()`.                                                              |
| `deleteAll(store)`                   | Uses Dexie `Table.clear()`.                                                                                      |
| `deleteByField(store, field, value)` | Uses Dexie `Table.where().equals().delete()`.                                                                    |
| `transaction(fn)`                    | Uses Dexie `transaction('rw', [...tables], fn)` spanning all 15 stores.                                          |
| `getSyncStatus(fileKey)`             | Queries `syncStatus` table by `fileKey`.                                                                         |
| `setSyncStatus(fileKey, sha, etag?)` | Upserts into `syncStatus` table with current timestamp.                                                          |
| `deleteSyncStatus(fileKey)`          | Deletes from `syncStatus` table by `fileKey`.                                                                    |

#### Schema Versions

The adapter defines 3 Dexie schema versions with progressive feature additions:

| Version | Stores Added                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| 1       | `units`, `weapons`, `abilities`, `stratagems`, `detachments`, `factions`, `syncStatus`                     |
| 2       | `factionModels`                                                                                            |
| 3       | `accounts`, `armies`, `friends`, `masterCampaigns`, `participantCampaigns`, `matchRecords`, `crusadeRules` |

#### Indexed Fields

Each store defines indexed fields for efficient querying:

- `units`: `id`, `name`, `factionId`, `sourceFile`
- `weapons`: `id`, `name`, `type`, `unitId`, `sourceFile`
- `armies`: `id`, `ownerId`, `name`, `factionId`
- `friends`: `id`, `requesterId`, `receiverId`, `status`
- `matchRecords`: `id`, `playerId`, `opponentId`, `campaignId`

## Internal Classes

### `ArmouryDatabase` (class, not exported)

Dexie database instance with typed table declarations for all 15 object stores.

### `SyncStatusRecord` (interface, not exported)

Internal record type for the `syncStatus` table with fields: `fileKey`, `sha`, `lastSynced`, `etag?`.

## Usage Example

```typescript
import { createAdapter, Platform } from '@armoury/shared';

// Created via factory (recommended)
const adapter = await createAdapter({ platform: Platform.IndexedDB });

// Or directly
import { IndexedDBAdapter } from '@armoury/shared';

const adapter = new IndexedDBAdapter('my-db');
await adapter.initialize();

const factions = await adapter.getAll('faction');
const units = await adapter.getByField('unit', 'factionId', 'space-marines');
```
