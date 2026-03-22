# system.ts

Warhammer 40K 10th Edition game system implementation. Provides entity types, validation rules, data syncing, and hydration for the wh40k10e plugin.

**Source:** `src/shared/systems/wh40k10e/system.ts`

---

## Exports

### `Wh40k10eSystem`

Class implementing `GameSystem` for Warhammer 40K 10th Edition. Provides entity kind definitions, validation rules, schema extensions, hydrators, and factory methods for creating game-specific DAOs.

```typescript
class Wh40k10eSystem implements GameSystem {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly dataSource: DataSourceConfig;
    readonly entityKinds: EntityKindDefinition[];
    readonly validationRules: PluginValidationRule[];
    
    getSchemaExtension(): SchemaExtension;
    getHydrators(): Map<string, EntityHydrator>;
    register(): void;
    createGameContext(adapter: DatabaseAdapter, githubClient: IGitHubClient): GameContextResult;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | System identifier: `"wh40k10e"` |
| `name` | `string` | Display name: `"10th Edition"` |
| `version` | `string` | System version: `"1.0.0"` |
| `dataSource` | `DataSourceConfig` | BSData repository configuration (owner: `"BSData"`, repo: `"wh40k-10e"`) |
| `entityKinds` | `EntityKindDefinition[]` | Array of 13 entity kind definitions (Unit, Weapon, Ability, Stratagem, Detachment, Faction, FactionData, CoreRules, CrusadeRules, Army, ChapterApproved, masterCampaign, matchRecord) |
| `validationRules` | `PluginValidationRule[]` | Array of 11 validation rules (points, strategic reserves, composition, character, detachment, enhancements, faction keyword, leaders, transport, wargear, warlord) |

---

#### `getSchemaExtension()`

Returns the schema extension for wh40k10e database tables. Currently returns an empty object — schema extensions will be populated in Phase 4 after plugin extraction.

```typescript
getSchemaExtension(): SchemaExtension;
```

**Returns:** `SchemaExtension` -- Empty object (placeholder for future schema definitions).

---

#### `getHydrators()`

Returns hydrator functions for entity kinds requiring deserialization. Hydrators convert raw JSON storage into typed model instances.

```typescript
getHydrators(): Map<string, EntityHydrator>;
```

**Returns:** `Map<string, EntityHydrator>` -- Map with three hydrators:
- `"factionData"` → `hydrateFactionData()`
- `"coreRules"` → `hydrateCoreRules()`
- `"chapterApproved"` → `hydrateChapterApproved()`

---

#### `register()`

Registers the wh40k10e system's entity kinds, hydrators, and entity codecs in global registries. Must be called once during application initialization before creating a DataContext.

```typescript
register(): void;
```

**Side effects:**
- Registers all 13 entity kinds via `registerPluginEntity()`
- Registers 3 hydrators via `registerHydrator()`
- Registers 3 entity codecs (factionData, coreRules, chapterApproved) via `registerEntityCodec()`
- Registers schema extension via `registerSchemaExtension()`

---

#### `createGameContext(adapter, githubClient)`

Creates all wh40k10e-specific DAOs and the game data context. Instantiates 40 faction DAOs (37 factions + 3 core DAOs), then wraps them in a `Wh40kGameData` instance for unified access.

```typescript
createGameContext(adapter: DatabaseAdapter, githubClient: IGitHubClient): GameContextResult;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `DatabaseAdapter` | Database adapter for entity storage |
| `githubClient` | `IGitHubClient` | GitHub client for BSData synchronization |

**Returns:** `GameContextResult` -- Object with four properties:
- `armies` -- `Wh40kArmyDAO` instance for army list management
- `campaigns` -- `Wh40kCampaignDAO` instance for campaign tracking
- `matches` -- `Wh40kMatchDAO` instance for match records
- `game` -- `Wh40kGameData` instance with 40 async faction getters
- `sync` -- Function to eagerly sync all reference data

**Faction DAOs created:**
- **Core:** CoreRulesDAO, CrusadeRulesDAO, ChapterApprovedDAO
- **Imperium (15):** Space Marines + 11 chapters, Adeptus Custodes, Adeptus Mechanicus, Adepta Sororitas, Astra Militarum, Imperial Knights, Grey Knights, Agents of the Imperium
- **Chaos (8):** Chaos Space Marines, Chaos Daemons, Chaos Knights, Death Guard, Emperor's Children, Thousand Sons, World Eaters
- **Xenos (6):** Aeldari, Drukhari, Necrons, Orks, T'au Empire, Tyranids, Genestealer Cults, Leagues of Votann
- **Misc (3):** Adeptus Titanicus, Titanicus Traitoris, Unaligned Forces

