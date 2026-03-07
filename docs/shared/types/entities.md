# entities.ts

Domain entity interfaces for tabletop game data, providing the core type definitions used throughout the application.

**Source:** `src/shared/types/entities.ts`

## Overview

This file defines the core domain entity interfaces that model tabletop game data. It includes base entity types, weapon profiles, faction data, army composition, unit abilities, and synchronization tracking. Many types are defined locally while others are re-exported from specialized model files.

---

## Locally Defined Types

### `Entity`

Base interface for all domain objects. Provides common identity and source tracking properties.

```typescript
interface Entity {
    id: string;
    name: string;
    sourceFile: string;
    sourceSha: string;
}
```

| Property     | Type     | Description                                                            |
| ------------ | -------- | ---------------------------------------------------------------------- |
| `id`         | `string` | Unique identifier for the entity                                       |
| `name`       | `string` | Display name of the entity                                             |
| `sourceFile` | `string` | Path to the source `.gst` or `.cat` file where this entity was defined |
| `sourceSha`  | `string` | SHA hash of the source file for change detection and caching           |

```typescript
import type { Entity } from '@armoury/shared';

const entity: Entity = {
    id: 'unit-001',
    name: 'Necron Warriors',
    sourceFile: 'necrons.cat',
    sourceSha: 'abc123def456',
};
```

---

### `Faction`

Represents a game faction. Extends `Entity` with a catalogue file reference.

```typescript
interface Faction extends Entity {
    catalogueFile: string;
}
```

| Property        | Type     | Description                                          |
| --------------- | -------- | ---------------------------------------------------- |
| `catalogueFile` | `string` | Path to the catalogue (`.cat`) file for this faction |

Inherits all properties from `Entity`.

```typescript
import type { Faction } from '@armoury/shared';

const faction: Faction = {
    id: 'necrons',
    name: 'Necrons',
    sourceFile: 'wh40k10e.gst',
    sourceSha: 'sha256hash',
    catalogueFile: 'necrons.cat',
};
```

---

### `RangedWeapon`

Ranged weapon profile with distance-based targeting. Extends the internal `WeaponBase` interface with a `range` property and a `type` discriminator set to `'ranged'`.

```typescript
interface RangedWeapon extends WeaponBase {
    type: 'ranged';
    range: string;
}
```

| Property         | Type                | Description                                                                    |
| ---------------- | ------------------- | ------------------------------------------------------------------------------ |
| `type`           | `'ranged'`          | Literal type discriminator for ranged weapons                                  |
| `range`          | `string`            | Maximum distance in inches (e.g., `"24\""`, `"12\""`, `"Aura 6\""`)            |
| `attacks`        | `string`            | Number of attacks, can be fixed or random (e.g., `"1"`, `"D6"`, `"2D6"`)       |
| `skill`          | `string`            | Ballistic Skill threshold (e.g., `"3+"`, `"4+"`)                               |
| `strength`       | `number`            | Strength characteristic, compared against target Toughness                     |
| `ap`             | `number`            | Armour Penetration, subtracted from saving throw (e.g., `-1`, `-2`)            |
| `damage`         | `string`            | Damage per unsaved hit, can be fixed or random (e.g., `"1"`, `"D3"`, `"D6+1"`) |
| `keywords`       | `string[]`          | Raw weapon ability keywords (e.g., `"Assault"`, `"Heavy"`, `"Lethal Hits"`)    |
| `parsedKeywords` | `WeaponKeyword[]`   | Parsed weapon keywords with structured effect information                      |
| `unitId`         | `string` (optional) | Reference to the unit this weapon belongs to                                   |

Inherits `id`, `name`, `sourceFile`, and `sourceSha` from `Entity`.

```typescript
import type { RangedWeapon } from '@armoury/shared';

const gaussFlayer: RangedWeapon = {
    id: 'gauss-flayer',
    name: 'Gauss Flayer',
    sourceFile: 'necrons.cat',
    sourceSha: 'sha256hash',
    type: 'ranged',
    range: '24"',
    attacks: '1',
    skill: '4+',
    strength: 4,
    ap: 0,
    damage: '1',
    keywords: ['Rapid Fire 1'],
    parsedKeywords: [],
    unitId: 'necron-warriors',
};
```

---

### `MeleeWeapon`

Melee weapon profile for close combat. Extends the internal `WeaponBase` interface with a `type` discriminator set to `'melee'`.

```typescript
interface MeleeWeapon extends WeaponBase {
    type: 'melee';
}
```

