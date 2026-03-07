# Constraint Types

Parsed constraint types extracted from game data XML for army construction validation.

**Source:** `src/shared/validation/constraints/types.ts`

## Exported Types

### `ConstraintType`

The type of limit a constraint imposes. Extracted from constraint `@_type` attribute.

```typescript
type ConstraintType = 'min' | 'max' | 'increment';
```

| Value         | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `'min'`       | Minimum value constraint (e.g., "must select at least 1"). |
| `'max'`       | Maximum value constraint (e.g., "can select at most 3").   |
| `'increment'` | Value must be a multiple of the specified amount.          |

### `ConstraintField`

Specifies which aspect of army construction the constraint limits. From `@_field` attribute.

```typescript
type ConstraintField = 'selections' | 'points' | string;
```

| Value          | Description                                               |
| -------------- | --------------------------------------------------------- |
| `'selections'` | Number of times a unit entry can be selected in the army. |
| `'points'`     | Total point cost limits for selections.                   |
| Other `string` | Custom fields defined in game data files.                 |

### `ConstraintScope`

The scope at which a constraint is enforced. From `@_scope` attribute.

```typescript
type ConstraintScope = 'roster' | 'parent' | 'self' | 'force' | string;
```

| Value          | Description                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| `'roster'`     | Applies to the entire army list (e.g., "max 3 units with same datasheet").   |
| `'parent'`     | Applies within the parent selection entry (e.g., "max 2 upgrades per unit"). |
| `'self'`       | Applies to this specific entry only (e.g., "max 1 per model").               |
| `'force'`      | Applies within the force organization structure.                             |
| Other `string` | Custom scopes defined in game data files.                                    |

## Exported Interfaces

### `ParsedConstraint`

A single machine-readable constraint extracted from game data XML. Represents a parsed `<constraint>` element used by the validation engine to check army construction rules at runtime.

```typescript
interface ParsedConstraint {
    id: string;
    constraintType: ConstraintType;
    value: number;
    field: ConstraintField;
    scope: ConstraintScope;
    targetId?: string;
    targetName?: string;
    sourceEntryId?: string;
    sourceEntryName?: string;
}
```

| Property          | Type              | Required | Description                                                   |
| ----------------- | ----------------- | -------- | ------------------------------------------------------------- |
| `id`              | `string`          | Yes      | Unique identifier from constraint `@_id`.                     |
| `constraintType`  | `ConstraintType`  | Yes      | The type of limit: min, max, or increment.                    |
| `value`           | `number`          | Yes      | The limit value (e.g., 3 for "max 3 units").                  |
| `field`           | `ConstraintField` | Yes      | What is being constrained (e.g., `"selections"`, `"points"`). |
| `scope`           | `ConstraintScope` | Yes      | Scope of enforcement (e.g., `"roster"` for army-wide).        |
| `targetId`        | `string`          | No       | The category or entry ID this constraint targets.             |
| `targetName`      | `string`          | No       | Human-readable name for the target (for error messages).      |
| `sourceEntryId`   | `string`          | No       | The selection entry ID this constraint belongs to.            |
| `sourceEntryName` | `string`          | No       | Human-readable name for the source entry.                     |

### `ConstraintSet`

A collection of parsed constraints organized by scope for efficient lookup. Built during data initialization and used by the validation engine.

```typescript
interface ConstraintSet {
    roster: ParsedConstraint[];
    force: ParsedConstraint[];
    parent: Map<string, ParsedConstraint[]>;
    self: Map<string, ParsedConstraint[]>;
}
```

| Property | Type                              | Description                                                     |
| -------- | --------------------------------- | --------------------------------------------------------------- |
| `roster` | `ParsedConstraint[]`              | Constraints that apply at the roster (army) level.              |
| `force`  | `ParsedConstraint[]`              | Constraints that apply at the force level.                      |
| `parent` | `Map<string, ParsedConstraint[]>` | Constraints scoped to a parent entry, keyed by parent entry ID. |
| `self`   | `Map<string, ParsedConstraint[]>` | Constraints scoped to a specific entry, keyed by entry ID.      |

## Usage

```typescript
import type {
    ConstraintType,
    ConstraintField,
    ConstraintScope,
    ParsedConstraint,
    ConstraintSet,
} from '@armoury/shared';

const constraint: ParsedConstraint = {
    id: 'c-001',
    constraintType: 'max',
    value: 3,
    field: 'selections',
    scope: 'roster',
    sourceEntryName: 'Intercessors',
};

const constraintSet: ConstraintSet = {
    roster: [constraint],
    force: [],
    parent: new Map(),
    self: new Map(),
};
```
