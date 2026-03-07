# Points Validation

Validates army points against the battle size limit and unit composition costs.

**Source:** `src/shared/validation/rules/points.ts`

## Exported Functions

### `validatePoints`

Validates that the army's total points do not exceed the battle size limit and that each unit's points match a valid composition option from its datasheet.

```typescript
function validatePoints(army: Army, factionData: FactionDataModel): ValidationResult[];
```

**Parameters:**

| Name          | Type               | Description                                                                                                                                         |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `army`        | `Army`             | The army list to validate, containing units and `pointsLimit` from battle size selection.                                                           |
| `factionData` | `FactionDataModel` | The faction data model containing unit definitions with composition options. Used to look up each unit's valid model count and points combinations. |

**Returns:** `ValidationResult[]` -- Error results for points violations and an info result for remaining points.

## Internal Checks

The validator runs three checks:

### `checkPointsLimit`

Ensures the army's `totalPoints` does not exceed the `pointsLimit` set by the selected battle size (Incursion 1000, Strike Force 2000, Onslaught 3000).

- **Result ID:** `points-over-limit`
- **Severity:** `error`
- **Details:** `totalPoints`, `pointsLimit`, `overBy`

### `checkUnitPointsMatchComposition`

For each unit in the army, verifies that the selected model count and total points match a valid composition option from the unit's datasheet. Each unit datasheet defines composition options with a model count and corresponding points cost.

- **Result ID:** `points-unit-mismatch-{armyUnit.id}`
- **Severity:** `error`
- **Details:** `unitId`, `modelCount`, `unitPoints`

### `checkRemainingPoints`

Reports the remaining points budget as an informational result. Always included in results regardless of pass/fail state.

- **Result ID:** `points-remaining`
- **Severity:** `info`
- **Details:** `totalPoints`, `pointsLimit`, `remainingPoints`

## Usage

```typescript
import { validatePoints } from '@armoury/shared';
import type { Army } from '@armoury/shared';
import type { FactionDataModel } from '@armoury/shared';

const army: Army = {
    totalPoints: 1850,
    pointsLimit: 2000,
    units: [{ id: 'u1', unitId: 'intercessors', unitName: 'Intercessors', modelCount: 10, totalPoints: 160 /* ... */ }],
    /* ... */
};

const factionData: FactionDataModel = {
    /* ... */
};

const results = validatePoints(army, factionData);

for (const result of results) {
    if (!result.passed) {
        console.log(`[${result.severity}] ${result.message}`);
    }
}
```
