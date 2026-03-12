# BSDataBaseDAO

Abstract base DAO for BSData-backed entities. Provides memoized loading, sync status tracking, and GitHub update checks for entities sourced from BattleScribe community data repositories.

**Source:** `src/shared/data/dao/BSDataBaseDAO.ts`

---

## Exports

### `BSDataBaseDAO<T>`

Abstract base class for DAOs that fetch and cache data from BSData GitHub repositories. Handles sync status tracking, ETag-based update detection, and memoized loading to avoid duplicate fetches.

```typescript
abstract class BSDataBaseDAO<T> {
    protected readonly adapter: DatabaseAdapter;
    protected readonly githubClient: IGitHubClient;
    protected readonly owner: string;
    protected readonly repo: string;
    protected cachedPromise: Promise<T> | null;
    
    constructor(
        adapter: DatabaseAdapter,
        githubClient: IGitHubClient,
        owner: string,
        repo: string
    );
    
    load(): Promise<T>;
    refresh(): Promise<T>;
    
    protected abstract getStoreKey(): string;
    protected abstract fetchRemoteData(githubClient: IGitHubClient): Promise<T>;
    protected abstract getSyncFileKey(): string;
    protected getEntityId(): string;
    protected getRemoteFilePath(): string;
    protected getRemoteSha(): Promise<string>;
    protected needsSync(): Promise<boolean>;
    protected updateSyncStatus(sha: string): Promise<void>;
}
```

---

## Constructor

### `constructor(adapter, githubClient, owner, repo)`

Creates a BSData-backed DAO.

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter instance. |
| `githubClient` | `IGitHubClient` | GitHub client for BSData access. |
| `owner` | `string` | GitHub repository owner (e.g., `'BSDataProject'`). |
| `repo` | `string` | GitHub repository name (e.g., `'wh40k-10e'`). |

---

## Public Methods

### `load()`

Loads the data model from cache or syncs from remote as needed. Memoizes the load promise to avoid duplicate fetches. Subsequent calls return the same promise until `refresh()` is called.

```typescript
async load(): Promise<T>;
```

**Returns:** `Promise<T>` — The loaded data model.

**Behavior:**

1. If a cached promise exists, returns it immediately.
2. Otherwise, checks sync status to determine if remote fetch is needed.
3. If local data is up-to-date, returns it from the adapter.
4. If sync is needed, fetches from GitHub, stores locally, and updates sync status.
5. Caches the promise for subsequent calls.

---

### `refresh()`

Forces a re-sync and returns the latest data model. Clears the cached promise and sync status, then fetches fresh data from GitHub.

```typescript
async refresh(): Promise<T>;
```

**Returns:** `Promise<T>` — The refreshed data model.

**Use this when:**

- User explicitly requests a data refresh.
- You need to bypass the cache and get the latest data.

---

## Protected Methods (for subclasses)

### `getStoreKey()` (abstract)

Returns the entity store key used by the adapter (e.g., `'factionModel'`, `'coreRules'`).

```typescript
protected abstract getStoreKey(): string;
```

**Returns:** `string` — Store key for the entity type.

---

### `fetchRemoteData(githubClient)` (abstract)

Fetches and parses remote data from the BSData source. Subclasses implement this to download XML files, parse them, and return the entity model.