| Property | Type      | Description                                  |
| -------- | --------- | -------------------------------------------- |
| `type`   | `'melee'` | Literal type discriminator for melee weapons |

All other properties are the same as `RangedWeapon` except there is no `range` property, and `skill` represents Weapon Skill (WS) instead of Ballistic Skill (BS).

```typescript
import type { MeleeWeapon } from '@armoury/shared';

const closeComabatWeapon: MeleeWeapon = {
    id: 'ccw',
    name: 'Close Combat Weapon',
    sourceFile: 'necrons.cat',
    sourceSha: 'sha256hash',
    type: 'melee',
    attacks: '2',
    skill: '4+',
    strength: 4,
    ap: 0,
    damage: '1',
    keywords: [],
    parsedKeywords: [],
};
```

---

### `Weapon`

Union type representing any weapon (ranged or melee). Use the type guards `isRangedWeapon()` or `isMeleeWeapon()` from `@armoury/shared` to narrow the type.

```typescript
type Weapon = RangedWeapon | MeleeWeapon;
```

```typescript
import type { Weapon } from '@armoury/shared';
import { isRangedWeapon } from '@armoury/shared';

function getWeaponRange(weapon: Weapon): string {
    if (isRangedWeapon(weapon)) {
        return weapon.range;
    }
    return 'Melee';
}
```

---

### `Ability`

Represents a unit ability, stratagem, or special rule in the game.

```typescript
interface Ability extends Entity {
    description: string;
    phase?: string;
    effect?: string;
}
```

| Property      | Type                | Description                                                                      |
| ------------- | ------------------- | -------------------------------------------------------------------------------- |
| `description` | `string`            | Full text description of the ability effect                                      |
| `phase`       | `string` (optional) | Game phase when the ability applies (e.g., `"Command"`, `"Shooting"`, `"Fight"`) |
| `effect`      | `string` (optional) | Structured effect information for programmatic processing                        |

```typescript
import type { Ability } from '@armoury/shared';

const ability: Ability = {
    id: 'reanimation-protocols',
    name: 'Reanimation Protocols',
    sourceFile: 'necrons.cat',
    sourceSha: 'sha256hash',
    description: 'At the start of your Command phase...',
    phase: 'Command',
};
```

---

### `Stratagem`

Represents a stratagem -- a special tactic that costs Command Points.

```typescript
interface Stratagem extends Entity {
    cp: number;
    phase: string;
    description: string;
    detachmentId?: string;
}
```

| Property       | Type                | Description                                           |
| -------------- | ------------------- | ----------------------------------------------------- |
| `cp`           | `number`            | Command Point cost (typically 1 or 2)                 |
| `phase`        | `string`            | Game phase when this stratagem can be used            |
| `description`  | `string`            | Full text description of the stratagem effect         |
| `detachmentId` | `string` (optional) | Reference to the detachment this stratagem belongs to |

```typescript
import type { Stratagem } from '@armoury/shared';

const stratagem: Stratagem = {
    id: 'command-reroll',
    name: 'Command Re-roll',
    sourceFile: 'wh40k10e.gst',
    sourceSha: 'sha256hash',
    cp: 1,
    phase: 'Any',
    description: 'Re-roll one hit/wound/damage/save/advance/charge roll.',
};
```

---

### `Detachment`

Represents a set of faction-specific rules and abilities. Detachments provide stratagems, enhancements, and special rules for army construction.

```typescript
interface Detachment extends Entity {
    factionId: string;
    rules: string[];
    structuredRules: StructuredRule[];
    enhancements: Enhancement[];
}
```

| Property          | Type               | Description                                                |
| ----------------- | ------------------ | ---------------------------------------------------------- |
| `factionId`       | `string`           | Reference to the faction this detachment belongs to        |
| `rules`           | `string[]`         | Raw text descriptions of detachment rules and abilities    |
| `structuredRules` | `StructuredRule[]` | Parsed detachment rules with structured effect information |
| `enhancements`    | `Enhancement[]`    | Available enhancements that can be applied to characters   |

```typescript
import type { Detachment } from '@armoury/shared';

const detachment: Detachment = {
    id: 'annihilation-legion',
    name: 'Annihilation Legion',
    sourceFile: 'necrons.cat',
    sourceSha: 'sha256hash',
    factionId: 'necrons',
    rules: ['Units in this detachment gain...'],
    structuredRules: [],
    enhancements: [],
};
```

---

### `Enhancement`

