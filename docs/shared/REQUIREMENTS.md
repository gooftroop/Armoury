# Armoury Data Architecture & Data Flow Requirements

**Purpose:** Define the product requirements for the data architecture and data flow across Armoury's core shared library (`@armoury/shared`). This document specifies what the data layer must support — storage backends, sync pipelines, plugin extensibility, validation, and cross-platform data access — without prescribing implementation details.

**Scope:** The `@armoury/shared` package and its consumers (web, mobile, server). Game-agnostic core with plugin-provided game-specific data.

**Audience:** Backend engineers, data architects, plugin authors, AI agents implementing data layer features.

**Related Documents:**
- `AGENTS.md` (architecture overview and conventions)
- `docs/design/REQUIREMENTS.md` (UI feature requirements referencing data models)
- `docs/design/MATCH_EXPERIENCE.md` (match data sync and state requirements)
- `docs/shared/index.md` (shared library API reference)
- `docs/shared/data/` (adapter and DAO documentation)
- `docs/shared/validation/` (validation engine documentation)
- `docs/services/` (backend service documentation)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Architecture Requirements](#2-data-architecture-requirements)
3. [Schema System Requirements](#3-schema-system-requirements)
4. [Plugin Architecture Requirements](#4-plugin-architecture-requirements)
5. [Entity Type System Requirements](#5-entity-type-system-requirements)
6. [DAO Pattern Requirements](#6-dao-pattern-requirements)
7. [Data Sync Requirements](#7-data-sync-requirements)
8. [Core Data Model Requirements](#8-core-data-model-requirements)
9. [Game-Specific Data Model Requirements](#9-game-specific-data-model-requirements)
10. [Validation Engine Requirements](#10-validation-engine-requirements)
11. [Error Handling Requirements](#11-error-handling-requirements)
12. [Backend Service Requirements](#12-backend-service-requirements)
13. [Cross-Platform Data Flow Requirements](#13-cross-platform-data-flow-requirements)
14. [Performance Requirements](#14-performance-requirements)
15. [Security Requirements](#15-security-requirements)
16. [Future Extensibility Requirements](#16-future-extensibility-requirements)

---

## 1. Overview

Armoury's data layer provides a unified, cross-platform abstraction for persisting, syncing, and querying tabletop game data. The architecture must support three deployment targets (web browser, mobile device, serverless edge) through a single set of interfaces, while allowing game system plugins to extend the schema, entity types, and validation rules without modifying core code.

Primary objectives:
- Provide a single `DataContext` facade for all data access across platforms
- Support three database backends transparently (SQLite, IndexedDB, Aurora DSQL)
- Enable game system plugins to register entities, schemas, and validation rules at runtime
- Sync community game data from GitHub-hosted BattleScribe repositories
- Validate army composition against plugin-provided rules
- Maintain offline capability for core army-building workflows

---

## 2. Data Architecture Requirements

### 2.1 DataContext Facade

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DA-001 | DataContext must serve as the single entry point for all data access operations | Critical | Consumers never interact with adapters directly |
| DA-002 | DataContext must expose core DAOs: accounts (user account CRUD) and social (friend relationship CRUD) | Critical | Game-agnostic, always available |
| DA-003 | DataContext must expose game-specific DAOs: armies, campaigns, and matches | Critical | Provided by game system plugin via `createGameContext()` |
| DA-004 | DataContext must expose a typed game data context accessor for plugin-specific data (e.g., faction DAOs, rules DAOs) | Critical | Generic type parameter `TGameData` |
| DA-005 | DataContext must provide a `close()` method to release underlying database connections | Critical | Prevents resource leaks |
| DA-006 | Game-specific DAOs must throw a descriptive error if accessed before the game system provides implementations | High | Placeholder DAOs until plugin wires real implementations |
| DA-007 | Game data context must throw a descriptive error on property access if the game system has not provided a data context | High | Uses Proxy for lazy error reporting |

### 2.2 DataContext Builder

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| `DataContextBuilder.builder<TGameData>()` |
| DA-011 | Builder must accept a game system via `.system()` | Critical | Required; builder must reject `.build()` without it |
| DA-012 | Builder must accept a target platform via `.platform()` | High | Determines which adapter to create |
| DA-013 | Builder must accept a pre-built adapter instance via `.adapter()` as an alternative to platform | High | For testing and advanced use cases |
| DA-014 | Builder must accept an optional GitHub client via `.github()` | High | For BSData sync; stub created if omitted |
| DA-015 | Builder must call `gameSystem.register()` before adapter initialization | Critical | Ensures plugin schemas and codecs are registered |
| DA-016 | Builder must create and initialize the adapter if none provided | Critical | Via `createAdapter()` factory |
| DA-017 | Builder must call `gameSystem.createGameContext()` to obtain game-specific DAOs and data context | Critical | Wires plugin DAOs into DataContext |
| DA-018 | Builder must execute the game context's `sync()` function (if provided) before returning | High | Eager sync of reference data on first build |
| DA-019 | Either `.platform()` or `.adapter()` must be provided; builder must reject `.build()` if neither is set | Critical | Prevents ambiguous configuration |

### 2.3 Database Adapter Interface

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DA-020 | All database adapters must implement a common `DatabaseAdapter` interface | Critical | Platform-agnostic CRUD contract |
| DA-021 | Adapters must support `initialize()` for schema creation and connection setup | Critical | Must be called before any operations |
| DA-022 | Adapters must support `close()` for connection cleanup | Critical | |
| DA-023 | Adapters must support `get<T>(store, id)` for single-entity retrieval by primary key | Critical | Returns `null` if not found |
| DA-024 | Adapters must support `getAll<T>(store, options?)` for retrieving all entities of a type | Critical | With optional pagination and sorting |
| DA-025 | Adapters must support `getByField<T>(store, field, value, options?)` for field-equality queries | Critical | E.g., "all units with factionId=X" |
| DA-026 | Adapters must support `count<T>(store, field?, value?)` for entity counting with optional filter | High | For pagination UIs and statistics |
| DA-027 | Adapters must support `put<T>(store, entity)` for upsert (insert or replace by ID) | Critical | |
| DA-028 | Adapters must support `putMany<T>(store, entities)` for batch upsert | Critical | More efficient than repeated single puts |
| DA-029 | Adapters must support `delete<T>(store, id)` for single-entity removal | Critical | Must not throw if entity doesn't exist |
| DA-030 | Adapters must support `deleteAll<T>(store)` for clearing an entire entity store | High | Destructive; used in sync operations |
| DA-031 | Adapters must support `deleteByField<T>(store, field, value)` for filtered deletion | High | E.g., "delete all units for faction X" |
| DA-032 | Adapters must support `transaction<R>(fn)` for atomic multi-step operations | Critical | Rollback on error |
| DA-033 | Adapters must support sync status tracking: `getSyncStatus(fileKey)`, `setSyncStatus(fileKey, sha, etag?)`, `deleteSyncStatus(fileKey)` | Critical | SHA-based change detection for BSData files |
| DA-034 | Query options must support `limit`, `offset`, `orderBy` (entity field key), and `direction` (`asc`/`desc`) | High | For paginated and sorted queries |
| DA-035 | Adapters must expose a `platform` property identifying their backend (SQLite, IndexedDB, or AuroraDSQL) | High | For runtime platform detection |

### 2.4 Platform Support

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DA-040 | The system must support SQLite as a storage backend for mobile applications | Critical | Via expo-sqlite |
| DA-041 | The system must support IndexedDB as a storage backend for web applications | Critical | Via Dexie |
| DA-042 | The system must support Aurora DSQL as a storage backend for server/serverless applications | Critical | Via Drizzle ORM + pg driver |
| DA-043 | A `Platform` enum must provide type-safe platform discrimination: `SQLite`, `IndexedDB`, `AuroraDSQL` | Critical | No raw strings |
| DA-044 | All three adapters must implement identical behavior for the `DatabaseAdapter` interface | Critical | Platform parity for all CRUD and sync operations |

### 2.5 Adapter Factory

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DA-050 | A factory function must create and fully initialize adapters from configuration | Critical | `createAdapter(config?)` |
| DA-051 | The factory must auto-detect the platform when none is specified | High | IndexedDB if `window.indexedDB` exists; SQLite otherwise |
| DA-052 | The factory must support explicit platform selection via configuration | Critical | Override auto-detection |
| DA-053 | The factory must support custom database names | High | Default: `'armoury'` |
| DA-054 | The factory must require DSQL-specific configuration (cluster endpoint, region) when Aurora DSQL is selected | Critical | Fail-fast if missing |
| DA-055 | The factory must dynamically import the DSQL adapter module to avoid bundling server dependencies in client builds | High | Tree-shaking for web/mobile |
| DA-056 | The factory must call `adapter.initialize()` before returning | Critical | Caller receives a ready-to-use adapter |

---

## 3. Schema System Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SCH-001 | Database schemas must be composable: core schema plus zero or more plugin-provided extensions merged at runtime | Critical | Enables plugins without modifying core |
| SCH-002 | A global schema registry must accept extensions from core and plugins via `registerSchemaExtension()` | Critical | Called at module load (core) and during `system.register()` (plugins) |
| SCH-003 | Merge functions must combine all registered extensions into platform-specific schemas: `getMergedSQLiteSchema()`, `getMergedIndexedDBSchema()`, `getMergedDSQLSchema()` | Critical | Called by adapters during `initialize()` |
| SCH-004 | Core schema must auto-register at module load time without explicit consumer action | Critical | Ensures core tables always exist |
| SCH-005 | Each schema extension must optionally provide definitions for all three platforms (SQLite, IndexedDB, DSQL) | High | Plugins should support all platforms for full cross-platform coverage |
| SCH-006 | SQLite schema extensions must provide: CREATE TABLE SQL, store-to-table name mapping, and column name sets (for SQL injection prevention in ORDER BY) | Critical | `SQLiteSchemaExtension` |
| SCH-007 | IndexedDB schema extensions must provide: Dexie store definitions (index strings) and store-to-table name mapping | Critical | `IndexedDBSchemaExtension` |
| SCH-008 | DSQL schema extensions must provide: Drizzle pgTable definitions and store-to-table reference mapping | Critical | `DSQLSchemaExtension` |
| SCH-009 | The schema registry must support clearing for test isolation | High | `clearSchemaExtensions()` |
| SCH-010 | Core tables must include: factions, sync_status, accounts, friends | Critical | With appropriate indexes |

---

## 4. Plugin Architecture Requirements

### 4.1 Game System Interface

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| PLG-001 | Game systems must implement a `GameSystem` interface providing identity (id, name, version) | Critical | E.g., `'wh40k10e'`, `'10th Edition'`, `'1.0.0'` |
| PLG-002 | Game systems must declare a data source configuration specifying community data repository location | Critical | `DataSourceConfig` with GitHub owner/repo/coreFile |
| PLG-003 | Game systems must declare their entity kinds with kind key, display name, and hydration requirement flag | Critical | `EntityKindDefinition[]` |
| PLG-004 | Game systems must provide validation rules for army construction checking | Critical | `PluginValidationRule[]` with id, name, validate function |
| PLG-005 | Game systems must provide hydrator functions for entity types requiring special deserialization from storage | Critical | `getHydrators()` returns `Map<string, EntityHydrator>` |
| PLG-006 | Game systems must provide schema extensions for their database tables | Critical | `getSchemaExtension()` returns `SchemaExtension` |
| PLG-007 | Game systems must implement a `register()` method that registers entity kinds, hydrators, codecs, and schemas in global registries | Critical | Called by DataContextBuilder before adapter initialization |
| PLG-008 | Game systems must implement `createGameContext(adapter, githubClient)` returning game-specific DAOs and data context | Critical | Returns `GameContextResult` |
| PLG-009 | `GameContextResult` must optionally include a `sync()` function for eager reference data synchronization | High | Called by builder after adapter init |

### 4.2 Plugin Registration

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| PLG-010 | Plugins must register entity kinds in the global plugin entity registry via `registerPluginEntity()` | Critical | Makes entity types available to adapters |
| PLG-011 | Plugins must register hydrators in the global hydration registry via `registerHydrator()` | Critical | For entities requiring deserialization |
| PLG-012 | Plugins must register entity codecs in the global codec registry via `registerEntityCodec()` | Critical | For serialize/hydrate pairs |
| PLG-013 | Plugins must register schema extensions in the global schema registry via `registerSchemaExtension()` | Critical | For game-specific tables |
| PLG-014 | Registration must be idempotent — multiple calls with the same data must not corrupt state | High | Supports re-initialization scenarios |

### 4.3 Reference Implementation (wh40k10e)

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| PLG-020 | The Warhammer 40K 10th Edition plugin must serve as the reference implementation for the plugin architecture | Critical | First plugin; validates the interface design |
| PLG-021 | The wh40k10e plugin must register entity kinds: Unit, Weapon, Ability, Stratagem, Detachment, Faction, FactionData, CoreRules, CrusadeRules, Army, ChapterApproved, MasterCampaign, MatchRecord | Critical | Complete entity coverage |
| PLG-022 | The wh40k10e plugin must provide hydrators for FactionData, CoreRules, and ChapterApproved | Critical | Complex model deserialization |
| PLG-023 | The wh40k10e plugin must provide entity codecs for the same three model types | Critical | Serialize/hydrate pairs |
| PLG-024 | The wh40k10e plugin must provide 11 validation rules: points, strategic-reserves, composition, character, detachment, enhancements, faction-keyword, leaders, transport, wargear, warlord | Critical | Complete army construction validation |
| PLG-025 | The wh40k10e plugin must create faction-specific DAOs for all supported factions (38+) | Critical | One DAO per faction for lazy BSData loading |
| PLG-026 | The wh40k10e plugin must provide a `Wh40kGameData` class wrapping all faction DAOs and rules DAOs with lazy-loading async getters | Critical | `dc.game.spaceMarines`, `dc.game.coreRules`, etc. |
| PLG-027 | The wh40k10e plugin must expose a singleton system instance for convenience | High | `wh40k10eSystem` |

---

## 5. Entity Type System Requirements

### 5.1 Type Maps

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| ENT-001 | A `CoreEntityMap` must define type-safe mappings from core entity type strings to their TypeScript interfaces | Critical | `faction -> Faction`, `fileSyncStatus -> FileSyncStatus`, `account -> Account`, `friend -> Friend` |
| ENT-002 | A `PluginEntityMap` must be augmentable by plugins via TypeScript module augmentation | Critical | Enables type-safe entity access for game-specific types |
| ENT-003 | A combined `EntityMap` must merge `CoreEntityMap` and `PluginEntityMap` | Critical | Single type for all entity lookups |
| ENT-004 | An `EntityType` union must represent all valid entity type string keys | Critical | `keyof EntityMap` |
| ENT-005 | All adapter generic methods must be constrained by `EntityType` for compile-time type safety | Critical | `get<T extends EntityType>(store: T, ...)` |

### 5.2 Entity Codec Registry

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| ENT-010 | An entity codec must define paired `serialize` and `hydrate` functions for a given entity type | Critical | `EntityCodec<T>` |
| ENT-011 | `serialize` must convert a typed entity instance to a plain `Record<string, unknown>` for storage | Critical | Called during adapter `put` operations |
| ENT-012 | `hydrate` must reconstruct a typed entity instance from a raw `Record<string, unknown>` retrieved from storage | Critical | Called during adapter `get` operations |
| ENT-013 | A global codec registry must allow plugins to register codecs by entity kind string | Critical | `registerEntityCodec(kind, codec)` |
| ENT-014 | Adapters must check for registered codecs during put/get operations and apply them transparently | Critical | No consumer awareness required |
| ENT-015 | The codec registry must support clearing for test isolation | High | `clearCodecRegistry()` |

### 5.3 Hydration Registry

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| ENT-020 | A global hydration registry must support registering hydrator functions by entity kind | High | `registerHydrator(kind, fn)` |
| ENT-021 | Hydration lookup must prefer codec-based hydration over standalone hydrators | High | Codec registry takes precedence |
| ENT-022 | The hydration registry must support clearing for test isolation | High | `clearHydrationRegistry()` |
| ENT-023 | Entity types that store complex objects as JSON must be flagged with `requiresHydration: true` in their `EntityKindDefinition` | High | Signals to adapters that raw JSON must be rehydrated |

---

## 6. DAO Pattern Requirements

### 6.1 Base DAO

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DAO-001 | A `BaseDAO<T>` abstract class must provide standard CRUD operations: get, list, save, saveMany, delete, deleteAll, count | Critical | Eliminates boilerplate in concrete DAOs |
| DAO-002 | BaseDAO must accept a `DatabaseAdapter` and a store name at construction | Critical | Binds DAO to a specific entity store |
| DAO-003 | BaseDAO must delegate all operations to the underlying adapter using the bound store name | Critical | Thin wrapper pattern |
| DAO-004 | Concrete DAOs must extend BaseDAO and may add domain-specific query methods | High | E.g., `FriendDAO.listByStatus()` |

### 6.2 BSData Base DAO

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DAO-010 | A `BSDataBaseDAO<T>` abstract class must provide memoized data loading with sync-on-demand behavior | Critical | For entities backed by community data files |
| DAO-011 | BSDataBaseDAO must accept a `DatabaseAdapter`, `IGitHubClient`, and GitHub repository coordinates | Critical | Owner and repo name |
| DAO-012 | BSDataBaseDAO must provide a `load()` method that returns cached data or syncs from remote | Critical | Memoizes the load promise to prevent duplicate fetches |
| DAO-013 | BSDataBaseDAO must provide a `refresh()` method that forces a re-sync from remote | High | Clears cached promise and sync status |
| DAO-014 | BSDataBaseDAO must check sync status (SHA comparison) before fetching remote data | Critical | `needsSync()` compares local SHA with remote |
| DAO-015 | BSDataBaseDAO must track sync status per file key after successful data storage | Critical | `updateSyncStatus(sha)` |
| DAO-016 | BSDataBaseDAO subclasses must implement `getStoreKey()`, `fetchRemoteData()`, and `getSyncFileKey()` | Critical | Template method pattern |
| DAO-017 | BSDataBaseDAO must clear its cached promise on fetch errors to allow retry | High | Error recovery |

### 6.3 Core DAOs

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DAO-020 | An `AccountDAO` must provide CRUD for user account entities (store: `'account'`) | Critical | Extends BaseDAO |
| DAO-021 | A `FriendDAO` must provide CRUD for friend entities (store: `'friend'`) plus `listByStatus(status)` for filtered queries | Critical | Extends BaseDAO with domain method |

### 6.4 Game-Specific DAOs

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DAO-030 | Game systems must provide Army, Campaign, and Match DAOs conforming to the `ArmyDAO`, `CampaignDAO`, and `MatchDAO` interfaces | Critical | Plugged into DataContext |
| DAO-031 | `ArmyDAO` must support: save, get, list, delete, count | Critical | Core army management operations |
| DAO-032 | `CampaignDAO` must support: save, get, list, delete | Critical | Core campaign management operations |
| DAO-033 | `MatchDAO` must support: save, get, list, delete | Critical | Core match management operations |
| DAO-034 | Game systems must provide faction-specific DAOs extending `BSDataBaseDAO` for lazy-loading faction data from community sources | Critical | One DAO per faction; wh40k10e has 38+ |
| DAO-035 | Game systems must provide a game data class wrapping all faction and rules DAOs with convenient async getters | High | E.g., `Wh40kGameData` with `dc.game.spaceMarines` |
| DAO-036 | Game data must support a `sync()` method that eagerly loads all reference data | High | Called during DataContext build |

---

## 7. Data Sync Requirements

### 7.1 BSData Sync Pipeline

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SYN-001 | The system must sync game data from GitHub-hosted BattleScribe community repositories | Critical | Primary data source for rules, units, weapons, abilities |
| SYN-002 | Sync must fetch `.gst` (game system) and `.cat` (catalogue) XML files from GitHub | Critical | BattleScribe data format |
| SYN-003 | Fetched XML must be parsed into typed BattleScribe structures (`BattleScribeGameSystem`, `BattleScribeCatalogue`) | Critical | Via `parseGameSystem()` and `parseCatalogue()` |
| SYN-004 | Parsed data must be extracted into domain entities (units, weapons, abilities) via extractor functions | Critical | `extractUnits()`, `extractWeapons()`, `extractAbilities()` |
| SYN-005 | Extracted entities must be stored via the database adapter (put/putMany) | Critical | Persistent local cache |
| SYN-006 | Sync status must be tracked per file using a unique file key and SHA hash | Critical | `FileSyncStatus` entity |
| SYN-007 | Before syncing, the system must check if the remote file SHA differs from the locally stored SHA | Critical | Avoid redundant downloads |
| SYN-008 | Sync status must support optional ETag for HTTP-level cache validation | Medium | Additional efficiency |

### 7.2 GitHub Client

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SYN-010 | A GitHub client must provide: `listFiles`, `getFileSha`, `downloadFile`, `checkForUpdates` | Critical | `IGitHubClient` interface |
| SYN-011 | A factory function must create configured GitHub client instances | High | `createGitHubClient(config)` |
| SYN-012 | Client configuration must include base URL, authentication token, and user agent | High | `GitHubClientConfig` |
| SYN-013 | Downloaded file metadata must include file key, SHA, and content | High | `GitHubFileInfo` type |
| SYN-014 | The client must support checking for updates without downloading content (SHA comparison only) | High | Efficiency for polling scenarios |

### 7.3 Additional Data Sources

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SYN-020 | The system must support data sources beyond GitHub (e.g., Wahapedia) for supplementary game data | High | ChapterApprovedDAO uses Wahapedia client |
| SYN-021 | Data source type must be declared in plugin configuration (`DataSourceConfig.type`) | High | Currently only `'github'` |
| SYN-022 | The architecture must accommodate new data source types without modifying core sync infrastructure | Medium | Future-proofing |

---

## 8. Core Data Model Requirements

### 8.1 Account Model

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| MDL-001 | Account entity must store: Auth0 subject identifier (primary key), display name, first name, last name, nickname, profile picture URL, email, email verification status | Critical | Cached from Auth0 profile |
| MDL-002 | Account must store linked social providers with: provider name, provider user ID, connection name, social flag | Critical | `LinkedProvider[]` |
| MDL-003 | Account must store user preferences: theme (`light`/`dark`/`auto`), language code, notifications enabled flag | Critical | `UserPreferences` |
| MDL-004 | Account must track timestamps: last Auth0 sync, created, updated | Critical | ISO 8601 strings |

### 8.2 Friend Model

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| MDL-010 | Friend entity must represent a bidirectional relationship between two users | Critical | Stored once, queried by either user |
| MDL-011 | Friend must store: requester ID, receiver ID, status (`pending`/`accepted`/`blocked`) | Critical | Core relationship state |
| MDL-012 | Friend must store display names and profile picture URLs for both requester and receiver | High | Denormalized for display without joins |
| MDL-013 | Friend must store sharing permissions: can share army lists, can view match history | High | Per-relationship granularity |
| MDL-014 | Friend must track timestamps: created, updated | High | ISO 8601 strings |

### 8.3 Faction Model

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| MDL-020 | Faction entity must extend the base `Entity` interface (id, name, sourceFile, sourceSha) | Critical | Inherits source tracking |
| MDL-021 | Faction must store a catalogue file path referencing the BattleScribe `.cat` file | Critical | `catalogueFile` field |

### 8.4 File Sync Status Model

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| MDL-030 | FileSyncStatus must store: file key (primary), SHA hash, last synced timestamp, optional ETag | Critical | Change detection for BSData files |
| MDL-031 | The file key must be unique per data file (e.g., `'core:wh40k-10e.gst'`, `'faction:Adeptus Astartes.cat'`) | Critical | Stable identifier across syncs |

---

## 9. Game-Specific Data Model Requirements

### 9.1 Army and Unit Models

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| GMD-001 | Army model must support: identity, owner, faction, detachment, points limit, battle size, total points, notes, army units list, version tracking, timestamps | Critical | Core army building entity |
| GMD-002 | ArmyUnit must support: unit reference ID, unit name, model count, total points, per-model configurations, wargear selections, optional enhancement, leader/warlord flags | Critical | Unit within an army list |
| GMD-003 | Per-model configuration must support individual weapon selections per model in a unit | Critical | Model-by-model loadout accuracy |
| GMD-004 | Unit (reference data) must support: stats block, weapon profiles (ranged and melee), abilities, keywords, composition, wargear options, leader info | Critical | Read-only datasheet data from BSData |
| GMD-005 | Weapons must be discriminated as ranged or melee with appropriate stat profiles | Critical | `RangedWeapon` vs `MeleeWeapon` |
| GMD-006 | Unit abilities, stratagems, detachments, and enhancements must be modeled as distinct entity types | Critical | Separate entity kinds in the type system |

### 9.2 Faction Data Model

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| GMD-010 | FactionData must aggregate all data for a single faction: units, weapons, abilities, stratagems, detachments, enhancements | Critical | Complete faction reference |
| GMD-011 | FactionData must support JSON serialization (spread) and deserialization (hydration functions) for database storage | Critical | Complex nested object; requires codec |
| GMD-012 | FactionData must support merging data from multiple catalogue files (e.g., Space Marines base + Blood Angels supplement) | High | Supplement/chapter catalogue hierarchy |

### 9.3 Match Model

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| GMD-020 | MatchRecord must store: identity, player IDs, army references, round scores, game tracker state, army HP states, result, timestamps | Critical | Full match history |
| GMD-021 | RoundScore must store: round number, primary VP, secondary VP, CP spent, CP gained, notes | Critical | Per-round scoring breakdown |
| GMD-022 | GameTracker must store: current round (1-5), current turn, current phase, game ended flag | Critical | Live game state |
| GMD-023 | ModelHPState must store: army unit reference, unit name, per-model HP entries (current wounds, max wounds, destroyed flag) | High | Per-model health tracking |
| GMD-024 | Game phases must be defined as a type representing the five combat phases (Command, Movement, Shooting, Charge, Fight) | Critical | Plugin-provided phase definitions |
| GMD-025 | Match result must record win/loss/draw outcome | Critical | Final match outcome |

### 9.4 Campaign Model

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| GMD-030 | MasterCampaign must store: identity, name, type (crusade/generic), status, phases, narrative, rankings, organizer ID, participant IDs, dates, timestamps | Critical | Campaign definition |
| GMD-031 | ParticipantCampaign must store: campaign reference, participant ID, army, crusade-specific data (requisition points, supply limit), timestamps | Critical | Per-participant state |
| GMD-032 | CrusadeUnitProgression must store: unit reference, XP, rank, tallies, battle honours, battle scars | Critical | Per-unit crusade tracking |
| GMD-033 | CampaignStatus must support lifecycle states: created, upcoming, active, completed, cancelled | High | Campaign state machine |
| GMD-034 | CampaignType must discriminate between crusade and generic campaign formats | High | Determines available features |

### 9.5 Rules Models

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| GMD-040 | CoreRules must store core game rules extracted from the game system `.gst` file | Critical | Requires JSON serialization/hydration |
| GMD-041 | CrusadeRules must store: unit ranks with XP thresholds, requisitions, battle honour types and definitions, battle scar definitions, agendas, XP gain rules | Critical | Crusade progression mechanics |
| GMD-042 | ChapterApproved must store: mission definitions, points updates, seasonal adjustments | High | Requires JSON serialization/hydration; sourced from Wahapedia |

---

## 10. Validation Engine Requirements

### 10.1 Engine

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| VAL-001 | A game-agnostic validation engine must accept an army, faction data, and an array of rule functions, and return a summary | Critical | `validateArmyWithRules(army, factionData, rules[])` |
| VAL-002 | The engine must aggregate results from all rules into a single `ValidationSummary` | Critical | Counts errors, warnings, info |
| VAL-003 | `ValidationSummary` must include: `isValid` (no errors), `errorCount`, `warningCount`, `infoCount`, and full `results[]` array | Critical | Drives UI validation display |

### 10.2 Validation Results

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| VAL-010 | Each `ValidationResult` must include: unique ID, passed/failed flag, severity, category, human-readable message | Critical | Complete result metadata |
| VAL-011 | Results may optionally include: constraint ID, army unit ID, army unit name, and additional details record | High | For contextual error display |
| VAL-012 | Severity must be one of: `error` (illegal army), `warning` (potential issue), `info` (informational note) | Critical | Three-level severity |
| VAL-013 | Category must be one of: `points`, `composition`, `enhancement`, `wargear`, `leader`, `warlord`, `transport`, `detachment`, `faction`, `general` | Critical | Ten validation categories for UI grouping |

### 10.3 Plugin Validation Rules

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| VAL-020 | Plugins must provide validation rules as `PluginValidationRule` objects with: unique ID, display name, and validate function | Critical | Conforms to `GameSystem.validationRules` |
| VAL-021 | Validate functions must accept army and faction data (as `unknown`) and return `ValidationRuleResult[]` | Critical | Game-agnostic function signature |
| VAL-022 | The wh40k10e plugin must provide 11 validation rules covering: points limits, strategic reserves, unit composition, character requirements, detachment rules, enhancement rules, faction keyword consistency, leader attachment, transport capacity, wargear legality, warlord designation | Critical | Complete army construction validation |

---

## 11. Error Handling Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| ERR-001 | A `DataLayerError` base class must serve as the root of all data layer error types | Critical | Enables catch-all handling |
| ERR-002 | `GitHubApiError` must represent GitHub API request failures with HTTP status | Critical | Extends DataLayerError |
| ERR-003 | `RateLimitError` must represent GitHub API rate limit exceeded conditions | High | Extends DataLayerError |
| ERR-004 | `NetworkError` must represent network connectivity failures | Critical | Extends DataLayerError |
| ERR-005 | `XmlParseError` must represent BattleScribe XML parsing failures | Critical | Extends DataLayerError |
| ERR-006 | `DatabaseError` must represent database operation failures with an operation code | Critical | Extends DataLayerError |
| ERR-007 | Type guard functions must be provided for each error type: `isDataLayerError`, `isGitHubApiError`, `isRateLimitError`, `isNetworkError`, `isXmlParseError`, `isDatabaseError` | Critical | Runtime type narrowing |
| ERR-008 | A `DataLayerErrorCode` type must define the valid error code string union | High | Structured error classification |

---

## 12. Backend Service Requirements

### 12.1 Authorizer Service

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SVC-001 | An authorizer Lambda must validate API Gateway request tokens | Critical | Authentication gate |
| SVC-002 | The authorizer must return IAM policy documents allowing or denying access | Critical | API Gateway integration |

### 12.2 Campaigns Service

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SVC-010 | A campaigns Lambda must provide REST API endpoints for campaign CRUD operations | Critical | Create, read, update, delete |
| SVC-011 | The campaigns service must support participant management operations | High | Join, leave, invite |
| SVC-012 | The campaigns service must use DynamoDB for server-side campaign storage | Critical | Serverless-native persistence |
| SVC-013 | The campaigns service must validate requests against the authorizer | Critical | Protected endpoints |

---

## 13. Cross-Platform Data Flow Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| XPF-001 | Web applications must use IndexedDB (via Dexie) for local data persistence | Critical | Browser-native storage |
| XPF-002 | Mobile applications must use SQLite (via expo-sqlite) for local data persistence | Critical | Device-native storage |
| XPF-003 | Server/serverless functions must use Aurora DSQL (via Drizzle + pg) for centralized data persistence | Critical | Cloud-native storage |
| XPF-004 | All three platforms must produce identical query results for the same data and operations | Critical | Platform parity guarantee |
| XPF-005 | Army building must work fully offline after initial game data sync | Critical | OFF-002 from UI requirements |
| XPF-006 | Faction data and unit references must be cached locally after first sync | Critical | OFF-001 from UI requirements |
| XPF-007 | Match tracking must require network connectivity for real-time sync | High | OFF-003 from UI requirements |
| XPF-008 | The system must auto-sync data when connectivity returns after an offline period | High | OFF-005 from UI requirements |
| XPF-009 | Data serialization and deserialization must be consistent across all three adapters | Critical | Codecs applied uniformly |
| XPF-010 | Complex model types (FactionData, CoreRules, ChapterApproved) must serialize to JSON for storage and hydrate back to typed instances on retrieval, identically across all platforms | Critical | Codec-driven |

---

## 14. Performance Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| PRF-001 | Adapter `putMany` must be significantly more efficient than repeated single `put` calls | Critical | Batch operations for sync |
| PRF-002 | Adapter `transaction` must ensure atomicity without excessive performance overhead | High | Used for multi-step sync |
| PRF-003 | BSDataBaseDAO must memoize loaded data to avoid duplicate fetches within a session | Critical | `cachedPromise` pattern |
| PRF-004 | Sync status checks must use SHA comparison only (no content download) to determine if sync is needed | High | Minimize network usage |
| PRF-005 | Query options must support limit and offset for paginated retrieval | High | Avoid loading entire stores |
| PRF-006 | Query options must support server-side sorting via `orderBy` and `direction` | High | Avoid client-side sort of large datasets |
| PRF-007 | Dynamic imports must be used for platform-specific adapter modules to enable tree-shaking | High | DSQLAdapter only loaded on server |
| PRF-008 | SQLite adapter must use column name whitelisting to prevent SQL injection in dynamic ORDER BY clauses | Critical | `tableColumns` sets in schema |

---

## 15. Security Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SEC-001 | GitHub API tokens must not be stored in client-side code or transmitted to browsers | Critical | Server-only configuration |
| SEC-002 | Aurora DSQL credentials must use IAM auth tokens, never static passwords | Critical | AWS security best practice |
| SEC-003 | Client applications must not have direct database access to server-side stores | Critical | All server data via API Gateway + Lambda |
| SEC-004 | Entity data must be isolated by user — one user must not access another user's armies, matches, or campaigns without explicit sharing | Critical | Owner-based filtering |
| SEC-005 | Auth0 subject identifiers must serve as the canonical user identity across all data operations | Critical | `Account.id` = Auth0 `sub` |
| SEC-006 | Adapter SQL operations must use parameterized queries to prevent injection | Critical | All adapters |
| SEC-007 | ORDER BY column names must be validated against schema-defined column sets before inclusion in queries | Critical | `tableColumns` whitelist in SQLite |

---

## 16. Future Extensibility Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FUT-001 | The plugin architecture must support adding new game systems (Age of Sigmar, Horus Heresy) without modifying core code | Critical | Plugin isolation |
| FUT-002 | New game systems must be able to register their own entity kinds, schemas, codecs, hydrators, and validation rules using the same registration APIs | Critical | Same extension points as wh40k10e |
| FUT-003 | Once multiple game systems are implemented, campaign and match data structures must be re-evaluated to identify data common to the app vs. data specific to a game system | High | Extract shared data into core; keep game-specific data in plugins |
| FUT-004 | The schema extension system must support schema versioning and migration in future releases | Medium | Reserved `databaseVersion` in factory config |
| FUT-005 | New data source types beyond GitHub must be supportable without restructuring the sync pipeline | Medium | `DataSourceConfig.type` currently only `'github'` |
| FUT-006 | The validation engine must support new validation categories as game systems introduce novel rule types | Medium | Category enum expansion |
| FUT-007 | The DAO pattern must support new query methods beyond field-equality (e.g., range queries, full-text search) as requirements evolve | Medium | Adapter interface extension |

---

**End of Data Architecture & Data Flow Requirements**