```typescript
protected abstract fetchRemoteData(githubClient: IGitHubClient): Promise<T>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `githubClient` | `IGitHubClient` | GitHub client for downloading files. |

**Returns:** `Promise<T>` — The parsed entity model.

---

### `getSyncFileKey()` (abstract)

Returns the sync status file key used for tracking updates (e.g., `'core-rules'`, `'space-marines'`).

```typescript
protected abstract getSyncFileKey(): string;
```

**Returns:** `string` — Sync file key for tracking this entity's update status.

---

### `getEntityId()`

Returns the entity ID used for storage and lookup. Defaults to the sync file key for singleton entities. Override for entities with custom IDs.

```typescript
protected getEntityId(): string;
```

**Returns:** `string` — Entity ID.

---

### `getRemoteFilePath()`

Returns the remote file path used for GitHub update checks. Defaults to the sync file key. Override if the file path differs from the sync key.

```typescript
protected getRemoteFilePath(): string;
```

**Returns:** `string` — Remote file path (e.g., `'data/catalogues/space-marines.cat'`).

---

### `getRemoteSha()`

Returns the remote SHA for the BSData file.

```typescript
protected async getRemoteSha(): Promise<string>;
```

**Returns:** `Promise<string>` — SHA hash of the remote file.

---

### `needsSync()`

Checks if the remote file has updates compared to local sync status. Returns `true` if no local sync status exists or if the remote SHA differs.

```typescript
protected async needsSync(): Promise<boolean>;
```

**Returns:** `Promise<boolean>` — `true` if sync is needed, `false` otherwise.

---

### `updateSyncStatus(sha)`

Updates the stored sync status with the latest SHA.

```typescript
protected async updateSyncStatus(sha: string): Promise<void>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `sha` | `string` | Latest SHA from the remote file. |

**Returns:** `Promise<void>` — Resolves when sync status is updated.

---

## Usage Examples

### Creating a BSData-backed DAO

```typescript
import { BSDataBaseDAO } from '@armoury/shared';
import type { DatabaseAdapter, IGitHubClient } from '@armoury/shared';
import { FactionDataModel } from '../models/FactionDataModel.js';
import { parseCatalogue } from '@armoury/providers-bsdata';

export class SpaceMarinesDAO extends BSDataBaseDAO<FactionDataModel> {
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        super(adapter, githubClient, 'BSDataProject', 'wh40k-10e');
    }
    
    protected getStoreKey(): string {
        return 'factionModel';
    }
    
    protected getSyncFileKey(): string {
        return 'space-marines';
    }
    
    protected getRemoteFilePath(): string {
        return 'data/catalogues/space-marines.cat';
    }
    
    protected async fetchRemoteData(githubClient: IGitHubClient): Promise<FactionDataModel> {
        const xml = await githubClient.downloadFile(
            'BSDataProject',
            'wh40k-10e',
            'data/catalogues/space-marines.cat'
        );
        const catalogue = parseCatalogue(xml);
        return FactionDataModel.fromCatalogue(catalogue);
    }
}
```

### Using a BSData DAO

```typescript
import { createAdapter, createGitHubClient, Platform } from '@armoury/shared';
import { SpaceMarinesDAO } from './SpaceMarinesDAO.js';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const githubClient = createGitHubClient({ token: process.env.GITHUB_TOKEN });
const spaceMarines = new SpaceMarinesDAO(adapter, githubClient);

// First load: fetches from GitHub if needed
const data = await spaceMarines.load();
console.log(data.units.length); // e.g., 150 units

// Subsequent loads: returns cached promise
const data2 = await spaceMarines.load(); // instant, same promise

// Force refresh: bypasses cache
const freshData = await spaceMarines.refresh();
```

### Implementing a DAO with custom entity ID

```typescript
import { BSDataBaseDAO } from '@armoury/shared';
import type { DatabaseAdapter, IGitHubClient } from '@armoury/shared';
import { UnitModel } from '../models/UnitModel.js';

export class UnitDAO extends BSDataBaseDAO<UnitModel> {
    private readonly unitId: string;
    
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient, unitId: string) {
        super(adapter, githubClient, 'BSDataProject', 'wh40k-10e');
        this.unitId = unitId;
    }
    
    protected getStoreKey(): string {
        return 'unit';
    }
    
    protected getSyncFileKey(): string {
        return `unit-${this.unitId}`;
    }
    
    protected getEntityId(): string {
        return this.unitId; // Custom ID instead of sync file key
    }
    
    protected async fetchRemoteData(githubClient: IGitHubClient): Promise<UnitModel> {
        // Fetch and parse unit data...
    }
}
```

---

## Related

- [BaseDAO](./BaseDAO.md) — Abstract base class for CRUD operations
- [GitHubClient](../../clients/github/client.md) — GitHub API client
- [DataContext](../DataContext.md) — Primary data access facade
