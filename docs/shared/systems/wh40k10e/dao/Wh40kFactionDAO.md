# Wh40kFactionDAO.ts

DAO for syncing and caching Warhammer 40K faction data models. Handles multi-catalogue merging and stores extracted units, weapons, and abilities.

**Source:** `src/shared/systems/wh40k10e/dao/Wh40kFactionDAO.ts`

---

## Exports

### `Wh40kFactionDAO`

Class for syncing faction data from BSData and storing it in the database. Extends `Wh40kBaseDAO` to inherit sync status tracking and memoization. Handles multi-file factions by downloading and merging multiple catalogue files.

```typescript
class Wh40kFactionDAO extends Wh40kBaseDAO<FactionDataModel> {
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient, factionConfig: FactionConfig);
    load(): Promise<FactionDataModel>;
    refresh(): Promise<FactionDataModel>;
    protected fetchRemoteData(githubClient: IGitHubClient): Promise<FactionDataModel>;
    protected getStoreKey(): string;
    protected getSyncFileKey(): string;
    protected getRemoteFilePath(): string;
}
```

---

#### `constructor(adapter, githubClient, factionConfig)`

Creates a faction DAO for the provided faction configuration.

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter instance |
| `githubClient` | `IGitHubClient` | GitHub client for BSData access |
| `factionConfig` | `FactionConfig` | Faction configuration with source files to download and merge |

**FactionConfig structure:**

```typescript
interface FactionConfig {
    id: string;              // Faction ID (e.g., "space-marines")
    name: string;            // Display name (e.g., "Space Marines")
    files: string[];         // Catalogue files to download and merge
    armyImageUrl?: string;   // Optional faction image URL
}
```

---

#### `load()`

Loads the faction model and ensures related entities are stored in the database. Calls parent `load()` to fetch/cache the model, then stores units, weapons, and abilities in a transaction.

```typescript
async load(): Promise<FactionDataModel>;
```

**Returns:** `Promise<FactionDataModel>` -- Loaded faction model with all entities persisted.

**Behavior:**
1. Calls `super.load()` to fetch/cache the faction model
2. Extracts units, weapons, and abilities from the model
3. Stores entities in the database via `storeFactionEntities()`
4. Returns the faction model

**Throws:**
- `Error` -- If catalogue download or parsing fails
- `Error` -- If database transaction fails

---

#### `refresh()`

Forces a re-sync of faction data from BSData. Clears the memoized promise and sync status, then fetches fresh data.

```typescript
async refresh(): Promise<FactionDataModel>;
```

**Returns:** `Promise<FactionDataModel>` -- Fresh faction model from BSData.

**Throws:**
- `Error` -- If catalogue download or parsing fails

---

#### `fetchRemoteData(githubClient)`

Downloads and parses all faction catalogues, merges them, and builds a FactionDataModel. Handles multi-file factions by downloading each catalogue file and merging them.

```typescript
protected async fetchRemoteData(githubClient: IGitHubClient): Promise<FactionDataModel>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `githubClient` | `IGitHubClient` | GitHub client for file downloads |

**Returns:** `Promise<FactionDataModel>` -- Merged faction model with all units, weapons, and abilities.

**Behavior:**
1. Downloads each catalogue file from `factionConfig.files`
2. Parses each file into a `BattleScribeCatalogue` object
3. Merges all catalogues into a single catalogue via `mergeCatalogues()`
4. Converts the merged catalogue to a `FactionDataModel`
5. Sets the faction ID from `factionConfig.id`
6. Updates sync status for each file

**Throws:**
- `Error` -- If any catalogue file download or parsing fails

---

#### `getStoreKey()`

Returns the adapter store key for faction models.

```typescript
protected getStoreKey(): string;
```

**Returns:** `string` -- `"factionModel"`

---

#### `getSyncFileKey()`

Returns the sync file key for this faction model. Uses the primary file (first file in `factionConfig.files`) as the key.

```typescript
protected getSyncFileKey(): string;
```

**Returns:** `string` -- `"factionModel:<primary-file>"`

---

#### `getRemoteFilePath()`

Returns the remote file path for the primary catalogue file. Uses the first file in `factionConfig.files`.

```typescript
protected getRemoteFilePath(): string;
```

**Returns:** `string` -- URL-encoded primary file name.

---

## Faction DAO Patterns

### Standalone Faction DAO

Standalone factions (e.g., Necrons, Tyranids, Astra Militarum) have a single catalogue file and use `Wh40kFactionDAO` directly.

```typescript
import { Wh40kFactionDAO } from '@armoury/systems';
import { FACTION_MAP } from '@armoury/systems';

