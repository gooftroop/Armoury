# Wargear Validation

Validates wargear selection constraints for army units.

**Source:** `src/shared/validation/rules/wargear.ts`

## Exported Functions

### `validateWargear`

Validates that wargear selections for each unit reference valid options and choices, and that selection counts fall within the defined min/max bounds.

```typescript
function validateWargear(army: Army, factionData: FactionDataModel): ValidationResult[];
```

**Parameters:**

| Name          | Type               | Description                                                                                                  |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `army`        | `Army`             | The army list to validate, containing units with wargear selections.                                         |
| `factionData` | `FactionDataModel` | The faction data model containing unit definitions with wargear options and their constraints for each unit. |

**Returns:** `ValidationResult[]` -- Error results for wargear violations (invalid options, invalid choices, min/max selection violations).

## Internal Checks

The validator runs four checks on wargear selections for each unit:

### `checkWargearOptionExists`

Verifies that each wargear selection references a valid wargear option ID from the unit's datasheet.

- **Result ID:** `wargear-invalid-option-{armyUnit.id}-{selection.wargearOptionId}`
- **Severity:** `error`
- **Details:** `wargearOptionId`, `choiceId`

### `checkWargearChoiceExists`

Verifies that each wargear selection references a valid choice ID within its selected wargear option.

- **Result ID:** `wargear-invalid-choice-{armyUnit.id}-{selection.choiceId}`
- **Severity:** `error`
- **Details:** `wargearOptionId`, `choiceId`

### `checkWargearMinSelections`

Verifies that the number of selections for each wargear option meets the option's `minSelections` requirement.

- **Result ID:** `wargear-min-{armyUnit.id}-{option.id}`
- **Severity:** `error`
- **Details:** `minSelections`, `currentSelections`

### `checkWargearMaxSelections`

Verifies that the number of selections for each wargear option does not exceed the option's `maxSelections` limit.

- **Result ID:** `wargear-max-{armyUnit.id}-{option.id}`
- **Severity:** `error`
- **Details:** `maxSelections`, `currentSelections`

## Usage

```typescript
import { validateWargear } from '@armoury/shared';
import type { Army } from '@armoury/shared';
import type { FactionDataModel } from '@armoury/shared';

const army: Army = {
    units: [
        {
            id: 'u1',
            unitId: 'intercessors',
            unitName: 'Intercessors',
            wargearSelections: [
                {
                    wargearOptionId: 'opt-1',
                    choiceId: 'choice-bolt-rifle',
                    choiceName: 'Bolt Rifle',
                },
            ],
            /* ... */
        },
    ],
    /* ... */
};

const factionData: FactionDataModel = {
    /* ... */
};

const results = validateWargear(army, factionData);

for (const result of results) {
    if (!result.passed) {
        console.log(`[${result.severity}] ${result.message}`);
    }
}
```
