# Wh40kGameData.ts

Game-specific data context for Warhammer 40K 10th Edition. Exposes 40 async property getters (3 core + 37 factions) that load and memoize data from the underlying DAOs.

**Source:** `src/shared/systems/wh40k10e/dao/Wh40kGameData.ts`

---

## Exports

### `Wh40kGameData`

Class providing unified access to all wh40k10e reference data via async getters. Each getter loads data from its corresponding DAO and returns a promise. DAOs internally memoize results to prevent duplicate fetches.

```typescript
class Wh40kGameData {
    constructor(deps: Wh40kGameDataDeps);
    sync(): Promise<void>;
    
    // Core data (3 getters)
    get chapterApproved(): Promise<ChapterApproved>;
    get coreRules(): Promise<CoreRules>;
    get crusadeRules(): Promise<CrusadeRules>;
    
    // Faction data (37 getters)
    get aeldari(): Promise<FactionData>;
    get drukhari(): Promise<FactionData>;
    get chaosSpaceMarines(): Promise<FactionData>;
    get chaosDaemons(): Promise<FactionData>;
    get chaosKnights(): Promise<FactionData>;
    get deathGuard(): Promise<FactionData>;
    get emperorsChildren(): Promise<FactionData>;
    get thousandSons(): Promise<FactionData>;
    get worldEaters(): Promise<FactionData>;
    get adeptaSororitas(): Promise<FactionData>;
    get adeptusCustodes(): Promise<FactionData>;
    get adeptusMechanicus(): Promise<FactionData>;
    get agentsOfTheImperium(): Promise<FactionData>;
    get astraMilitarum(): Promise<FactionData>;
    get imperialKnights(): Promise<FactionData>;
    get greyKnights(): Promise<FactionData>;
    get spaceMarines(): Promise<FactionData>;
    get blackTemplars(): Promise<FactionData>;
    get bloodAngels(): Promise<FactionData>;
    get darkAngels(): Promise<FactionData>;
    get deathwatch(): Promise<FactionData>;
    get spaceWolves(): Promise<FactionData>;
    get ultramarines(): Promise<FactionData>;
    get imperialFists(): Promise<FactionData>;
    get ironHands(): Promise<FactionData>;
    get ravenGuard(): Promise<FactionData>;
    get salamanders(): Promise<FactionData>;
    get whiteScars(): Promise<FactionData>;
    get genestealerCults(): Promise<FactionData>;
    get leaguesOfVotann(): Promise<FactionData>;
    get necrons(): Promise<FactionData>;
    get orks(): Promise<FactionData>;
    get tauEmpire(): Promise<FactionData>;
    get tyranids(): Promise<FactionData>;
    get adeptusTitanicus(): Promise<FactionData>;
    get titanicusTraitoris(): Promise<FactionData>;
    get unalignedForces(): Promise<FactionData>;
}
```

---

#### `constructor(deps)`

Creates a Wh40kGameData context with all 40 faction and core rules DAOs.

| Parameter | Type | Description |
|-----------|------|-------------|
| `deps` | `Wh40kGameDataDeps` | Object containing all 40 DAO instances (3 core + 37 factions) |

**Note:** This constructor is typically called by `Wh40k10eSystem.createGameContext()`. Use `DataContext.builder()` instead of constructing directly.

---

#### `sync()`

Eagerly syncs all reference data DAOs in parallel. Uses `Promise.allSettled` so individual failures (e.g. network down) don't prevent startup. Failed DAOs will retry on next direct access via their getter.

```typescript
async sync(): Promise<void>;
```

**Behavior:**
- Calls `load()` on all 40 DAOs in parallel
- Logs a warning if any DAOs fail to sync (does not throw)
- Returns after all DAOs have either succeeded or failed

**Usage:** Call this once during app initialization to pre-populate the cache. If sync fails, the app can still start — data will be fetched on-demand when accessed via getters.

---

#### Async Getters

All 40 getters follow the same pattern: they return a promise that resolves to the loaded data. DAOs internally memoize results, so repeated calls to the same getter return the cached data without re-fetching.

**Core Data Getters:**

| Getter | Return Type | Description |
|--------|-------------|-------------|
| `chapterApproved` | `Promise<ChapterApproved>` | Chapter Approved 2025-26 mission data from Wahapedia |
| `coreRules` | `Promise<CoreRules>` | Core rules from BSData (Warhammer 40,000.gst) |
| `crusadeRules` | `Promise<CrusadeRules>` | Crusade campaign rules |

**Faction Data Getters:**

All faction getters return `Promise<FactionData>` with units, weapons, abilities, stratagems, detachments, and enhancements.

