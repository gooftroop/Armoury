# Composition Validation

Validates unit composition rules for model counts and datasheet limits.

**Source:** `src/shared/validation/rules/composition.ts`

## Exported Functions

### `validateComposition`

Validates that each unit's model count matches a valid composition option and that the number of copies of each datasheet does not exceed the maximum allowed.

```typescript
function validateComposition(army: Army, factionData: FactionDataModel): ValidationResult[];
```

**Parameters:**

| Name          | Type               | Description                                                                                                           |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `army`        | `Army`             | The army list to validate, containing all units with their model counts.                                              |
| `factionData` | `FactionDataModel` | The faction data model containing unit definitions with composition options, keywords, and constraints for each unit. |

**Returns:** `ValidationResult[]` -- Error results for invalid model counts or datasheet limit violations.

## Internal Checks

The validator runs two main checks:

### `checkModelCount`

For each unit, verifies the selected model count matches a valid composition option from the unit's datasheet (e.g., 5, 10, or 20 models).

- **Result ID:** `composition-invalid-size-{armyUnit.id}`
- **Severity:** `error`
- **Details:** `unitId`, `modelCount`

### `checkDatasheetLimit`

For each unique unit datasheet, verifies the number of copies does not exceed the maximum allowed. Default limits per game system rules:

- **3** copies for standard units
- **6** copies for Battleline or Dedicated Transport units

These defaults can be overridden by a roster-scope `max-selections` constraint from the game data (via `ParsedConstraint`). The validator first checks for a constraint override using `getRosterMaxConstraint`, then falls back to `getDefaultMaxCount`.

- **Result ID:** `composition-max-{maxAllowed}-{unitId}`
- **Severity:** `error`
- **Details:** `unitId`, `unitName`, `count`, `maxAllowed`, `constraintMax`

### `getRosterMaxConstraint` (helper)

Searches a unit's parsed constraints for a roster-scope max-selections constraint. Returns the constraint value if found, or `null` to use the default.

### `getDefaultMaxCount` (helper)

Determines the default max count based on unit keywords. Returns 6 for Battleline or Dedicated Transport units, 3 for all others.

## Usage

```typescript
import { validateComposition } from '@armoury/shared';
import type { Army } from '@armoury/shared';
import type { FactionDataModel } from '@armoury/shared';

const army: Army = {
    units: [
        { id: 'u1', unitId: 'intercessors', unitName: 'Intercessors', modelCount: 5 /* ... */ },
        { id: 'u2', unitId: 'intercessors', unitName: 'Intercessors', modelCount: 10 /* ... */ },
        { id: 'u3', unitId: 'intercessors', unitName: 'Intercessors', modelCount: 5 /* ... */ },
    ],
    /* ... */
};

const factionData: FactionDataModel = {
    /* ... */
};

const results = validateComposition(army, factionData);

for (const result of results) {
    if (!result.passed) {
        console.log(`[${result.severity}] ${result.message}`);
    }
}
```
