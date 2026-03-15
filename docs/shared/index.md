# @armoury/shared

Main barrel export for the shared core library.

**Source:** `src/shared/index.ts`

## Overview

`@armoury/shared` is the core package of the Armoury monorepo. It provides cross-platform data management, community data XML parsing, GitHub client integration, domain types, validation, and error handling for tabletop game army data. All public APIs are re-exported from this single entry point.

## Exports by Category

### Data Layer

Database adapters, the adapter factory, and the high-level data manager.

| Export                 | Kind     | Description                                              |
| ---------------------- | -------- | -------------------------------------------------------- |
| `DataManager`          | class    | App-level and game-specific data manager facade          |
| `DataManagerBuilder`   | class    | Builder for constructing a DataManager with plugin + adapter |
| `PluginRegistry`       | object   | Global registry for game system plugins                  |
| `Repository`           | type     | Generic CRUD repository interface                        |
| `SocialRepository`     | type     | Repository with status-based friend filtering            |
| `GameDataAccessor`     | type     | Accessor for game-specific entities via EntityKind       |
| `CampaignTypeOf`       | type     | Extracts campaign type from a plugin                     |
| `MatchTypeOf`          | type     | Extracts match type from a plugin                        |
| `GameEntityMapOf`      | type     | Extracts game entity map from a plugin                   |
| `SQLiteAdapter`        | class    | SQLite database adapter (server / React Native)          |
| `IndexedDBAdapter`     | class    | IndexedDB database adapter (web)                         |
| `DSQLAdapter`          | class    | DSQL (Aurora) database adapter (edge / serverless)       |
| `DSQLAdapterConfig`    | type     | Configuration for `DSQLAdapter`                          |
| `Platform`             | enum     | Platform discriminator (`SQLite`, `IndexedDB`, `DSQL`)   |
| `DatabaseAdapter`      | type     | Common adapter interface implemented by all adapters     |
| `EntityType`           | type     | Union of supported entity type strings                   |
| `EntityMap`            | type     | Maps entity type strings to their TypeScript interfaces  |
| `createAdapter`        | function | Factory that creates and initializes a database adapter  |
| `AdapterFactoryConfig` | type     | Configuration for `createAdapter`                        |
| `GameSystemPlugin`     | type     | Core plugin interface with phantom types                 |
| `EntityKindDefinition` | type     | Definition of a plugin entity kind                       |
| `DataSourceConfig`     | type     | Configuration for a game system's data source            |

### GitHub Client

Client for fetching community data files from GitHub repositories.

| Export               | Kind     | Description                                      |
| -------------------- | -------- | ------------------------------------------------ |
| `GitHubClient`       | class    | GitHub API client implementation                 |
| `createGitHubClient` | function | Factory for creating a configured `GitHubClient` |
| `IGitHubClient`      | type     | GitHub client interface                          |
| `GitHubClientConfig` | type     | Configuration (base URL, auth token, etc.)       |
| `GitHubFileInfo`     | type     | Metadata for a file fetched from GitHub          |

### Types -- Domain Entities

Core domain interfaces for tabletop game objects.

| Export           | Kind | Description                                     |
| ---------------- | ---- | ----------------------------------------------- |
| `Entity`         | type | Base interface with `id`, `name`, source fields |
| `Unit`           | type | Unit datasheet with characteristics and weapons |
| `Weapon`         | type | Union of `RangedWeapon \| MeleeWeapon`          |
| `RangedWeapon`   | type | Ranged weapon profile with range                |
| `MeleeWeapon`    | type | Melee weapon profile                            |
| `Ability`        | type | Shared ability definition                       |
| `Stratagem`      | type | Stratagem with CP cost and phase                |
| `Detachment`     | type | Detachment rules with stratagems/enhancements   |
| `Enhancement`    | type | Character enhancement                           |
| `Faction`        | type | Faction with catalogue file reference           |
| `Keyword`        | type | Keyword tag for units                           |
| `FileSyncStatus` | type | Sync state for a data file                      |
| `SyncResult`     | type | Result of a sync operation                      |

### Types -- BattleScribe XML

Typed representations of parsed BattleScribe XML structures.

