# CoreRulesDAO.ts

DAO for syncing and caching Warhammer 40K core rules. Fetches the core rules GST file from BSData, parses it, and discovers faction catalogues.

**Source:** `src/shared/systems/wh40k10e/dao/CoreRulesDAO.ts`

---

## Exports

### `CoreRulesDAO`

Class for syncing core rules from BSData and storing them in the database. Extends `Wh40kBaseDAO` to inherit sync status tracking and memoization. Also discovers and caches all faction catalogue files from the repository.

```typescript
class CoreRulesDAO extends Wh40kBaseDAO<CoreRules> {
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient);
    load(): Promise<CoreRules>;
    refresh(): Promise<CoreRules>;
    protected fetchRemoteData(githubClient: IGitHubClient): Promise<CoreRules>;
    protected getStoreKey(): string;
    protected getSyncFileKey(): string;
    protected getRemoteFilePath(): string;
}
```

---

#### `constructor(adapter, githubClient)`

Creates a core rules DAO.

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter instance |
| `githubClient` | `IGitHubClient` | GitHub client for BSData access |

---

#### `load()`

Loads the core rules model from cache or fetches from BSData if not cached. Inherited from `Wh40kBaseDAO` — memoizes the promise to prevent duplicate fetches during concurrent calls.

```typescript
async load(): Promise<CoreRules>;
```

**Returns:** `Promise<CoreRules>` -- Core rules with game system metadata.

**Behavior:**
1. Checks if data is cached in the database
2. If cached, returns the cached model
3. If not cached, calls `fetchRemoteData()` to download and parse the GST file
4. Stores the model in the database
5. Returns the model

**Throws:**
- `Error` -- If GST file download or parsing fails

---

#### `refresh()`

Forces a re-sync of core rules from BSData. Clears the memoized promise and sync status, then fetches fresh data.

```typescript
async refresh(): Promise<CoreRules>;
```

**Returns:** `Promise<CoreRules>` -- Fresh core rules from BSData.

**Throws:**
- `Error` -- If GST file download or parsing fails

---

#### `fetchRemoteData(githubClient)`

Downloads and parses the core rules GST file from BSData. Also discovers and caches all faction catalogue files from the repository.

```typescript
protected async fetchRemoteData(githubClient: IGitHubClient): Promise<CoreRules>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `githubClient` | `IGitHubClient` | GitHub client for file downloads |

**Returns:** `Promise<CoreRules>` -- Parsed core rules.

**Behavior:**
1. Downloads `Warhammer 40,000.gst` from BSData
2. Parses the GST file into a `GameSystem` object
3. Converts the `GameSystem` to a `CoreRules` via `parseCoreRules()`
4. Calls `discoverFactions()` to list all `.cat` files in the repository
5. Stores faction metadata in the database
6. Returns the core rules model

**Throws:**
- `Error` -- If GST file download or parsing fails
- `Error` -- If faction discovery fails

---

#### `getStoreKey()`

Returns the adapter store key for core rules.

```typescript
protected getStoreKey(): string;
```

**Returns:** `string` -- `"coreRules"`

---

#### `getSyncFileKey()`

Returns the sync file key for core rules.

```typescript
protected getSyncFileKey(): string;
```

**Returns:** `string` -- `"core:wh40k-10e.gst"`

---

#### `getRemoteFilePath()`

Returns the remote file path for core rules.

```typescript
protected getRemoteFilePath(): string;
```

**Returns:** `string` -- `"Warhammer%2040%2C000.gst"` (URL-encoded)

---

## Faction Discovery

The `CoreRulesDAO` discovers all faction catalogue files (`.cat` files) in the BSData repository and stores them in the database. This allows the app to list available factions without hardcoding them.

**Faction metadata stored:**

```typescript
interface Faction {
    id: string;              // SHA hash of the catalogue file
    name: string;            // Display name (extracted from file name)
    sourceFile: string;      // Catalogue file name (e.g., "Imperium - Space Marines.cat")
    sourceSha: string;       // SHA hash of the catalogue file
    catalogueFile: string;   // Same as sourceFile
}
```

**Name extraction rules:**
- Removes `.cat` extension
- Removes `Imperium - `, `Chaos - `, `Xenos - ` prefixes
- Example: `Imperium - Space Marines.cat` → `Space Marines`

---

## Usage Examples

### Load core rules via DataContext (recommended)

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';
import type { Wh40kGameData } from '@shared/systems/wh40k10e/dao/Wh40kGameData.js';

const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Load core rules
const coreRules = await dc.game.coreRules;
console.log(`Core rules version: ${coreRules.version}`);
console.log(`Game system: ${coreRules.name}`);
console.log(`Source file: ${coreRules.sourceFile}`);
```

### Create a CoreRulesDAO directly

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { createGitHubClient } from '@armoury/shared';
import { CoreRulesDAO } from '@shared/systems/wh40k10e/dao/CoreRulesDAO.js';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const githubClient = createGitHubClient({ token: process.env.GITHUB_TOKEN });

const coreRulesDAO = new CoreRulesDAO(adapter, githubClient);

// Load core rules (fetches from BSData if not cached)
const coreRules = await coreRulesDAO.load();
console.log(`Core rules version: ${coreRules.version}`);

// Force refresh from BSData
const freshCoreRules = await coreRulesDAO.refresh();
```

### List discovered factions

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { createGitHubClient } from '@armoury/shared';
import { CoreRulesDAO } from '@shared/systems/wh40k10e/dao/CoreRulesDAO.js';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const githubClient = createGitHubClient({ token: process.env.GITHUB_TOKEN });

const coreRulesDAO = new CoreRulesDAO(adapter, githubClient);

// Load core rules (also discovers factions)
await coreRulesDAO.load();

// List all discovered factions
const factions = await adapter.getAll('faction');
for (const faction of factions) {
    console.log(`${faction.name} (${faction.sourceFile})`);
}
```

### Check if core rules need updating

```typescript
const adapter = await createAdapter({ platform: Platform.IndexedDB });
const githubClient = createGitHubClient({ token: process.env.GITHUB_TOKEN });

const coreRulesDAO = new CoreRulesDAO(adapter, githubClient);

// Load cached core rules
const coreRules = await coreRulesDAO.load();
console.log(`Last synced: ${coreRules.lastSynced}`);

// Check if BSData has updates
const hasUpdates = await githubClient.checkForUpdates(
    'BSData',
    'wh40k-10e',
    'Warhammer%2040%2C000.gst',
    coreRules.sourceSha,
);

if (hasUpdates) {
    console.log('Core rules have been updated on BSData');
    const freshCoreRules = await coreRulesDAO.refresh();
}
```

---

## Related

- [Wh40kGameData](./Wh40kGameData.md) — Game data context with 40 async faction getters
- [Wh40kFactionDAO](./Wh40kFactionDAO.md) — Base DAO for faction data syncing
- [system.ts](../system.md) — Wh40k10e system implementation
- [GitHub Client](../../../clients/github/client.md) — GitHub API client for BSData
