# Enhancements Validation

Validates enhancement assignment constraints for army units.

**Source:** `src/shared/validation/rules/enhancements.ts`

## Exported Functions

### `validateEnhancements`

Validates that enhancements assigned to units comply with all enhancement rules.

```typescript
function validateEnhancements(army: Army, factionData: FactionDataModel): ValidationResult[];
```

**Parameters:**

| Name          | Type               | Description                                                                                                                                                   |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `army`        | `Army`             | The army list to validate, containing units with optional enhancement assignments.                                                                            |
| `factionData` | `FactionDataModel` | The faction data model containing unit definitions (for keyword and Character status lookups) and enhancement definitions (for `eligibleKeywords` and names). |

**Returns:** `ValidationResult[]` -- Error results for enhancement violations (non-Character units, Epic Heroes, keyword mismatches, max count, duplicates).

## Internal Checks

The validator runs five checks:

### `checkEnhancementRequiresCharacter`

Verifies that a unit receiving an enhancement has the Character keyword. Only Character units can take enhancements.

- **Result ID:** `enhancement-not-character-{armyUnit.id}`
- **Severity:** `error`

### `checkEnhancementForbiddenOnEpicHero`

Verifies that an Epic Hero is not receiving an enhancement. Epic Heroes cannot take enhancements per core rules.

- **Result ID:** `enhancement-epic-hero-{armyUnit.id}`
- **Severity:** `error`

### `checkEnhancementEligibility`

Verifies that the unit meets the enhancement's keyword eligibility requirements. Each enhancement defines an `eligibleKeywords` array; the unit must have all listed keywords.

- **Result ID:** `enhancement-ineligible-{armyUnit.id}`
- **Severity:** `error`
- **Details:** `missingKeywords`

### `checkEnhancementMaxCount`

Verifies that the army does not exceed the maximum of 3 enhancements total.

- **Result ID:** `enhancement-max-3`
- **Severity:** `error`
- **Details:** `count`, `maxAllowed`

### `checkEnhancementUniqueness`

Verifies that no enhancement is selected more than once in the army. Each enhancement must be unique.

- **Result ID:** `enhancement-duplicate-{enhancementId}`
- **Severity:** `error`
- **Details:** `enhancementId`, `count`

## Usage

```typescript
import { validateEnhancements } from '@armoury/shared';
import type { Army } from '@armoury/shared';
import type { FactionDataModel } from '@armoury/shared';

const army: Army = {
    units: [
        {
            id: 'u1',
            unitId: 'captain',
            unitName: 'Captain',
            enhancement: {
                enhancementId: 'e1',
                enhancementName: 'Artificer Armour',
            },
            /* ... */
        },
    ],
    /* ... */
};

const factionData: FactionDataModel = {
    /* ... */
};

const results = validateEnhancements(army, factionData);

for (const result of results) {
    if (!result.passed) {
        console.log(`[${result.severity}] ${result.message}`);
    }
}
```