Represents a special upgrade that can be applied to Character units. Enhancements cost points and are limited to 3 per army.

```typescript
interface Enhancement {
    id: string;
    name: string;
    points: number;
    description: string;
    eligibleKeywords: string[];
    structuredEffect: StructuredRule | null;
}
```

| Property           | Type                     | Description                                            |
| ------------------ | ------------------------ | ------------------------------------------------------ |
| `id`               | `string`                 | Unique identifier for the enhancement                  |
| `name`             | `string`                 | Display name                                           |
| `points`           | `number`                 | Points cost to add this enhancement                    |
| `description`      | `string`                 | Full text description of the enhancement effect        |
| `eligibleKeywords` | `string[]`               | Unit keywords eligible to receive this enhancement     |
| `structuredEffect` | `StructuredRule \| null` | Parsed enhancement effect, or `null` if not yet parsed |

Note: `Enhancement` does not extend `Entity` -- it lacks `sourceFile` and `sourceSha`.

---

### `Keyword`

Represents a keyword tag used to categorize units and abilities.

```typescript
interface Keyword {
    id: string;
    name: string;
    type: 'faction' | 'unit';
}
```

| Property | Type                  | Description                                                            |
| -------- | --------------------- | ---------------------------------------------------------------------- |
| `id`     | `string`              | Unique identifier                                                      |
| `name`   | `string`              | Display name (e.g., `"Infantry"`, `"Character"`, `"Adeptus Astartes"`) |
| `type`   | `'faction' \| 'unit'` | `'faction'` for faction keywords, `'unit'` for unit keywords           |

```typescript
import type { Keyword } from '@armoury/shared';

const keyword: Keyword = {
    id: 'infantry',
    name: 'Infantry',
    type: 'unit',
};
```

---

### `FileSyncStatus`

Tracks synchronization status of a game data file. Used to detect changes and avoid redundant downloads from GitHub.

```typescript
interface FileSyncStatus {
    fileKey: string;
    sha: string;
    lastSynced: Date;
    etag?: string;
}
```

| Property     | Type                | Description                                                              |
| ------------ | ------------------- | ------------------------------------------------------------------------ |
| `fileKey`    | `string`            | Unique identifier for the file (e.g., `"wh40k10e.gst"`, `"necrons.cat"`) |
| `sha`        | `string`            | SHA hash of the file content for change detection                        |
| `lastSynced` | `Date`              | Timestamp of the last successful synchronization                         |
| `etag`       | `string` (optional) | ETag from GitHub for efficient cache validation                          |

```typescript
import type { FileSyncStatus } from '@armoury/shared';

const syncStatus: FileSyncStatus = {
    fileKey: 'necrons.cat',
    sha: 'abc123',
    lastSynced: new Date('2026-01-15T12:00:00Z'),
    etag: '"abc123"',
};
```

---

### `SyncResult`

Result of a file synchronization operation.

```typescript
interface SyncResult {
    success: boolean;
    filesUpdated: string[];
    errors: Array<{ file: string; error: string }>;
    timestamp: Date;
}
```

| Property       | Type                                     | Description                                                                  |
| -------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `success`      | `boolean`                                | Whether the sync completed successfully (true even if some files had errors) |
| `filesUpdated` | `string[]`                               | List of file keys that were updated                                          |
| `errors`       | `Array<{ file: string; error: string }>` | Errors encountered during sync                                               |
| `timestamp`    | `Date`                                   | When the sync operation completed                                            |

```typescript
import type { SyncResult } from '@armoury/shared';

const result: SyncResult = {
    success: true,
    filesUpdated: ['necrons.cat', 'wh40k10e.gst'],
    errors: [],
    timestamp: new Date(),
};
```

---

## Re-exported Types

The following types are re-exported from specialized model files and available via `@armoury/shared`.

### From `UnitModel.ts`

| Type              | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `Unit`            | Complete unit datasheet with stats, weapons, abilities, and composition options. Extends `Entity`. |
| `UnitComposition` | A size option for a unit (models count and points cost).                                           |
| `WargearOption`   | A set of equipment options for a unit with min/max selection constraints.                          |
| `WargearChoice`   | A single selectable weapon or wargear item within a wargear option.                                |
| `WargearAbility`  | An ability specific to a piece of wargear.                                                         |
| `LeaderInfo`      | Describes which units a leader Character can attach to.                                            |
| `UnitAbility`     | An ability with description attached to a unit.                                                    |

### From `AccountModel.ts`

