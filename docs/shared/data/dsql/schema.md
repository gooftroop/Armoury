# DSQL Schema

Drizzle ORM schema definitions for Aurora DSQL (PostgreSQL-compatible) database tables.

**Source:** `src/shared/data/dsql/schema.ts`

## Overview

Defines all tables for storing tabletop game army data, user accounts, campaigns, and match records. All tables use `text()` for primary keys due to Aurora DSQL limitations (no serial/auto-increment columns). Complex data structures are stored as `jsonb` columns.

## Exported Table Definitions

### Game Data Tables

#### `units`

Unit datasheet table. Stores parsed unit data with all characteristics (M, T, SV, W, LD, OC, INV) and associated weapons/abilities as JSONB.

| Column              | Type      | Nullable | Description                      |
| ------------------- | --------- | -------- | -------------------------------- |
| `id`                | `text`    | No (PK)  | Unit identifier                  |
| `name`              | `text`    | No       | Unit name                        |
| `source_file`       | `text`    | No       | Source catalogue file path       |
| `source_sha`        | `text`    | No       | Git SHA of source file           |
| `faction_id`        | `text`    | No       | Faction identifier               |
| `movement`          | `text`    | Yes      | Movement characteristic          |
| `toughness`         | `integer` | Yes      | Toughness characteristic         |
| `save`              | `text`    | Yes      | Save characteristic              |
| `wounds`            | `integer` | Yes      | Wounds characteristic            |
| `leadership`        | `integer` | Yes      | Leadership characteristic        |
| `objective_control` | `integer` | Yes      | Objective control characteristic |
| `invulnerable_save` | `text`    | Yes      | Invulnerable save                |
| `composition`       | `jsonb`   | Yes      | Composition options              |
| `ranged_weapons`    | `jsonb`   | Yes      | Ranged weapon profiles           |
| `melee_weapons`     | `jsonb`   | Yes      | Melee weapon profiles            |
| `wargear_options`   | `jsonb`   | Yes      | Wargear selection options        |
| `wargear_abilities` | `jsonb`   | Yes      | Wargear-specific abilities       |
| `abilities`         | `jsonb`   | Yes      | Unit abilities                   |
| `leader`            | `jsonb`   | Yes      | Leader attachment info           |
| `keywords`          | `jsonb`   | Yes      | Unit keywords                    |
| `faction_keywords`  | `jsonb`   | Yes      | Faction keywords                 |
| `image_url`         | `text`    | Yes      | Unit artwork URL                 |

#### `weapons`

Weapon profile table with characteristics (Range, A, BS/WS, S, AP, D).

| Column        | Type      | Nullable | Description             |
| ------------- | --------- | -------- | ----------------------- |
| `id`          | `text`    | No (PK)  | Weapon identifier       |
| `name`        | `text`    | No       | Weapon name             |
| `source_file` | `text`    | No       | Source file path        |
| `source_sha`  | `text`    | No       | Git SHA                 |
| `type`        | `text`    | No       | `'ranged'` or `'melee'` |
| `range`       | `text`    | Yes      | Range characteristic    |
| `attacks`     | `text`    | Yes      | Attacks characteristic  |
| `skill`       | `text`    | Yes      | BS or WS                |
| `strength`    | `integer` | Yes      | Strength                |
| `ap`          | `integer` | Yes      | Armour penetration      |
| `damage`      | `text`    | Yes      | Damage                  |
| `keywords`    | `jsonb`   | Yes      | Weapon ability keywords |
| `unit_id`     | `text`    | Yes      | Parent unit ID          |

#### `abilities`

Unit ability table with descriptions, phases, and effects.

#### `stratagems`

Detachment stratagem table with CP cost, phase, and description.

#### `detachments`

Faction detachment table with rules and enhancements as JSONB.

#### `factions`

Faction metadata table with catalogue file references.

#### `factionModels`

Complete faction data model table. Stores serialized `FactionDataModel` instances with all units, weapons, abilities, stratagems, and detachments as JSONB columns.

### Sync Table

#### `syncStatus`

File sync status tracking table. Records SHA hashes and ETags for conditional requests.

| Column        | Type        | Nullable | Description            |
| ------------- | ----------- | -------- | ---------------------- |
| `file_key`    | `text`      | No (PK)  | Unique file identifier |
| `sha`         | `text`      | No       | Git SHA hash           |
| `last_synced` | `timestamp` | No       | Last sync timestamp    |
| `etag`        | `text`      | Yes      | HTTP ETag header       |

### User Data Tables

#### `accounts`

User profile table cached from Auth0. Includes identity information, email verification, and preferences as JSONB.

#### `armies`

User-created army list table with unit selections (JSONB), points tracking, and version history.

#### `friends`

Bidirectional friend relationship table with request status and permission flags.

### Campaign & Match Tables

#### `masterCampaigns`

Campaign container table with phases, custom rules, rankings, and participant/match tracking as JSONB.

#### `participantCampaigns`

Per-player campaign data table with crusade progression data as JSONB.

#### `matchRecords`

Per-player match record table with round scores, army HP state, and game tracker as JSONB.

#### `crusadeRules`

Crusade ruleset reference table with rank thresholds, XP rules, requisitions, battle honours, and battle scars as JSONB.

## Exported Indexes

```typescript
export const unitsFactionIdIndex: IndexBuilder;
export const weaponsUnitIdIndex: IndexBuilder;
export const stratagemsDetachmentIdIndex: IndexBuilder;
export const armiesOwnerIdIndex: IndexBuilder;
export const friendsRequesterIdIndex: IndexBuilder;
export const friendsReceiverIdIndex: IndexBuilder;
export const masterCampaignsOrganizerIdIndex: IndexBuilder;
export const participantCampaignsMasterCampaignIdIndex: IndexBuilder;
export const participantCampaignsAccountIdIndex: IndexBuilder;
export const matchRecordsPlayerIdIndex: IndexBuilder;
export const matchRecordsCampaignIdIndex: IndexBuilder;
```

## Usage Example

```typescript
import { units, weapons, factions, syncStatus } from '@armoury/shared';

// Used internally by DSQLAdapter with Drizzle ORM
// Tables are passed to drizzle queries:
// db.select().from(units).where(eq(units.factionId, 'space-marines'))
```
