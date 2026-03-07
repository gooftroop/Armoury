# DataContext

Primary facade for app-level and game-specific data access. Provides a unified interface to core DAOs (accounts, friends) and game-specific DAOs (armies, campaigns, matches) with auto-syncing game data.

**Source:** `src/shared/data/DataContext.ts`

---

## Exports

### `DataContext<TGameData>`

Class implementing `DataContextShape<TGameData>` that wires together core DAOs, game-specific DAOs, and a game data context. Constructed via the builder pattern using `DataContext.builder()`.

```typescript
class DataContext<TGameData = unknown> implements DataContextShape<TGameData> {
    readonly accounts: AccountDAO;
    readonly social: FriendDAO;
    readonly armies: ArmyDAO;
    readonly campaigns: CampaignDAO;
    readonly matches: MatchDAO;
    readonly game: TGameData;
    
    constructor(
        adapter: DatabaseAdapter,
        gameSystem: GameSystem,
        githubClient: IGitHubClient | null,
        gameContext?: GameContextResult<TGameData>
    );
    
    close(): Promise<void>;
    static builder<TGameData = unknown>(): DataContextBuilder<TGameData>;
}
```

---

## Properties

### `accounts`

**Type:** `AccountDAO`

DAO for user account data. Provides CRUD operations for `Account` entities.

---

### `social`

**Type:** `FriendDAO`

DAO for social/friend data. Provides CRUD operations for `Friend` entities plus `listByStatus()` filtering.

---

### `armies`

**Type:** `ArmyDAO`

Game-specific DAO for army list management. Implementation provided by the game system's `createGameContext()` method. Throws if accessed before a game system is registered.

---

### `campaigns`

**Type:** `CampaignDAO`

Game-specific DAO for campaign management. Implementation provided by the game system's `createGameContext()` method. Throws if accessed before a game system is registered.

---

### `matches`

**Type:** `MatchDAO`

Game-specific DAO for match/game record management. Implementation provided by the game system's `createGameContext()` method. Throws if accessed before a game system is registered.

---

### `game`

**Type:** `TGameData`

Game-specific data context providing access to faction data, unit catalogs, and other game system resources. The concrete type is determined by the game system plugin (e.g., `Wh40kGameData` for Warhammer 40k 10th Edition). Throws if accessed before a game system is registered.

---

## Methods

### `constructor(adapter, gameSystem, githubClient, gameContext?)`

Creates a new `DataContext` instance. **Not intended for direct use** — use `DataContext.builder()` instead.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `adapter` | `DatabaseAdapter` | Yes | Database adapter used by DAOs. |
| `gameSystem` | `GameSystem` | Yes | Game system descriptor. |
| `githubClient` | `IGitHubClient \| null` | Yes | GitHub client for remote data access (or null). |
| `gameContext` | `GameContextResult<TGameData>` | No | Game-specific DAO wiring from the system's `createGameContext()`. |

---

### `close()`

Closes the underlying database adapter connection. Always call this when done with the DataContext to release resources.

```typescript
async close(): Promise<void>;
```

**Returns:** `Promise<void>` — Resolves when the adapter connection is closed.

---

### `builder()` (static)

Creates a new `DataContextBuilder` for fluent configuration. This is the recommended way to create a `DataContext`.

```typescript
static builder<TGameData = unknown>(): DataContextBuilder<TGameData>;
```

**Returns:** `DataContextBuilder<TGameData>` — A builder instance for configuring and creating a DataContext.

---

## Usage Examples

### Basic setup with builder pattern

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';
import type { Wh40kGameData } from '@shared/systems/wh40k10e/dao/Wh40kGameData.js';

// Build DataContext with game system + platform
const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Access core DAOs
const account = await dc.accounts.get('user-1');
const friends = await dc.social.listByStatus('accepted');

// Access game-specific DAOs
await dc.armies.save(myArmy);
const campaigns = await dc.campaigns.list();

// Access game data (async getters, auto-synced from BSData)
const coreRules = await dc.game.coreRules;
const spaceMarines = await dc.game.spaceMarines;

// Clean up when done
await dc.close();
```

### With GitHub client for authenticated access

```typescript
import { DataContext, Platform, createGitHubClient } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';
import type { Wh40kGameData } from '@shared/systems/wh40k10e/dao/Wh40kGameData.js';

const githubClient = createGitHubClient({
    token: process.env.GITHUB_TOKEN,
});

const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .github(githubClient)
    .build();

// Game data will use authenticated GitHub client for BSData sync
const bloodAngels = await dc.game.bloodAngels;

await dc.close();
```

### Using with a pre-initialized adapter

```typescript
import { DataContext, createAdapter, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';
import type { Wh40kGameData } from '@shared/systems/wh40k10e/dao/Wh40kGameData.js';

// Create and initialize adapter separately
const adapter = await createAdapter({ platform: Platform.SQLite });

const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .adapter(adapter)
    .build();

// Use DataContext...
await dc.close();
```

---

## Related

- [DataContextBuilder](./DataContextBuilder.md) — Builder for creating DataContext instances
- [AccountDAO](./dao/AccountDAO.md) — Account data access object
- [FriendDAO](./dao/FriendDAO.md) — Friend data access object
- [BaseDAO](./dao/BaseDAO.md) — Abstract base class for DAOs