---

### `EntityKind`

Enum of entity kinds for wh40k10e data access. Maps entity types to adapter store names.

```typescript
enum EntityKind {
    Unit = 'unit',
    Weapon = 'weapon',
    Ability = 'ability',
    Stratagem = 'stratagem',
    Detachment = 'detachment',
    Faction = 'faction',
    FactionData = 'factionData',
    CoreRules = 'coreRules',
    CrusadeRules = 'crusadeRules',
    Army = 'army',
    ChapterApproved = 'chapterApproved',
}
```

---

### `EntityByKind`

Type mapping entity kinds to their TypeScript types. Used for type-safe entity access via adapters.

```typescript
type EntityByKind = {
    [EntityKind.Unit]: Unit;
    [EntityKind.Weapon]: Weapon;
    [EntityKind.Ability]: Ability;
    [EntityKind.Stratagem]: Stratagem;
    [EntityKind.Detachment]: Detachment;
    [EntityKind.Faction]: Faction;
    [EntityKind.FactionData]: FactionData;
    [EntityKind.CoreRules]: CoreRules;
    [EntityKind.CrusadeRules]: CrusadeRules;
    [EntityKind.Army]: Army;
    [EntityKind.ChapterApproved]: ChapterApproved;
};
```

---

### `wh40k10eSystem`

Shared singleton system instance for registry and DataContext usage. This is the recommended instance to use when building a DataContext.

```typescript
const wh40k10eSystem: Wh40k10eSystem;
```

---

### `createWh40k10eSystem()`

Factory function to create a new `Wh40k10eSystem` instance. Use the singleton `wh40k10eSystem` instead unless you need multiple isolated instances for testing.

```typescript
function createWh40k10eSystem(): Wh40k10eSystem;
```

**Returns:** `Wh40k10eSystem` -- A new system instance.

---

## Usage Examples

### Register the system and build a DataContext

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

// Register the system (once during app initialization)
wh40k10eSystem.register();

// Build DataContext with the wh40k10e system
const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// Access game data via async getters
const coreRules = await dc.game.coreRules;
const spaceMarines = await dc.game.spaceMarines;
const bloodAngels = await dc.game.bloodAngels; // includes Space Marines base data

// Access army/campaign/match DAOs
await dc.armies.save(myArmy);
const campaigns = await dc.campaigns.list();

await dc.close();
```

### Manually create game context (advanced)

```typescript
import { createAdapter, Platform } from '@armoury/shared';
import { createGitHubClient } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';

const adapter = await createAdapter({ platform: Platform.SQLite });
const githubClient = createGitHubClient({ token: process.env.GITHUB_TOKEN });

const { armies, campaigns, matches, game, sync } = wh40k10eSystem.createGameContext(adapter, githubClient);

// Eagerly sync all reference data
await sync();

// Access faction data
const necrons = await game.necrons;
console.log(`Necrons has ${necrons.units.length} units`);
```

### Access entity kinds and validation rules

```typescript
import { wh40k10eSystem, EntityKind } from '@armoury/systems';

// List all entity kinds
for (const entityKind of wh40k10eSystem.entityKinds) {
    console.log(`${entityKind.displayName} (${entityKind.kind}): hydration=${entityKind.requiresHydration}`);
}

// List all validation rules
for (const rule of wh40k10eSystem.validationRules) {
    console.log(`${rule.name} (${rule.id})`);
}

// Use EntityKind enum for type-safe adapter access
const adapter = await createAdapter();
const units = await adapter.getAll(EntityKind.Unit);
```

---

## Related

- [Wh40kGameData](./dao/Wh40kGameData.md) — Game data context with 40 async faction getters
- [Wh40kFactionDAO](./dao/Wh40kFactionDAO.md) — Base DAO for faction data syncing
- [CoreRulesDAO](./dao/CoreRulesDAO.md) — Core rules and faction discovery
- [ChapterApprovedDAO](./dao/ChapterApprovedDAO.md) — Chapter Approved mission data
- [DataContext](../../data/DataContext.md) — Primary data access API