**Imperium (15 factions):**
- `spaceMarines` — Space Marines base data
- `blackTemplars` — Black Templars (includes Space Marines base)
- `bloodAngels` — Blood Angels (includes Space Marines base)
- `darkAngels` — Dark Angels (includes Space Marines base)
- `deathwatch` — Deathwatch (includes Space Marines base)
- `spaceWolves` — Space Wolves (includes Space Marines base)
- `ultramarines` — Ultramarines (includes Space Marines base)
- `imperialFists` — Imperial Fists (includes Space Marines base)
- `ironHands` — Iron Hands (includes Space Marines base)
- `ravenGuard` — Raven Guard (includes Space Marines base)
- `salamanders` — Salamanders (includes Space Marines base)
- `whiteScars` — White Scars (includes Space Marines base)
- `adeptusCustodes` — Adeptus Custodes
- `adeptusMechanicus` — Adeptus Mechanicus
- `adeptaSororitas` — Adepta Sororitas
- `astraMilitarum` — Astra Militarum
- `imperialKnights` — Imperial Knights
- `greyKnights` — Grey Knights
- `agentsOfTheImperium` — Agents of the Imperium

**Chaos (8 factions):**
- `chaosSpaceMarines` — Chaos Space Marines
- `chaosDaemons` — Chaos Daemons
- `chaosKnights` — Chaos Knights
- `deathGuard` — Death Guard
- `emperorsChildren` — Emperor's Children
- `thousandSons` — Thousand Sons
- `worldEaters` — World Eaters

**Xenos (8 factions):**
- `aeldari` — Aeldari
- `drukhari` — Drukhari
- `necrons` — Necrons
- `orks` — Orks
- `tauEmpire` — T'au Empire
- `tyranids` — Tyranids
- `genestealerCults` — Genestealer Cults
- `leaguesOfVotann` — Leagues of Votann

**Miscellaneous (3 factions):**
- `adeptusTitanicus` — Adeptus Titanicus
- `titanicusTraitoris` — Titanicus Traitoris
- `unalignedForces` — Unaligned Forces

---

### `Wh40kGameDataDeps`

Interface defining the dependencies required to construct a `Wh40kGameData` instance. Contains all 40 DAO instances (3 core + 37 factions).

```typescript
interface Wh40kGameDataDeps {
    chapterApprovedDAO: ChapterApprovedDAO;
    coreRulesDAO: CoreRulesDAO;
    crusadeRulesDAO: CrusadeRulesDAO;
    aeldariDAO: AeldariDAO;
    drukhariDAO: DrukhariDAO;
    // ... 32 more faction DAOs
}
```

---

## Usage Examples

### Access via DataContext (recommended)

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Eagerly sync all reference data (optional)
await dc.game.sync();

// Access core data
const coreRules = await dc.game.coreRules;
console.log(`Core rules version: ${coreRules.version}`);

// Access faction data
const necrons = await dc.game.necrons;
console.log(`Necrons has ${necrons.units.length} units`);

// Access chapter data (includes Space Marines base)
const bloodAngels = await dc.game.bloodAngels;
console.log(`Blood Angels has ${bloodAngels.units.length} units (includes SM base)`);
```

### Lazy loading pattern

```typescript
// Don't call sync() — data is fetched on-demand
const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// First access fetches from BSData/Wahapedia
const spaceMarines = await dc.game.spaceMarines; // network request

// Second access returns cached data
const spaceMarines2 = await dc.game.spaceMarines; // instant
```

### Eager loading pattern

```typescript
const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Pre-populate cache during app initialization
await dc.game.sync();

// All subsequent accesses are instant
const necrons = await dc.game.necrons; // instant
const tyranids = await dc.game.tyranids; // instant
```

### Handle sync failures gracefully

```typescript
const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Sync failures are logged but don't throw
await dc.game.sync(); // logs warning if any DAOs fail

// Failed DAOs will retry on next access
try {
    const necrons = await dc.game.necrons;
} catch (error) {
    console.error('Failed to load Necrons data:', error);
    // Show user-friendly error message
}
```

### Access Chapter Approved missions

```typescript
const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

const chapterApproved = await dc.game.chapterApproved;
console.log(`Chapter Approved version: ${chapterApproved.version}`);
console.log(`Missions: ${chapterApproved.missions.length}`);

for (const mission of chapterApproved.missions) {
    console.log(`- ${mission.name} (${mission.type})`);
}
```

---

## Related

- [system.ts](../system.md) — Wh40k10e system implementation
- [Wh40kFactionDAO](./Wh40kFactionDAO.md) — Base DAO for faction data syncing
- [CoreRulesDAO](./CoreRulesDAO.md) — Core rules and faction discovery
- [ChapterApprovedDAO](./ChapterApprovedDAO.md) — Chapter Approved mission data
- [DataContext](../../../data/DataContext.md) — Primary data access API
