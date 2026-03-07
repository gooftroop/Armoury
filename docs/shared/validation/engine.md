# Validation Engine

Main validation orchestrator that runs all rule validators against an army list.

**Source:** `src/shared/validation/engine.ts`

## Exported Functions

### `validateArmy`

Validates an army list against faction data and core rules. Runs all six rule validators (points, composition, enhancements, leaders, wargear, and warlord) and collects results into a `ValidationSummary`.

Each rule validator receives the `FactionData` directly and performs its own lookups against the unit and enhancement arrays. Results are aggregated with error/warning/info counts to determine overall army legality.

```typescript
function validateArmy(army: Army, factionData: FactionData, coreRules: CoreRules): ValidationSummary;
```

**Parameters:**

| Name          | Type               | Description                                                                                                                                      |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `army`        | `Army`             | The army list to validate, containing units, enhancements, warlord designation, etc.                                                             |
| `factionData` | `FactionData` | The faction data containing all available units, enhancements, and rules for the selected faction. Passed directly to each rule validator. |
| `coreRules`   | `CoreRules`   | The core rules (currently unused but reserved for future rule-based validation).                                                           |

**Returns:** `ValidationSummary` containing the overall validity status, error/warning/info counts, and an array of detailed `ValidationResult` objects from all rule validators.

**Validators executed (in order):**

1. `validatePoints` -- Points budget and unit cost checks
2. `validateComposition` -- Model count and datasheet limit checks
3. `validateEnhancements` -- Enhancement assignment constraint checks
4. `validateLeaders` -- Leader attachment rule checks
5. `validateWargear` -- Wargear selection constraint checks
6. `validateWarlord` -- Warlord designation checks

The army is considered valid (`isValid: true`) when there are zero errors. Warnings and info messages do not affect validity.

## Usage

```typescript
import { validateArmy } from '@armoury/shared';
import type { Army } from '@armoury/shared';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import type { CoreRules } from '@wh40k10e/models/CoreRules.js';

const army: Army = {
    /* ... */
};
const factionData: FactionData = {
    /* ... */
};
const coreRules: CoreRules = {
    /* ... */
};

const summary = validateArmy(army, factionData, coreRules);

if (!summary.isValid) {
    console.log(`Army has ${summary.errorCount} errors`);

    for (const result of summary.results) {
        if (!result.passed && result.severity === 'error') {
            console.log(`[${result.category}] ${result.message}`);
        }
    }
}
```
