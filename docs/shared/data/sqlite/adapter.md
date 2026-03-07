# SQLiteAdapter

Database adapter for React Native/Expo mobile apps using SQLite via expo-sqlite.

**Source:** `src/shared/data/sqlite/adapter.ts`

## Exports

### `SQLiteAdapter` (class)

Manages persistent storage of tabletop game army data, user accounts, campaigns, and match records using SQLite. Uses expo-sqlite for cross-platform SQLite access with schema versioning via `PRAGMA user_version`.

```typescript
class SQLiteAdapter extends BaseDatabaseAdapter
```

#### Properties

| Property   | Type              | Description               |
| ---------- | ----------------- | ------------------------- |
| `platform` | `Platform.SQLite` | Always `Platform.SQLite`. |

#### Constructor

```typescript
constructor(database: SQLiteDatabase)
```

| Parameter  | Type             | Description                                                  |
| ---------- | ---------------- | ------------------------------------------------------------ |
| `database` | `SQLiteDatabase` | The expo-sqlite database instance to use for all operations. |

#### Methods

All methods implement the `DatabaseAdapter` interface. See [adapter.md](../adapter.md) for full interface documentation.

| Method                               | Description                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `initialize()`                       | Checks `PRAGMA user_version` and creates tables/indexes if schema version is below 4. |
| `close()`                            | Closes the SQLite database connection via `closeAsync()`.                             |
| `get(store, id)`                     | Executes `SELECT * FROM {table} WHERE id = ?`. Deserializes JSON fields.              |
| `getAll(store)`                      | Executes `SELECT * FROM {table}`. Deserializes JSON fields.                           |
| `getByField(store, field, value)`    | Executes `SELECT * FROM {table} WHERE {field} = ?`.                                   |
| `put(store, entity)`                 | Executes `INSERT OR REPLACE`. Serializes arrays/objects to JSON strings.              |
| `putMany(store, entities)`           | Wraps multiple `put()` calls in a transaction.                                        |
| `delete(store, id)`                  | Executes `DELETE FROM {table} WHERE id = ?`.                                          |
| `deleteAll(store)`                   | Executes `DELETE FROM {table}`.                                                       |
| `deleteByField(store, field, value)` | Executes `DELETE FROM {table} WHERE {field} = ?`.                                     |
| `transaction(fn)`                    | Uses `withExclusiveTransactionAsync` for atomic operations.                           |
| `getSyncStatus(fileKey)`             | Queries `sync_status` table by `fileKey`.                                             |
| `setSyncStatus(fileKey, sha, etag?)` | Upserts into `sync_status` table with current timestamp.                              |
| `deleteSyncStatus(fileKey)`          | Deletes from `sync_status` table by `fileKey`.                                        |

#### Schema

The adapter manages 14 tables with schema version 4:

- `units`, `weapons`, `abilities`, `stratagems`, `detachments`, `factions` -- game data
- `faction_models` -- serialized FactionDataModel instances
- `sync_status` -- file sync tracking
- `accounts`, `armies`, `friends` -- user data
- `master_campaigns`, `participant_campaigns`, `match_records`, `crusade_rules` -- campaign/match data

Indexes are created on frequently queried foreign key fields (e.g., `units.factionId`, `weapons.unitId`, `armies.ownerId`).

#### Serialization

- `FactionDataModel` instances are serialized via `toJSON()` and reconstructed via `FactionDataModel.fromJSON()`.
- Array fields (e.g., `keywords`, `abilities`, `weapons`) are stored as JSON strings in TEXT columns.
- Object fields (e.g., `leader`, `preferences`, `gameTracker`) are stored as JSON strings.

## Usage Example

```typescript
import { createAdapter, Platform } from '@armoury/shared';

// Created via factory (recommended)
const adapter = await createAdapter({ platform: Platform.SQLite });

// Or directly with expo-sqlite
import { openDatabaseAsync } from 'expo-sqlite';
import { SQLiteAdapter } from '@armoury/shared';

const db = await openDatabaseAsync('armoury.db');
const adapter = new SQLiteAdapter(db);
await adapter.initialize();

const units = await adapter.getAll('unit');
```
