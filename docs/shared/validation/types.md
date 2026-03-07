# Validation Types

Core validation types for the army validation engine.

**Source:** `src/shared/validation/types.ts`

## Exported Types

### `ValidationSeverity`

Severity level for a validation result. Indicates the severity of a validation issue found in an army list.

```typescript
type ValidationSeverity = 'error' | 'warning' | 'info';
```

| Value       | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `'error'`   | Army list is illegal and cannot be used in tournament play.   |
| `'warning'` | Army list may have issues but is technically legal.           |
| `'info'`    | Informational note (e.g., unused points, suboptimal choices). |

### `ValidationCategory`

Category of validation rule that produced a result. Used for grouping and filtering validation results in the UI.

```typescript
type ValidationCategory =
    | 'points'
    | 'composition'
    | 'enhancement'
    | 'wargear'
    | 'leader'
    | 'warlord'
    | 'transport'
    | 'detachment'
    | 'faction'
    | 'general';
```

| Value           | Description                                  |
| --------------- | -------------------------------------------- |
| `'points'`      | Point cost limits and budget constraints.    |
| `'composition'` | Unit selection and datasheet limits.         |
| `'enhancement'` | Enhancement selection and limits.            |
| `'wargear'`     | Wargear and upgrade restrictions.            |
| `'leader'`      | Leader attachment and bodyguard rules.       |
| `'warlord'`     | Warlord selection and requirements.          |
| `'transport'`   | Transport capacity and embark rules.         |
| `'detachment'`  | Detachment selection and requirements.       |
| `'faction'`     | Faction keyword and army construction rules. |
| `'general'`     | General validation rules.                    |

## Exported Interfaces

### `ValidationResult`

A single validation result from the army validation engine. Each result represents one rule check that passed or failed. Failed results with `severity='error'` indicate the army list is illegal.

```typescript
interface ValidationResult {
    id: string;
    passed: boolean;
    severity: ValidationSeverity;
    category: ValidationCategory;
    message: string;
    constraintId?: string;
    unitId?: string;
    unitName?: string;
    details?: Record<string, unknown>;
}
```

| Property       | Type                      | Required | Description                                                  |
| -------------- | ------------------------- | -------- | ------------------------------------------------------------ |
| `id`           | `string`                  | Yes      | Unique identifier for this validation result.                |
| `passed`       | `boolean`                 | Yes      | Whether the rule check passed (`true`) or failed (`false`).  |
| `severity`     | `ValidationSeverity`      | Yes      | Severity of the issue if the check failed.                   |
| `category`     | `ValidationCategory`      | Yes      | Category of the rule that was checked.                       |
| `message`      | `string`                  | Yes      | Human-readable message describing the result.                |
| `constraintId` | `string`                  | No       | The constraint ID that generated this result, if applicable. |
| `unitId`       | `string`                  | No       | The army unit ID this result relates to, if unit-specific.   |
| `unitName`     | `string`                  | No       | The army unit name for display, if unit-specific.            |
| `details`      | `Record<string, unknown>` | No       | Additional context for debugging or detailed error displays. |

### `ValidationSummary`

Summary of all validation results for an army. Aggregates all validation results into a single summary object with counts and the complete list of individual results.

```typescript
interface ValidationSummary {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    results: ValidationResult[];
}
```

| Property       | Type                 | Description                                                |
| -------------- | -------------------- | ---------------------------------------------------------- |
| `isValid`      | `boolean`            | Whether the army is fully legal (`errorCount === 0`).      |
| `errorCount`   | `number`             | Total number of errors (army is illegal).                  |
| `warningCount` | `number`             | Total number of warnings (potential issues, but legal).    |
| `infoCount`    | `number`             | Total number of informational notes.                       |
| `results`      | `ValidationResult[]` | All individual validation results, both passed and failed. |

## Usage

```typescript
import type { ValidationSeverity, ValidationCategory, ValidationResult, ValidationSummary } from '@armoury/shared';

function displayResults(summary: ValidationSummary): void {
    console.log(`Valid: ${summary.isValid}`);
    console.log(`Errors: ${summary.errorCount}, Warnings: ${summary.warningCount}`);

    for (const result of summary.results) {
        if (!result.passed) {
            console.log(`[${result.severity}] ${result.category}: ${result.message}`);
        }
    }
}
```