| Export                       | Kind | Description                                 |
| ---------------------------- | ---- | ------------------------------------------- |
| `BattleScribeGameSystem`     | type | Parsed `.gst` game system root              |
| `BattleScribeCatalogue`      | type | Parsed `.cat` catalogue root                |
| `BattleScribeSelectionEntry` | type | Unit or option selection entry              |
| `BattleScribeProfile`        | type | Profile (unit stats, weapon stats, ability) |

### Models

Structured data models for app-level features.

| Export                     | Kind | Description                                |
| -------------------------- | ---- | ------------------------------------------ |
| `UnitComposition`          | type | Unit composition (model count, points)     |
| `WargearOption`            | type | Wargear option for a unit                  |
| `WargearChoice`            | type | Individual wargear choice                  |
| `WargearAbility`           | type | Ability granted by wargear                 |
| `LeaderInfo`               | type | Leader attachment info                     |
| `UnitAbility`              | type | Ability specific to a unit                 |
| `Account`                  | type | User account                               |
| `LinkedProvider`           | type | Linked auth provider                       |
| `UserPreferences`          | type | User preferences                           |
| `Army`                     | type | Army list definition                       |
| `ArmyUnit`                 | type | Unit within an army list                   |
| `ArmyModelConfig`          | type | Model configuration in an army unit        |
| `ArmyModelWeaponSelection` | type | Weapon selection for a model               |
| `ArmyWargearSelection`     | type | Wargear selection for an army unit         |
| `ArmyEnhancement`          | type | Enhancement applied in an army             |
| `ArmyVersion`              | type | Army list version info                     |
| `BattleSize`               | type | Battle size (Incursion, Strike Force, etc) |
| `Friend`                   | type | Friend relationship                        |
| `FriendStatus`             | type | Friend request status                      |
| `MatchRecord`              | type | Recorded match data                        |
| `RoundScore`               | type | Score for a single round                   |
| `ModelHPState`             | type | HP tracking state for a model              |
| `ModelHPEntry`             | type | Individual HP entry                        |
| `GameTracker`              | type | Live game state tracker                    |
| `GamePhase`                | type | Current game phase                         |
| `PlayerTurn`               | type | Current player turn                        |
| `MatchResult`              | type | Final match result                         |
| `MasterCampaign`           | type | Campaign definition (master copy)          |
| `ParticipantCampaign`      | type | Campaign from participant perspective      |
| `CampaignPhase`            | type | Campaign phase definition                  |
| `CampaignNarrative`        | type | Campaign narrative entry                   |
| `CampaignRanking`          | type | Campaign ranking entry                     |
| `CampaignType`             | type | Campaign type discriminator                |
| `CampaignStatus`           | type | Campaign lifecycle status                  |
| `CrusadeBattleHonour`      | type | Crusade battle honour                      |
| `CrusadeBattleScar`        | type | Crusade battle scar                        |
| `CrusadeUnitProgression`   | type | Crusade unit progression data              |
| `CrusadeParticipantData`   | type | Crusade participant tracking               |
| `CrusadeRules`             | type | Crusade ruleset definition                 |
| `CrusadeUnitRank`          | type | Unit rank in crusade                       |
| `RankThreshold`            | type | XP threshold for rank                      |
| `CrusadeRequisition`       | type | Crusade requisition                        |
| `BattleHonourType`         | type | Battle honour type                         |
| `BattleHonourDefinition`   | type | Battle honour definition                   |
| `BattleScarDefinition`     | type | Battle scar definition                     |
| `AgendaCategory`           | type | Agenda category                            |
| `CrusadeAgenda`            | type | Crusade agenda                             |
| `XPGainRule`               | type | XP gain rule                               |
| `BlackstoneUpgrade`        | type | Blackstone upgrade                         |
| `CrusadeRuleSource`        | type | Source reference for crusade rules         |

### Validation

Army validation engine, rules, constraints, and effect types. All validation exports are re-exported from `@armoury/validation` via wildcard.

| Export                                            | Kind     | Description                                           |
| ------------------------------------------------- | -------- | ----------------------------------------------------- |
| `validateArmy`                                    | function | Validates an army list against game system rules      |
| Validation types, constraints, effects, and rules | various  | Full validation system (see `src/shared/validation/`) |

