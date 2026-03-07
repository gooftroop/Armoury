# UnitModel

Expanded Unit data model for army building with full datasheet profiles, composition options, weapons, wargear, and abilities.

**Source:** `src/shared/data/BSData/wh40k10e/models/UnitModel.ts`

## Exports

### `UnitComposition` (interface)

A size option for a unit (e.g., 5 models for 90pts, 10 models for 180pts).

```typescript
interface UnitComposition {
    models: number;
    points: number;
}
```

| Property | Type     | Description                                  |
| -------- | -------- | -------------------------------------------- |
| `models` | `number` | Number of models in this composition option. |
| `points` | `number` | Points cost for this composition option.     |

### `WargearChoice` (interface)

A single weapon or wargear item that can be chosen in a wargear option.

```typescript
interface WargearChoice {
    id: string;
    name: string;
    points: number;
    isDefault: boolean;
}
```

| Property    | Type      | Description                            |
| ----------- | --------- | -------------------------------------- |
| `id`        | `string`  | Unique identifier for this choice.     |
| `name`      | `string`  | Display name.                          |
| `points`    | `number`  | Points cost for selecting this choice. |
| `isDefault` | `boolean` | Whether this is the default selection. |

### `WargearOption` (interface)

A set of equipment options for a unit (e.g., "Any model can replace their boltgun with:").

```typescript
interface WargearOption {
    id: string;
    name: string;
    choices: WargearChoice[];
    minSelections: number;
    maxSelections: number;
}
```

| Property        | Type              | Description                             |
| --------------- | ----------------- | --------------------------------------- |
| `id`            | `string`          | Unique identifier for the option group. |
| `name`          | `string`          | Display name (e.g., "Weapon Options").  |
| `choices`       | `WargearChoice[]` | Available choices within this option.   |
| `minSelections` | `number`          | Minimum required selections.            |
| `maxSelections` | `number`          | Maximum allowed selections.             |

### `WargearAbility` (interface)

An ability specific to a piece of wargear.

```typescript
interface WargearAbility {
    id: string;
    name: string;
    description: string;
}
```

### `LeaderInfo` (interface)

Describes which units a leader can be attached to. Leaders are Character units that form Attached units with Bodyguard units.

```typescript
interface LeaderInfo {
    canAttachTo: string[];
    leaderAbility: string;
}
```

| Property        | Type       | Description                                   |
| --------------- | ---------- | --------------------------------------------- |
| `canAttachTo`   | `string[]` | Unit keyword names this leader can attach to. |
| `leaderAbility` | `string`   | Description of the leader ability.            |

### `UnitAbility` (interface)

An ability with full description, attached to a unit.

```typescript
interface UnitAbility {
    id: string;
    name: string;
    description: string;
}
```

### `Unit` (interface)

Complete unit datasheet for army building. Extends `Entity`.

```typescript
interface Unit extends Entity {
    factionId: string;
    movement: string;
    toughness: number;
    save: string;
    wounds: number;
    leadership: number;
    objectiveControl: number;
    invulnerableSave?: string;
    composition: UnitComposition[];
    rangedWeapons: Weapon[];
    meleeWeapons: Weapon[];
    wargearOptions: WargearOption[];
    wargearAbilities: WargearAbility[];
    abilities: UnitAbility[];
    structuredAbilities: StructuredRule[];
    constraints: ParsedConstraint[];
    leader?: LeaderInfo;
    keywords: string[];
    factionKeywords: string[];
    imageUrl: string;
}
```

#### Properties

| Property              | Type                      | Description                                                     |
| --------------------- | ------------------------- | --------------------------------------------------------------- |
| `factionId`           | `string`                  | Faction this unit belongs to.                                   |
| `movement`            | `string`                  | Movement characteristic (e.g., `"6\""`, `"2D6\""`, `"-"`).      |
| `toughness`           | `number`                  | Toughness characteristic (T).                                   |
| `save`                | `string`                  | Armour save (e.g., `"3+"`).                                     |
| `wounds`              | `number`                  | Wounds characteristic (W).                                      |
| `leadership`          | `number`                  | Leadership characteristic (LD).                                 |
| `objectiveControl`    | `number`                  | Objective control (OC).                                         |
| `invulnerableSave`    | `string \| undefined`     | Invulnerable save (e.g., `"4+"`).                               |
| `composition`         | `UnitComposition[]`       | Available squad size options.                                   |
| `rangedWeapons`       | `Weapon[]`                | Ranged weapon profiles.                                         |
| `meleeWeapons`        | `Weapon[]`                | Melee weapon profiles.                                          |
| `wargearOptions`      | `WargearOption[]`         | Wargear selection options.                                      |
| `wargearAbilities`    | `WargearAbility[]`        | Wargear-specific abilities.                                     |
| `abilities`           | `UnitAbility[]`           | Unit abilities and special rules.                               |
| `structuredAbilities` | `StructuredRule[]`        | Parsed abilities for rule validation.                           |
| `constraints`         | `ParsedConstraint[]`      | Army construction constraints.                                  |
| `leader`              | `LeaderInfo \| undefined` | Leader attachment info.                                         |
| `keywords`            | `string[]`                | Unit keywords (e.g., `"Infantry"`, `"Vehicle"`, `"Character"`). |
| `factionKeywords`     | `string[]`                | Faction keywords (e.g., `"Adeptus Astartes"`).                  |
| `imageUrl`            | `string`                  | URL to unit artwork.                                            |

## Usage Example

```typescript
import type { Unit, UnitComposition, WargearOption } from '@armoury/shared';

// Access unit data from a FactionDataModel
const factionModel = await dataManager.getFactionModel('space-marines');
const units: Unit[] = factionModel?.units ?? [];

for (const unit of units) {
    console.log(`${unit.name}: M${unit.movement} T${unit.toughness} SV${unit.save}`);
    console.log(`  Compositions: ${unit.composition.map((c) => `${c.models} models @ ${c.points}pts`).join(', ')}`);
    console.log(`  Keywords: ${unit.keywords.join(', ')}`);
}
```
