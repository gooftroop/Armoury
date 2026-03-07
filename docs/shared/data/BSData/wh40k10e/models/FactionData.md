# FactionData

Faction data interface and parser for `.cat` (catalogue) files.

**Source:** `src/systems/wh40k10e/src/models/FactionData.ts` and `src/systems/wh40k10e/src/data/FactionDataParser.ts`

## Exports

### `FactionRule` (type)

Faction rule data extracted from catalogues. Faction rules apply to all units in a faction.

```typescript
interface FactionRule {
    id: string;
    name: string;
    description: string;
}
```

### `FactionData` (interface)

Plain interface representing all faction catalogue data extracted from `.cat` files. Contains units, weapons, abilities, stratagems, detachments, and enhancements for a single faction.

```typescript
interface FactionData {
    id: string;
    name: string;
    armyImageUrl: string;
    sourceFiles: string[];
    lastSynced: Date;
    factionRules: FactionRule[];
    structuredFactionRules: StructuredRule[];
    stratagems: Stratagem[];
    detachments: Detachment[];
    enhancements: Enhancement[];
    units: Unit[];
    weapons: Weapon[];
    abilities: Ability[];
}
```

| Property                 | Type               | Description                                  |
| ------------------------ | ------------------ | -------------------------------------------- |
| `id`                     | `string`           | Unique faction identifier.                   |
| `name`                   | `string`           | Display name of the faction.                 |
| `armyImageUrl`           | `string`           | URL to faction artwork or logo.              |
| `sourceFiles`            | `string[]`         | Paths to source .cat files that were merged. |
| `lastSynced`             | `Date`             | When this faction data was last synced.      |
| `factionRules`           | `FactionRule[]`    | Faction-specific rules.                      |
| `structuredFactionRules` | `StructuredRule[]` | Parsed faction rules for validation.         |
| `stratagems`             | `Stratagem[]`      | Stratagems available to this faction.        |
| `detachments`            | `Detachment[]`     | Detachments with rules and enhancements.     |
| `enhancements`           | `Enhancement[]`    | Enhancements for Character units.            |
| `units`                  | `Unit[]`           | All unit datasheets in this faction.         |
| `weapons`                | `Weapon[]`         | Shared weapons used by faction units.        |
| `abilities`              | `Ability[]`        | Shared abilities used by faction units.      |

### `hydrateFactionData(json)`

Reconstructs a `FactionData` object from a plain object (e.g., from database or API). Handles ISO date string conversion and ensures all array fields have defaults.

```typescript
function hydrateFactionData(json: unknown): FactionData
```

| Parameter | Type      | Description                                     |
| --------- | --------- | ----------------------------------------------- |
| `json`    | `unknown` | Plain object representation of `FactionData`.   |

**Returns:** Hydrated `FactionData` object with proper `Date` instances.

### `parseFactionData(catalogue, sourceFiles)`

Parses a `BattleScribeCatalogue` XML structure into a `FactionData` object. Extracts all units, weapons, abilities, stratagems, detachments, and enhancements. Populates `structuredAbilities`, `parsedKeywords`, and `structuredFactionRules`.

```typescript
function parseFactionData(
    catalogue: BattleScribeCatalogue,
    sourceFiles: string[]
): FactionData
```

| Parameter     | Type                    | Description                                 |
| ------------- | ----------------------- | ------------------------------------------- |
| `catalogue`   | `BattleScribeCatalogue` | Parsed catalogue XML object.                |
| `sourceFiles` | `string[]`              | Paths to source .cat files (library first). |

**Returns:** `FactionData` with fully extracted faction data.

## Usage Example

```typescript
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import { parseFactionData } from '@wh40k10e/data/FactionDataParser.js';
import { hydrateFactionData } from '@wh40k10e/models/FactionData.js';

const factionData = parseFactionData(catalogue, ['space-marines.cat', 'blood-angels.cat']);

console.log(`${factionData.name}: ${factionData.units.length} units, ${factionData.weapons.length} weapons`);
console.log(`Detachments: ${factionData.detachments.map((d) => d.name).join(', ')}`);
console.log(`Stratagems: ${factionData.stratagems.length}`);

// Serialize: const json = { ...factionData };
// Hydrate: const restored = hydrateFactionData(json);
```