export class NecronDAO {
    private readonly factionDAO: Wh40kFactionDAO;

    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new Wh40kFactionDAO(adapter, githubClient, FACTION_MAP['necron']);
    }

    async load(): Promise<FactionDataModel> {
        return this.factionDAO.load();
    }

    async refresh(): Promise<FactionDataModel> {
        return this.factionDAO.refresh();
    }
}
```

### Chapter DAO (Space Marines)

Space Marines chapters (e.g., Blood Angels, Dark Angels) extend `SpaceMarinesDAO` and merge chapter-specific data onto the Space Marines base data.

```typescript
import { SpaceMarinesDAO } from '@armoury/systems';
import { Wh40kFactionDAO } from '@armoury/systems';
import { FACTION_MAP } from '@armoury/systems';

export class BloodAngelsDAO extends SpaceMarinesDAO {
    private readonly chapterDAO: Wh40kFactionDAO;

    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        super(adapter, githubClient);
        this.chapterDAO = new Wh40kFactionDAO(adapter, githubClient, FACTION_MAP['blood-angels']);
    }

    async load(): Promise<FactionDataModel> {
        const [baseData, chapterData] = await Promise.all([
            super.load(),
            this.chapterDAO.load(),
        ]);

        return this.mergeFactionData(baseData, chapterData);
    }

    async refresh(): Promise<FactionDataModel> {
        const [baseData, chapterData] = await Promise.all([
            super.refresh(),
            this.chapterDAO.refresh(),
        ]);

        return this.mergeFactionData(baseData, chapterData);
    }
}
```

**Merge behavior:**
- Chapter data overrides base data for entities with matching IDs
- All other entities are combined
- `sourceFiles` array includes both base and chapter files
- `lastSynced` timestamp is the most recent of the two

---

## Usage Examples

### Create a faction DAO directly

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { createGitHubClient } from '@armoury/shared';
import { Wh40kFactionDAO } from '@armoury/systems';
import { FACTION_MAP } from '@armoury/systems';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const githubClient = createGitHubClient({ token: process.env.GITHUB_TOKEN });

const necronDAO = new Wh40kFactionDAO(adapter, githubClient, FACTION_MAP['necron']);

// Load faction data (fetches from BSData if not cached)
const necrons = await necronDAO.load();
console.log(`Necrons has ${necrons.units.length} units`);

// Force refresh from BSData
const freshNecrons = await necronDAO.refresh();
```

### Access via DataContext (recommended)

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Load faction data via async getter
const necrons = await dc.game.necrons;
console.log(`Necrons has ${necrons.units.length} units`);

// Access units stored in the database
const adapter = dc.adapter;
const units = await adapter.getAll('unit');
const necronUnits = units.filter(u => u.factionId === 'necron');
```

### Multi-file faction (Space Marines)

```typescript
import { FACTION_MAP } from '@armoury/systems';

// Space Marines has multiple catalogue files
console.log(FACTION_MAP['space-marines'].files);
// Output: ['Imperium - Space Marines.cat', 'Imperium - Space Marines - Library.cat']

const spaceMarinesDAO = new Wh40kFactionDAO(adapter, githubClient, FACTION_MAP['space-marines']);
const spaceMarines = await spaceMarinesDAO.load();

// All files are downloaded, parsed, and merged into a single FactionDataModel
console.log(`Space Marines source files: ${spaceMarines.sourceFiles.join(', ')}`);
```

---

## Related

- [Wh40kGameData](./Wh40kGameData.md) — Game data context with 40 async faction getters
- [SpaceMarinesDAO](./factions/SpaceMarinesDAO.md) — Space Marines base DAO with chapter merging
- [CoreRulesDAO](./CoreRulesDAO.md) — Core rules and faction discovery
- [system.ts](../system.md) — Wh40k10e system implementation
- [GitHub Client](../../../clients/github/client.md) — GitHub API client for BSData
