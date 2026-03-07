# Warlord Validation

Validates warlord designation for the army.

**Source:** `src/shared/validation/rules/warlord.ts`

## Exported Functions

### `validateWarlord`

Validates that the army has a valid warlord designation. Per game system rules, every army must designate exactly one Character unit as the Warlord.

```typescript
function validateWarlord(army: Army, factionData: FactionDataModel): ValidationResult[];
```

**Parameters:**

| Name          | Type               | Description                                                                                                           |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `army`        | `Army`             | The army list to validate, containing the `warlordUnitId` designation.                                                |
| `factionData` | `FactionDataModel` | The faction data model containing unit definitions with keywords, used to verify the warlord unit's Character status. |

**Returns:** `ValidationResult[]` -- Error results for warlord violations (missing designation, invalid unit reference, non-Character warlord).

## Internal Checks

The validator runs three checks in sequence (short-circuiting on failure):

### `checkWarlordDesignated`

Verifies that the army has a `warlordUnitId` set. If not, returns an error and skips remaining checks.

- **Result ID:** `warlord-missing`
- **Severity:** `error`

### `checkWarlordExistsInArmy`

Verifies that the `warlordUnitId` references a unit that actually exists in the army's unit list. Returns either the found `ArmyUnit` or a `ValidationResult` error. If the unit is not found, returns an error and skips the Character check.

- **Result ID:** `warlord-invalid-{army.warlordUnitId}`
- **Severity:** `error`
- **Details:** `warlordUnitId`

### `checkWarlordIsCharacter`

Verifies that the designated warlord unit has the Character keyword. Only Character models can be designated as the Warlord.

- **Result ID:** `warlord-not-character-{warlordUnit.id}`
- **Severity:** `error`

## Usage

```typescript
import { validateWarlord } from '@armoury/shared';
import type { Army } from '@armoury/shared';
import type { FactionDataModel } from '@armoury/shared';

const army: Army = {
    warlordUnitId: 'u1',
    units: [
        {
            id: 'u1',
            unitId: 'captain',
            unitName: 'Captain',
            /* ... */
        },
    ],
    /* ... */
};

const factionData: FactionDataModel = {
    /* ... */
};

const results = validateWarlord(army, factionData);

if (results.length === 0) {
    console.log('Warlord designation is valid');
}
```