| Type              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `Account`         | Complete user account with Auth0 profile cache and application preferences. |
| `LinkedProvider`  | A linked social authentication provider (e.g., Google, GitHub).             |
| `UserPreferences` | User preferences for theme, language, and notifications.                    |

### From `ArmyModel.ts`

| Type                       | Description                                                                   |
| -------------------------- | ----------------------------------------------------------------------------- |
| `Army`                     | Complete army list with unit selections, configurations, and version history. |
| `ArmyUnit`                 | A unit instance in an army list with configured selections.                   |
| `ArmyModelConfig`          | Configuration for a single model's weapon loadout.                            |
| `ArmyModelWeaponSelection` | A weapon selection for a specific model.                                      |
| `ArmyWargearSelection`     | A wargear selection made for an army unit.                                    |
| `ArmyEnhancement`          | An enhancement applied to a Character unit.                                   |
| `ArmyVersion`              | A snapshot of the army at a specific point in time.                           |
| `BattleSize`               | Battle size literal union: `'Incursion' \| 'StrikeForce' \| 'Onslaught'`.     |

### From `FriendModel.ts`

| Type           | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| `Friend`       | A bidirectional friend relationship between two users.          |
| `FriendStatus` | Status of a friendship: `'pending' \| 'accepted' \| 'blocked'`. |

### From `MatchModel.ts`

| Type           | Description                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| `MatchRecord`  | Complete match record from one player's perspective.                                      |
| `RoundScore`   | Score tracking for a single battle round.                                                 |
| `ModelHPState` | Complete HP state for a unit within an army during a match.                               |
| `ModelHPEntry` | Wound/HP state for a single model.                                                        |
| `GameTracker`  | Current state of an active game (round, turn, phase).                                     |
| `GamePhase`    | Game phase literal union: `'Command' \| 'Movement' \| 'Shooting' \| 'Charge' \| 'Fight'`. |
| `PlayerTurn`   | Active player literal union: `'player1' \| 'player2'`.                                    |
| `MatchResult`  | Match result literal union: `'win' \| 'loss' \| 'draw'`.                                  |

### From `CampaignModel.ts`

| Type                     | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `MasterCampaign`         | Master campaign created by organizer with phases, rankings, and participants.          |
| `ParticipantCampaign`    | Per-player campaign entry tracking army, progression, and matches.                     |
| `CampaignPhase`          | A campaign phase with point limits, match requirements, and narrative.                 |
| `CampaignNarrative`      | Campaign narrative context (crusade reference or custom).                              |
| `CampaignRanking`        | Participant ranking entry in a campaign.                                               |
| `CampaignType`           | Campaign type literal union: `'crusade' \| 'generic'`.                                 |
| `CampaignStatus`         | Campaign status literal union: `'upcoming' \| 'active' \| 'completed' \| 'cancelled'`. |
| `CrusadeBattleHonour`    | A battle honour earned by a crusade unit.                                              |
| `CrusadeBattleScar`      | A battle scar acquired by a crusade unit.                                              |
| `CrusadeUnitProgression` | Crusade progression tracking for a single unit (XP, honours, scars, kills).            |
| `CrusadeParticipantData` | Crusade-specific data for a participant (points, requisitions, unit progressions).     |

### From `CrusadeRulesModel.ts`

| Type                     | Description                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `CrusadeRules`           | Complete crusade campaign ruleset definition.                                                            |
| `CrusadeUnitRank`        | Unit rank literal union: `'Battle-ready' \| 'Bloodied' \| 'Battle-hardened' \| 'Heroic' \| 'Legendary'`. |
| `RankThreshold`          | XP threshold and benefits for a specific crusade rank.                                                   |
| `CrusadeRequisition`     | A requisition purchasable with requisition points.                                                       |
| `BattleHonourType`       | Battle honour category literal union.                                                                    |
| `BattleHonourDefinition` | Definition of a battle honour that can be awarded.                                                       |
| `BattleScarDefinition`   | Definition of a battle scar that can be inflicted.                                                       |
| `AgendaCategory`         | Crusade agenda category literal union.                                                                   |
| `CrusadeAgenda`          | A crusade agenda selectable for a battle.                                                                |
| `XPGainRule`             | A rule defining how units gain XP.                                                                       |
| `BlackstoneUpgrade`      | A blackstone upgrade applicable to units.                                                                |
| `CrusadeRuleSource`      | Rulebook source literal union: `'core' \| 'armageddon' \| 'pariah-nexus'`.                               |
