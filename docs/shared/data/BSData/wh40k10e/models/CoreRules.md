# CoreRules

Core rules interface and parser for `.gst` (game system) files.

**Source:** `src/systems/wh40k10e/src/models/CoreRules.ts` and `src/systems/wh40k10e/src/data/CoreRulesParser.ts`

## Exports

### `ProfileTypeInfo` (type)

Profile type information extracted from the game system. Profile types define the structure of unit datasheets.

```typescript
interface ProfileTypeInfo {
    id: string;
    name: string;
    characteristicTypes: { id: string; name: string }[];
}
```

| Property              | Type             | Description                                                                  |
| --------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `id`                  | `string`         | Unique identifier for this profile type.                                     |
| `name`                | `string`         | Name (e.g., `"Unit"`, `"Ranged Weapons"`, `"Melee Weapons"`, `"Abilities"`). |
| `characteristicTypes` | `{ id, name }[]` | Characteristics in this profile type (e.g., M, T, SV, W, LD, OC for Unit).   |

### `CostTypeInfo` (type)

Cost type information extracted from the game system.

```typescript
interface CostTypeInfo {
    id: string;
    name: string;
    defaultCostLimit?: string;
}
```

| Property           | Type                  | Description                            |
| ------------------ | --------------------- | -------------------------------------- |
| `id`               | `string`              | Unique identifier.                     |
| `name`             | `string`              | Name (e.g., `"pts"`, `"Power Level"`). |
| `defaultCostLimit` | `string \| undefined` | Default cost limit, if any.            |

### `SharedRule` (type)

Shared rule extracted from the game system. Global rules that apply across all factions.

```typescript
interface SharedRule {
    id: string;
    name: string;
    description?: string;
}
```

### `CoreRules` (interface)

Plain interface representing the foundational rules structure extracted from a game system file. Contains profile types, cost types, shared rules, categories, and constraints that all faction catalogues build upon.

```typescript
interface CoreRules {
    id: string;
    name: string;
    revision: string;
    battleScribeVersion: string;
    profileTypes: ProfileTypeInfo[];
    costTypes: CostTypeInfo[];
    sharedRules: SharedRule[];
    categories: { id: string; name: string }[];
    constraints: ParsedConstraint[];
    lastSynced: Date;
    sourceFile: string;
}
```

| Property              | Type                 | Description                                             |
| --------------------- | -------------------- | ------------------------------------------------------- |
| `id`                  | `string`             | Game system identifier.                                 |
| `name`                | `string`             | Game system name.                                       |
| `revision`            | `string`             | Revision number.                                        |
| `battleScribeVersion` | `string`             | Data format version this system was created with.       |
| `profileTypes`        | `ProfileTypeInfo[]`  | Profile types defining datasheet structure.             |
| `costTypes`           | `CostTypeInfo[]`     | Cost types for unit pricing.                            |
| `sharedRules`         | `SharedRule[]`       | Global shared rules.                                    |
| `categories`          | `{ id, name }[]`     | Unit categories (e.g., `"HQ"`, `"Troops"`, `"Elites"`). |
| `constraints`         | `ParsedConstraint[]` | Army construction constraints.                          |
| `lastSynced`          | `Date`               | Last sync timestamp.                                    |
| `sourceFile`          | `string`             | Path to the source .gst file.                           |

### `hydrateCoreRules(json)`

Reconstructs a `CoreRules` object from a plain object (e.g., from database storage). Handles ISO date string conversion for `lastSynced`.

```typescript
function hydrateCoreRules(json: unknown): CoreRules
```

| Parameter | Type      | Description                                   |
| --------- | --------- | --------------------------------------------- |
| `json`    | `unknown` | Plain object representation of `CoreRules`.   |

**Returns:** Hydrated `CoreRules` object with proper `Date` instances.

### `parseCoreRules(gameSystem, sourceFile)`

Parses a `BattleScribeGameSystem` XML structure into a `CoreRules` object. Extracts profile types, cost types, shared rules, categories, and constraints.

```typescript
function parseCoreRules(
    gameSystem: BattleScribeGameSystem,
    sourceFile: string
): CoreRules
```

| Parameter    | Type                     | Description                    |
| ------------ | ------------------------ | ------------------------------ |
| `gameSystem` | `BattleScribeGameSystem` | Parsed game system XML object. |
| `sourceFile` | `string`                 | Path to the source .gst file.  |

**Returns:** `CoreRules` with extracted game system data.

## Usage Example

```typescript
import type { CoreRules } from '@wh40k10e/models/CoreRules.js';
import { parseCoreRules } from '@wh40k10e/data/CoreRulesParser.js';
import { hydrateCoreRules } from '@wh40k10e/models/CoreRules.js';

const coreRules = parseCoreRules(gameSystem, 'wh40k10e.gst');

console.log(`Game System: ${coreRules.name} (rev ${coreRules.revision})`);
console.log(`Profile Types: ${coreRules.profileTypes.map((pt) => pt.name).join(', ')}`);
console.log(`Categories: ${coreRules.categories.map((c) => c.name).join(', ')}`);

// Serialize: const json = { ...coreRules };
// Hydrate: const restored = hydrateCoreRules(json);
```
