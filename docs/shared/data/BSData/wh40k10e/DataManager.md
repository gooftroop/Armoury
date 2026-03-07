# BSData DataManager (Sync Service)

Service for syncing tabletop game data from GitHub and querying it from the database.

> **Not to be confused with** the [DataManager facade](../../data-manager.md) (`src/shared/data/data-manager.ts`), which is the primary app-level data access API with repositories and the builder pattern. This file documents the BSData sync orchestration service.

**Source:** `src/shared/systems/wh40k10e/DataManager.ts`

## Exports

### `DataManagerConfig` (interface)

Configuration object for DataManager initialization.

```typescript
interface DataManagerConfig {
    adapter: DatabaseAdapter;
    githubClient: IGitHubClient;
    owner?: string;
    repo?: string;
}
```

| Property       | Type              | Default       | Description                                           |
| -------------- | ----------------- | ------------- | ----------------------------------------------------- |
| `adapter`      | `DatabaseAdapter` | --            | Database adapter for storing and retrieving entities. |
| `githubClient` | `IGitHubClient`   | --            | GitHub client for downloading community data files.   |
| `owner`        | `string`          | `'BSData'`    | GitHub repository owner.                              |
| `repo`         | `string`          | `'wh40k-10e'` | GitHub repository name.                               |

### `DataManager` (interface)

Public interface for the DataManager service. Orchestrates syncing tabletop game data from GitHub and querying it from the database.

#### Sync Methods

| Method             | Signature                                          | Description                                                                                                            |
| ------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `initialize`       | `() => Promise<void>`                              | Initializes the DataManager and underlying database adapter. Must be called before any other operations.               |
| `close`            | `() => Promise<void>`                              | Closes the DataManager and releases resources.                                                                         |
| `syncCoreRules`    | `() => Promise<SyncResult>`                        | Syncs the core rules GST file, parses it, and discovers all available factions. Replaces all existing faction records. |
| `syncFaction`      | `(factionId: string) => Promise<SyncResult>`       | Syncs a single faction's CAT file. Extracts units/weapons/abilities and atomically replaces old data.                  |
| `syncFactionModel` | `(factionKey: string) => Promise<SyncResult>`      | Syncs a faction from multiple catalogue files, merges them, and stores the complete `FactionDataModel`.                |
| `syncAllFactions`  | `() => Promise<SyncResult>`                        | Syncs all factions in the database. Continues on individual failures.                                                  |
| `discoverFaction`  | `(factionKey: string) => Promise<Faction \| null>` | Creates a Faction record from the faction config. Returns null if key not found.                                       |
| `needsSync`        | `(fileKey: string) => Promise<boolean>`            | Checks if a file needs syncing by comparing local SHA with GitHub. Returns true on network errors.                     |

#### Query Methods

| Method            | Signature                                                   | Description                                          |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `getUnits`        | `(factionId?: string) => Promise<Unit[]>`                   | Retrieves all units, optionally filtered by faction. |
| `getUnit`         | `(id: string) => Promise<Unit \| null>`                     | Retrieves a single unit by ID.                       |
| `getWeapons`      | `(unitId?: string) => Promise<Weapon[]>`                    | Retrieves all weapons, optionally filtered by unit.  |
| `getWeapon`       | `(id: string) => Promise<Weapon \| null>`                   | Retrieves a single weapon by ID.                     |
| `getAbilities`    | `() => Promise<Ability[]>`                                  | Retrieves all abilities.                             |
| `getAbility`      | `(id: string) => Promise<Ability \| null>`                  | Retrieves a single ability by ID.                    |
| `getFactions`     | `() => Promise<Faction[]>`                                  | Retrieves all factions.                              |
| `getFaction`      | `(id: string) => Promise<Faction \| null>`                  | Retrieves a single faction by ID.                    |
| `getFactionModel` | `(factionKey: string) => Promise<FactionDataModel \| null>` | Retrieves a complete faction model with merged data. |
| `getSyncStatus`   | `() => Promise<Map<string, FileSyncStatus>>`                | Retrieves sync status for all synced files.          |

### `createDataManager` (function)

Factory function that creates a DataManager instance. The returned instance must be initialized before use.

```typescript
function createDataManager(config: DataManagerConfig): DataManager;
```

#### Parameters

| Parameter | Type                | Description                                            |
| --------- | ------------------- | ------------------------------------------------------ |
| `config`  | `DataManagerConfig` | Configuration with database adapter and GitHub client. |

#### Returns

`DataManager` -- A new DataManager instance (not yet initialized).

## Sync Flow

### Core Rules Sync (`syncCoreRules`)

1. Check if core rules file needs update via `needsSync()`
2. Download core rules GST file from GitHub
3. Parse XML to validate format
4. Discover all faction catalogue files from repository
5. Atomically delete old factions and insert newly discovered ones
6. Store sync status with new SHA

### Faction Sync (`syncFaction`)

1. Retrieve faction record from database
2. Check if catalogue file needs update via `needsSync()`
3. Download faction CAT file from GitHub
4. Parse XML and extract units, weapons, abilities
5. Atomically delete old data for this faction and insert new data
6. Store sync status with new SHA

### Faction Model Sync (`syncFactionModel`)

1. Look up faction config by key
2. Download all catalogue files specified in config
3. Parse each CAT file
4. Merge all catalogues via `mergeCatalogues()`
5. Create `FactionDataModel` from merged catalogue
6. Store model and individual entities atomically

## Usage Example

```typescript
import { createAdapter, createDataManager } from '@armoury/shared';
import { GitHubClient } from '@armoury/shared';

const adapter = await createAdapter();
const githubClient = new GitHubClient();
const dataManager = createDataManager({ adapter, githubClient });

await dataManager.initialize();

// Sync core rules and discover factions
await dataManager.syncCoreRules();

// Sync a specific faction model
await dataManager.syncFactionModel('space-marines');

// Query data
const factions = await dataManager.getFactions();
const units = await dataManager.getUnits('space-marines');
const model = await dataManager.getFactionModel('space-marines');

await dataManager.close();
```
