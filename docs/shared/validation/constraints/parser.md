# Constraint Parser

Parses constraint XML elements into typed `ParsedConstraint` objects.

**Source:** `src/shared/validation/constraints/parser.ts`

## Exported Functions

### `parseConstraint`

Parses a single constraint XML element into a `ParsedConstraint`. Maps XML attributes (`@_type`, `@_field`, `@_scope`, `@_value`, `@_id`) to the `ParsedConstraint` interface fields.

```typescript
function parseConstraint(
    constraint: BattleScribeConstraint,
    sourceEntryId?: string,
    sourceEntryName?: string,
): ParsedConstraint;
```

**Parameters:**

| Name              | Type                     | Description                                          |
| ----------------- | ------------------------ | ---------------------------------------------------- |
| `constraint`      | `BattleScribeConstraint` | The constraint XML element to parse.                 |
| `sourceEntryId`   | `string`                 | Optional ID of the entry this constraint belongs to. |
| `sourceEntryName` | `string`                 | Optional human-readable name of the source entry.    |

**Returns:** `ParsedConstraint` -- A typed constraint object ready for validation.

**Parsing rules:**

- `value` is parsed as an integer via `parseInt`; defaults to `0` if `NaN`
- `field` defaults to `'selections'` if not present in the XML
- `scope` defaults to `'self'` if not present in the XML

### `parseConstraints`

Batch version of `parseConstraint()` that handles constraint containers. Normalizes single constraint elements to arrays using `ensureArray()` and parses each constraint individually. Returns an empty array if the container is undefined.

```typescript
function parseConstraints(
    container: { constraint: BattleScribeConstraint | BattleScribeConstraint[] } | undefined,
    sourceEntryId?: string,
    sourceEntryName?: string,
): ParsedConstraint[];
```

**Parameters:**

| Name              | Type                                                                              | Description                                                               |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `container`       | `{ constraint: BattleScribeConstraint \| BattleScribeConstraint[] } \| undefined` | The constraints container with a `constraint` property (single or array). |
| `sourceEntryId`   | `string`                                                                          | Optional ID of the entry these constraints belong to.                     |
| `sourceEntryName` | `string`                                                                          | Optional human-readable name of the source entry.                         |

**Returns:** `ParsedConstraint[]` -- Array of parsed constraint objects. Empty array if container is undefined.

## Usage

```typescript
import { parseConstraint, parseConstraints } from '@armoury/shared';
import type { BattleScribeConstraint } from '@armoury/shared';

// Parse a single constraint
const bsConstraint: BattleScribeConstraint = {
    '@_id': 'c-001',
    '@_type': 'max',
    '@_field': 'selections',
    '@_scope': 'roster',
    '@_value': '3',
};

const parsed = parseConstraint(bsConstraint, 'entry-1', 'Intercessors');
// { id: 'c-001', constraintType: 'max', value: 3, field: 'selections', scope: 'roster', ... }

// Parse a container of constraints
const container = {
    constraint: [
        { '@_id': 'c-001', '@_type': 'max', '@_field': 'selections', '@_scope': 'roster', '@_value': '3' },
        { '@_id': 'c-002', '@_type': 'max', '@_field': 'points', '@_scope': 'roster', '@_value': '500' },
    ],
};

const constraints = parseConstraints(container, 'entry-1', 'Intercessors');
// [ParsedConstraint, ParsedConstraint]
```
