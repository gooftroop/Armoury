# Leaders Validation

Validates leader attachment rules for Character units leading Bodyguard units.

**Source:** `src/shared/validation/rules/leaders.ts`

## Exported Functions

### `validateLeaders`

Validates that leader assignments comply with all attachment rules. Characters with the Leader ability can attach to specific Bodyguard units, forming an Attached unit.

```typescript
function validateLeaders(army: Army, factionData: FactionDataModel): ValidationResult[];
```

**Parameters:**

| Name          | Type               | Description                                                                                                         |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `army`        | `Army`             | The army list to validate, containing units with optional `leadingUnitId` assignments.                              |
| `factionData` | `FactionDataModel` | The faction data model containing unit definitions with keywords, Character status, and Leader ability definitions. |

**Returns:** `ValidationResult[]` -- Error results for leader violations (self-assignment, non-Character leaders, missing ability, invalid targets, multiple leaders).

## Internal Checks

The validator runs five checks on each unit that has a `leadingUnitId` set:

### `checkLeaderNotSelf`

Verifies that a leader is not assigned to lead itself.

- **Result ID:** `leader-self-{armyUnit.id}`
- **Severity:** `error`

### `checkLeaderIsCharacter`

Verifies that a leader unit has the Character keyword. Only Character units can be leaders.

- **Result ID:** `leader-not-character-{armyUnit.id}`
- **Severity:** `error`

### `checkLeaderHasAbility`

Verifies that a leader unit has the Leader ability defined in its datasheet. The Leader ability contains the `canAttachTo` list of valid target unit names.

- **Result ID:** `leader-missing-ability-{armyUnit.id}`
- **Severity:** `error`

### `checkLeaderCanAttachToTarget`

Verifies that the leader's `canAttachTo` list includes the target unit name. Each leader's datasheet specifies which unit types it can attach to.

- **Result ID:** `leader-invalid-target-{armyUnit.id}`
- **Severity:** `error`
- **Details:** `allowedTargets`, `targetUnitName`

### `checkTargetNotAlreadyLed`

Verifies that a target unit does not already have a leader assigned. Each target unit can only have one leader. The validator tracks assignments in a map to detect duplicates.

- **Result ID:** `leader-multiple-{targetUnit.id}`
- **Severity:** `error`
- **Details:** `existingLeaderId`, `newLeaderId`

## Usage

```typescript
import { validateLeaders } from '@armoury/shared';
import type { Army } from '@armoury/shared';
import type { FactionDataModel } from '@armoury/shared';

const army: Army = {
    units: [
        {
            id: 'u1',
            unitId: 'captain',
            unitName: 'Captain',
            leadingUnitId: 'u2',
            /* ... */
        },
        {
            id: 'u2',
            unitId: 'intercessors',
            unitName: 'Intercessors',
            /* ... */
        },
    ],
    /* ... */
};

const factionData: FactionDataModel = {
    /* ... */
};

const results = validateLeaders(army, factionData);

for (const result of results) {
    if (!result.passed) {
        console.log(`[${result.severity}] ${result.message}`);
    }
}
```
