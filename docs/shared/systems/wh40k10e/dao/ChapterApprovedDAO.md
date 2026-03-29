# ChapterApprovedDAO.ts

DAO for syncing and caching Chapter Approved mission data from Wahapedia. Uses TTL-based sync (7 days) instead of SHA-based checks since Wahapedia is not a Git repository.

**Source:** `src/shared/systems/wh40k10e/dao/ChapterApprovedDAO.ts`

---

## Exports

### `ChapterApprovedDAO`

Class for syncing Chapter Approved mission data from Wahapedia and storing it in the database. Uses a 7-day TTL (time-to-live) for cache invalidation instead of SHA-based checks. Memoizes `load()` promises to prevent duplicate fetches during concurrent access.

```typescript
class ChapterApprovedDAO {
    constructor(adapter: DatabaseAdapter, wahapediaClient: IWahapediaClient);
    load(): Promise<ChapterApprovedModel>;
    refresh(): Promise<ChapterApprovedModel>;
}
```

---

#### `constructor(adapter, wahapediaClient)`

Creates a Chapter Approved DAO.

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter instance |
| `wahapediaClient` | `IWahapediaClient` | Wahapedia client for fetching mission data |

---

#### `load()`

Loads Chapter Approved data from cache or fetches from Wahapedia if stale. Memoizes the promise to avoid duplicate fetches during concurrent calls.

```typescript
async load(): Promise<ChapterApprovedModel>;
```

**Returns:** `Promise<ChapterApprovedModel>` -- Chapter Approved model with mission data.

**Behavior:**
1. If a memoized promise exists, returns it immediately
2. Checks if cached data is stale (older than 7 days)
3. If fresh, returns cached data
4. If stale or missing, fetches from Wahapedia via `wahapediaClient.fetch()`
5. Parses HTML into a `ChapterApprovedModel` using `ChapterApprovedParser`
6. Stores the model in the database
7. Updates sync status with current timestamp
8. Returns the model

**Throws:**
- `Error` -- If Wahapedia fetch fails
- `Error` -- If HTML parsing fails

---

#### `refresh()`

Forces a re-fetch from Wahapedia and returns the latest data. Clears the memoized promise and sync status before fetching.

```typescript
async refresh(): Promise<ChapterApprovedModel>;
```

**Returns:** `Promise<ChapterApprovedModel>` -- Fresh Chapter Approved model from Wahapedia.

**Behavior:**
1. Clears the memoized promise
2. Deletes sync status from the database
3. Calls `loadWithSync(true)` to force a fresh fetch
4. Returns the fresh model

**Throws:**
- `Error` -- If Wahapedia fetch fails
- `Error` -- If HTML parsing fails

---

## TTL-Based Sync

Unlike BSData DAOs (which use SHA-based sync), `ChapterApprovedDAO` uses a TTL-based approach because Wahapedia is not a Git repository and doesn't provide SHA hashes.

**TTL Configuration:**

| Constant | Value | Description |
|----------|-------|-------------|
| `STALE_AFTER_MS` | `7 * 24 * 60 * 60 * 1000` | 7 days in milliseconds |
| `WAHAPEDIA_CA_URL` | `https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/` | Wahapedia URL for Chapter Approved |
| `CHAPTER_APPROVED_ID` | `chapter-approved-2025-26` | Entity ID for database storage |
| `SYNC_KEY` | `wahapedia:chapter-approved-2025-26` | Sync status key |

**Sync logic:**

```typescript
private async needsSync(): Promise<boolean> {
    const status = await this.adapter.getSyncStatus(SYNC_KEY);
    
    if (!status) {
        return true; // No sync status = needs sync
    }
    
    const lastSynced = new Date(status.lastSynced).getTime();
    return Date.now() - lastSynced > STALE_AFTER_MS; // Stale if older than 7 days
}
```

---

## Usage Examples

### Load Chapter Approved via DataContext (recommended)

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Load Chapter Approved (fetches from Wahapedia if stale)
const chapterApproved = await dc.game.chapterApproved;
console.log(`Chapter Approved version: ${chapterApproved.version}`);
console.log(`Missions: ${chapterApproved.missions.length}`);

// List all missions
for (const mission of chapterApproved.missions) {
    console.log(`- ${mission.name} (${mission.type})`);
}
```

### Create a ChapterApprovedDAO directly

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { createWahapediaClient } from '@armoury/shared';
import { ChapterApprovedDAO } from '@armoury/systems';

const adapter = await createAdapter({ platform: Platform.IndexedDB });
const wahapediaClient = createWahapediaClient();

const chapterApprovedDAO = new ChapterApprovedDAO(adapter, wahapediaClient);

// Load Chapter Approved (fetches from Wahapedia if stale)
const chapterApproved = await chapterApprovedDAO.load();
console.log(`Chapter Approved version: ${chapterApproved.version}`);

// Force refresh from Wahapedia
const freshChapterApproved = await chapterApprovedDAO.refresh();
```

### Check if data is stale

```typescript
const adapter = await createAdapter({ platform: Platform.IndexedDB });
const wahapediaClient = createWahapediaClient();

const chapterApprovedDAO = new ChapterApprovedDAO(adapter, wahapediaClient);

// Load cached data
const chapterApproved = await chapterApprovedDAO.load();

// Check sync status
const syncStatus = await adapter.getSyncStatus('wahapedia:chapter-approved-2025-26');
if (syncStatus) {
    const lastSynced = new Date(syncStatus.lastSynced);
    const daysSinceSync = (Date.now() - lastSynced.getTime()) / (24 * 60 * 60 * 1000);
    console.log(`Last synced ${daysSinceSync.toFixed(1)} days ago`);
    
    if (daysSinceSync > 7) {
        console.log('Data is stale, refreshing...');
        await chapterApprovedDAO.refresh();
    }
}
```

### Handle fetch failures gracefully

```typescript
const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

try {
    const chapterApproved = await dc.game.chapterApproved;
    console.log(`Loaded ${chapterApproved.missions.length} missions`);
} catch (error) {
    console.error('Failed to load Chapter Approved:', error);
    
    // Fall back to cached data if available
    const cached = await dc.adapter.get('chapterApproved', 'chapter-approved-2025-26');
    if (cached) {
        console.log('Using stale cached data');
    } else {
        console.log('No cached data available');
    }
}
```

### Concurrent access (memoization)

```typescript
const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Multiple concurrent calls to load() share the same promise
const [ca1, ca2, ca3] = await Promise.all([
    dc.game.chapterApproved,
    dc.game.chapterApproved,
    dc.game.chapterApproved,
]);

// Only one network request is made
console.log(ca1 === ca2 && ca2 === ca3); // true (same instance)
```

---

## Related

- [Wahapedia Client](../../../clients/wahapedia/client.md) — HTTP client for Wahapedia
- [Wh40kGameData](./Wh40kGameData.md) — Game data context with 40 async faction getters
- [system.ts](../system.md) — Wh40k10e system implementation
- [ChapterApprovedParser](../data/ChapterApprovedParser.md) — HTML parser for Chapter Approved data