### Type Guards

Runtime type narrowing utilities.

| Export           | Kind     | Description                        |
| ---------------- | -------- | ---------------------------------- |
| `isRangedWeapon` | function | Narrows `Weapon` to `RangedWeapon` |
| `isMeleeWeapon`  | function | Narrows `Weapon` to `MeleeWeapon`  |

### Errors

Custom error classes and type guard functions for the data layer.

| Export               | Kind     | Description                          |
| -------------------- | -------- | ------------------------------------ |
| `DataLayerError`     | class    | Base error for all data layer errors |
| `GitHubApiError`     | class    | GitHub API request failure           |
| `RateLimitError`     | class    | GitHub rate limit exceeded           |
| `NetworkError`       | class    | Network connectivity failure         |
| `XmlParseError`      | class    | XML parsing failure                  |
| `DatabaseError`      | class    | Database operation failure           |
| `isDataLayerError`   | function | Type guard for `DataLayerError`      |
| `isGitHubApiError`   | function | Type guard for `GitHubApiError`      |
| `isRateLimitError`   | function | Type guard for `RateLimitError`      |
| `isNetworkError`     | function | Type guard for `NetworkError`        |
| `isXmlParseError`    | function | Type guard for `XmlParseError`       |
| `isDatabaseError`    | function | Type guard for `DatabaseError`       |
| `DataLayerErrorCode` | type     | Error code string union              |

### XML Parser

BattleScribe XML parsing and data extraction functions.

| Export             | Kind     | Description                                         |
| ------------------ | -------- | --------------------------------------------------- |
| `parseGameSystem`  | function | Parses a `.gst` game system XML string              |
| `parseCatalogue`   | function | Parses a `.cat` catalogue XML string                |
| `extractUnits`     | function | Extracts unit definitions from a parsed catalogue   |
| `extractWeapons`   | function | Extracts weapon definitions from a parsed catalogue |
| `extractAbilities` | function | Extracts shared abilities from a parsed catalogue   |

## Usage Example

### DataContext (primary API)

```typescript
import { DataContext, Platform } from '@armoury/shared';
import { wh40k10eSystem } from '@armoury/systems';
import type { Wh40kGameData } from '@armoury/systems';

const dc = await DataContextBuilder.builder<Wh40kGameData>()
    .system(wh40k10eSystem)
    .platform(Platform.IndexedDB)
    .build();

// App-level DAOs
const account = await dc.accounts.get('user-1');
const friends = await dc.social.listByStatus('accepted');

// Game-specific DAOs
await dc.armies.save(myArmy);
const campaigns = await dc.campaigns.list();

// Game data (async getters, auto-synced from BSData)
const coreRules = await dc.game.coreRules;
const spaceMarines = await dc.game.spaceMarines;
const bloodAngels = await dc.game.bloodAngels;

await dc.close();
```

### DataManager (legacy)

> The DataManager API is retained for backward compatibility. New code should use DataContext above.

```typescript
import { DataManager, PluginRegistry, Platform } from '@armoury/shared';
import { wh40k10ePlugin, EntityKind } from '@armoury/systems';

PluginRegistry.register(wh40k10ePlugin);

const dm = await DataManager.builder()
    .plugin(wh40k10ePlugin)
    .platform(Platform.IndexedDB)
    .build();

await dm.close();
```

### XML Parsing and Validation

```typescript
import {
    parseCatalogue,
    extractUnits,
    extractWeapons,
    extractAbilities,
    isRangedWeapon,
    isXmlParseError,
    validateArmy,
} from '@armoury/shared';

const xml = await fetchCatalogueXml(); // your fetch logic
try {
    const catalogue = parseCatalogue(xml);
    const units = extractUnits(catalogue, 'SpaceMarines.cat', 'sha256...');
    const weapons = extractWeapons(catalogue, 'SpaceMarines.cat', 'sha256...');
    const ranged = weapons.filter(isRangedWeapon);
    const result = validateArmy(myArmy);
} catch (error) {
    if (isXmlParseError(error)) {
        console.error('Failed to parse catalogue:', error.message);
    }
}
```
