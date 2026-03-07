# Game Systems

Game-system-specific logic. Each system implements `GameSystem` and provides DAOs, data models, validation rules, and schema extensions.

**Source:** `src/shared/systems/`

## Contents

| Path | Description |
|------|-------------|
| `wh40k10e/` | Warhammer 40K 10th Edition (reference implementation) |

## GameSystem Interface

Defined in `src/shared/types/game-system-v2.ts`. Each system must provide:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (e.g., `'wh40k10e'`) |
| `name` | `string` | Display name (e.g., `'10th Edition'`) |
| `version` | `string` | System version |
| `dataSource` | `DataSourceConfig` | Community data source config |
| `entityKinds` | `EntityKindDefinition[]` | Entity kinds this system registers |
| `validationRules` | `PluginValidationRule[]` | Army validation rules |

| Method | Returns | Description |
|--------|---------|-------------|
| `getHydrators()` | `Map<string, EntityHydrator>` | Deserializers for complex entities |
| `getSchemaExtension()` | `SchemaExtension` | Database table definitions |
| `register()` | `void \| Promise<void>` | Registers system in global registries |

## DAO Architecture

Each game system provides DAOs that handle data access, sync, and business logic:

- **BSDataBaseDAO** — Abstract base for BSData-backed entities with memoized load/sync
- **Game-specific DAOs** — Extend BSDataBaseDAO (e.g., `Wh40kFactionDAO`, `CoreRulesDAO`)
- **Faction DAOs** — One per faction, handling multi-file sync and catalogue merging
- **CRUD DAOs** — For user data like armies, campaigns, matches (extend BaseDAO)
- **GameData class** — Exposes async property getters for all game data (e.g., `dc.game.spaceMarines`)

## DataContext Setup

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@shared/systems/wh40k10e/system.js';
import type { Wh40kGameData } from '@shared/systems/wh40k10e/dao/Wh40kGameData.js';

const dc = await DataContext.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();
```

## Adding a New Game System

1. Create directory at `src/shared/systems/<id>/`
2. Implement `GameSystem` interface (`id`, `name`, `version`, `dataSource`, `entityKinds`, `validationRules`, `getHydrators`, `getSchemaExtension`, `register`)
3. Create DAO classes extending `BSDataBaseDAO` or `BaseDAO`
4. Create a `GameData` class with async property getters for each data source
5. Wire the system in `DataContextBuilder` (add a case for the system id)
6. Export a singleton system instance

> **Re-evaluation Note**: Once AOS (age-of-sigmar-4th) and Horus Heresy (horus-heresy-3rd-edition) systems are added, re-evaluate campaign and match data structures to identify data that is common/unique to the app vs system-specific. Extract shared data into core, keep game-specific data in systems (inheritance pattern).
