# ArmyModel

Army list model representing a complete army roster with unit selections and version history.

**Source:** `src/shared/data/BSData/wh40k10e/models/ArmyModel.ts`

## Exports

### `ArmyModelWeaponSelection` (interface)

A weapon selection for a specific model in an army unit.

```typescript
interface ArmyModelWeaponSelection {
    weaponId: string;
    weaponName: string;
}
```

| Property     | Type     | Description                            |
| ------------ | -------- | -------------------------------------- |
| `weaponId`   | `string` | The weapon ID from the unit datasheet. |
| `weaponName` | `string` | The weapon name for display.           |

### `ArmyModelConfig` (interface)

Configuration for a single model in an army unit.

```typescript
interface ArmyModelConfig {
    modelName: string;
    weapons: ArmyModelWeaponSelection[];
}
```

| Property    | Type                         | Description                     |
| ----------- | ---------------------------- | ------------------------------- |
| `modelName` | `string`                     | The model name or identifier.   |
| `weapons`   | `ArmyModelWeaponSelection[]` | Weapons equipped on this model. |

### `ArmyWargearSelection` (interface)

A wargear selection made for an army unit.

```typescript
interface ArmyWargearSelection {
    wargearOptionId: string;
    choiceId: string;
    choiceName: string;
}
```

| Property          | Type     | Description                                    |
| ----------------- | -------- | ---------------------------------------------- |
| `wargearOptionId` | `string` | The wargear option ID from the unit datasheet. |
| `choiceId`        | `string` | The chosen wargear choice ID.                  |
| `choiceName`      | `string` | The chosen wargear choice name for display.    |

### `ArmyEnhancement` (interface)

An enhancement applied to a Character unit. Max 3 per army, each must be unique, only Characters can take them.

```typescript
interface ArmyEnhancement {
    enhancementId: string;
    enhancementName: string;
    points: number;
}
```

| Property          | Type     | Description                           |
| ----------------- | -------- | ------------------------------------- |
| `enhancementId`   | `string` | The enhancement ID from faction data. |
| `enhancementName` | `string` | The enhancement name for display.     |
| `points`          | `number` | Points cost of the enhancement.       |

### `ArmyUnit` (interface)

A unit in an army list with user-configured selections and state.

```typescript
interface ArmyUnit {
    id: string;
    unitId: string;
    unitName: string;
    modelCount: number;
    totalPoints: number;
    modelConfigs: ArmyModelConfig[];
    wargearSelections: ArmyWargearSelection[];
    enhancement: ArmyEnhancement | null;
    leadingUnitId: string | null;
}
```

| Property            | Type                      | Description                                         |
| ------------------- | ------------------------- | --------------------------------------------------- |
| `id`                | `string`                  | Unique identifier for this army unit instance.      |
| `unitId`            | `string`                  | The unit datasheet ID from faction data.            |
| `unitName`          | `string`                  | The unit name for display.                          |
| `modelCount`        | `number`                  | Number of models in this unit.                      |
| `totalPoints`       | `number`                  | Total points cost including all selections.         |
| `modelConfigs`      | `ArmyModelConfig[]`       | Per-model weapon configurations.                    |
| `wargearSelections` | `ArmyWargearSelection[]`  | Wargear selections for this unit.                   |
| `enhancement`       | `ArmyEnhancement \| null` | Enhancement applied to this unit (Characters only). |
| `leadingUnitId`     | `string \| null`          | ID of the unit this Leader is attached to.          |

### `ArmyVersion` (interface)

A snapshot of the army at a specific point in time.

```typescript
interface ArmyVersion {
    version: number;
    savedAt: string;
    changeNote: string;
    units: ArmyUnit[];
    totalPoints: number;
}
```

| Property      | Type         | Description                             |
| ------------- | ------------ | --------------------------------------- |
| `version`     | `number`     | Version number for this snapshot.       |
| `savedAt`     | `string`     | When this version was saved (ISO 8601). |
| `changeNote`  | `string`     | User-provided note about changes.       |
| `units`       | `ArmyUnit[]` | Units in this version.                  |
| `totalPoints` | `number`     | Total points in this version.           |

### `BattleSize` (type alias)

Battle size determines the points limit for an army.

```typescript
type BattleSize = 'Incursion' | 'StrikeForce' | 'Onslaught';
```

| Value           | Points | Duration | Battlefield |
| --------------- | ------ | -------- | ----------- |
| `'Incursion'`   | 1000   | ~2 hours | 44" x 60"   |
| `'StrikeForce'` | 2000   | ~3 hours | 44" x 60"   |
| `'Onslaught'`   | 3000   | ~4 hours | 44" x 90"   |

### `Army` (interface)

A complete army list with unit selections, configurations, and version history.

```typescript
interface Army {
    id: string;
    ownerId: string;
    name: string;
    factionId: string;
    factionName: string;
    detachmentId: string | null;
    detachmentName: string | null;
    warlordUnitId: string | null;
    battleSize: BattleSize;
    pointsLimit: number;
    units: ArmyUnit[];
    totalPoints: number;
    notes: string;
    versions: ArmyVersion[];
    currentVersion: number;
    createdAt: string;
    updatedAt: string;
}
```

| Property         | Type             | Description                                   |
| ---------------- | ---------------- | --------------------------------------------- |
| `id`             | `string`         | Unique army identifier.                       |
| `ownerId`        | `string`         | User ID of the army owner.                    |
| `name`           | `string`         | Army name for display.                        |
| `factionId`      | `string`         | Faction ID from faction data.                 |
| `factionName`    | `string`         | Faction name for display.                     |
| `detachmentId`   | `string \| null` | Detachment ID, if selected.                   |
| `detachmentName` | `string \| null` | Detachment name for display.                  |
| `warlordUnitId`  | `string \| null` | ID of the Warlord unit (must be a Character). |
| `battleSize`     | `BattleSize`     | Battle size determining points limit.         |
| `pointsLimit`    | `number`         | Points limit (1000, 2000, or 3000).           |
| `units`          | `ArmyUnit[]`     | Current units in the army.                    |
| `totalPoints`    | `number`         | Sum of all unit costs.                        |
| `notes`          | `string`         | User-provided notes.                          |
| `versions`       | `ArmyVersion[]`  | Version history snapshots.                    |
| `currentVersion` | `number`         | Index of the current version.                 |
| `createdAt`      | `string`         | Creation timestamp (ISO 8601).                |
| `updatedAt`      | `string`         | Last update timestamp (ISO 8601).             |

## Usage Example

```typescript
import type { Army, ArmyUnit, BattleSize } from '@armoury/shared';

const army: Army = {
    id: 'army-1',
    ownerId: 'user-123',
    name: 'Ultramarines Strike Force',
    factionId: 'space-marines',
    factionName: 'Space Marines',
    detachmentId: null,
    detachmentName: null,
    warlordUnitId: 'unit-captain',
    battleSize: 'StrikeForce',
    pointsLimit: 2000,
    units: [],
    totalPoints: 0,
    notes: '',
    versions: [],
    currentVersion: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
```
