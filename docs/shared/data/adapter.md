# DatabaseAdapter

Platform-agnostic database adapter interface and base class for CRUD operations and sync tracking.

**Source:** `src/shared/data/adapter.ts`

## Exports

### `EntityType` (type alias)

Union type representing all supported entity types in the database.

```typescript
type EntityType =
    | 'unit'
    | 'weapon'
    | 'ability'
    | 'stratagem'
    | 'detachment'
    | 'faction'
    | 'factionModel'
    | 'account'
    | 'army'
    | 'friend'
    | 'masterCampaign'
    | 'participantCampaign'
    | 'matchRecord'
    | 'crusadeRules';
```

Covers 14 entity types across game data (units, weapons, abilities, stratagems, detachments, factions), faction models (merged multi-file faction data), and user data (accounts, armies, friends, campaigns, matches, crusade rules).

### `EntityMap` (type alias)

Discriminated union type mapping `EntityType` strings to their corresponding TypeScript types. Used with generic database adapter methods to provide type-safe access to entities.

```typescript
type EntityMap = {
    unit: Unit;
    weapon: Weapon;
    ability: Ability;
    stratagem: Stratagem;
    detachment: Detachment;
    faction: Faction;
    factionModel: FactionDataModel;
    account: Account;
    army: Army;
    friend: Friend;
    masterCampaign: MasterCampaign;
    participantCampaign: ParticipantCampaign;
    matchRecord: MatchRecord;
    crusadeRules: CrusadeRules;
};
```

### `DatabaseAdapter` (interface)

Core database adapter interface providing platform-agnostic CRUD operations and sync tracking. Implementations support SQLite (mobile), IndexedDB (web), and Aurora DSQL (server). All methods are async and handle entity serialization/deserialization transparently.

#### Properties

| Property   | Type       | Description                                   |
| ---------- | ---------- | --------------------------------------------- |
| `platform` | `Platform` | The platform this adapter targets (readonly). |

#### Methods

| Method             | Signature                                                                                               | Description                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `initialize`       | `() => Promise<void>`                                                                                   | Initializes the database connection and creates schema if needed. Must be called before any other operations. |
| `close`            | `() => Promise<void>`                                                                                   | Closes the database connection and releases resources.                                                        |
| `get`              | `<T extends EntityType>(store: T, id: string) => Promise<EntityMap[T] \| null>`                         | Retrieves a single entity by its primary key ID. Returns null if not found.                                   |
| `getAll`           | `<T extends EntityType>(store: T) => Promise<EntityMap[T][]>`                                           | Retrieves all entities of a given type.                                                                       |
| `getByField`       | `<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string) => Promise<EntityMap[T][]>` | Retrieves entities matching a specific field value.                                                           |
| `put`              | `<T extends EntityType>(store: T, entity: EntityMap[T]) => Promise<void>`                               | Inserts or updates a single entity (upsert).                                                                  |
| `putMany`          | `<T extends EntityType>(store: T, entities: EntityMap[T][]) => Promise<void>`                           | Inserts or updates multiple entities in a batch.                                                              |
| `delete`           | `<T extends EntityType>(store: T, id: string) => Promise<void>`                                         | Deletes a single entity by ID.                                                                                |
| `deleteAll`        | `<T extends EntityType>(store: T) => Promise<void>`                                                     | Deletes all entities of a given type.                                                                         |
| `deleteByField`    | `<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string) => Promise<void>`           | Deletes all entities matching a specific field value.                                                         |
| `transaction`      | `<R>(fn: () => Promise<R>) => Promise<R>`                                                               | Executes a function within an atomic database transaction.                                                    |
| `getSyncStatus`    | `(fileKey: string) => Promise<FileSyncStatus \| null>`                                                  | Retrieves sync status metadata for a file.                                                                    |
| `setSyncStatus`    | `(fileKey: string, sha: string, etag?: string) => Promise<void>`                                        | Stores or updates sync status metadata for a file.                                                            |
| `deleteSyncStatus` | `(fileKey: string) => Promise<void>`                                                                    | Deletes sync status metadata for a file.                                                                      |

### `BaseDatabaseAdapter` (abstract class)

Abstract base class for database adapter implementations. Provides the contract that all platform-specific adapters must implement. All methods are abstract and mirror the `DatabaseAdapter` interface.

```typescript
abstract class BaseDatabaseAdapter implements DatabaseAdapter
```

Subclasses: `SQLiteAdapter`, `IndexedDBAdapter`, `DSQLAdapter`.

### `Platform` (re-export)

Re-exports the `Platform` enum from `@armoury/shared` for convenience.

## Usage Example

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import type { DatabaseAdapter, EntityType, EntityMap } from '@armoury/shared';

const adapter: DatabaseAdapter = await createAdapter({
    platform: Platform.IndexedDB,
});

// Type-safe entity access
const unit = await adapter.get('unit', 'some-unit-id');
const factions = await adapter.getAll('faction');

// Field-based queries
const spaceMarineUnits = await adapter.getByField('unit', 'factionId', 'space-marines');

// Atomic transactions
await adapter.transaction(async () => {
    await adapter.deleteByField('unit', 'factionId', 'necrons');
    await adapter.putMany('unit', newUnits);
});

// Sync tracking
const status = await adapter.getSyncStatus('core:wh40k-10e.gst');
await adapter.setSyncStatus('core:wh40k-10e.gst', 'abc123', 'etag-value');
```
