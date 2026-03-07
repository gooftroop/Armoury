# XML Parser

BattleScribe XML parser for game system and catalogue data files.

**Source:** `src/shared/lib/xml-parser.ts`

## Overview

Parses BattleScribe `.gst` (game system) and `.cat` (catalogue) XML files into typed TypeScript objects. Uses [`fast-xml-parser`](https://github.com/NaturalIntelligence/fast-xml-parser) under the hood with a preconfigured parser instance that handles BattleScribe-specific XML conventions (attribute prefixing, array coercion for known repeating elements).

The parser is configured with:

- `attributeNamePrefix: '@_'` -- XML attributes are prefixed with `@_` on parsed objects
- `isArray` -- elements like `selectionEntry`, `profile`, `characteristic`, etc. are always parsed as arrays

## Exported Functions

### `parseGameSystem`

Parses a game system XML string (`.gst` file). Game system files define core rules, characteristic types, weapon profile types, and shared abilities for a tabletop game system.

```typescript
function parseGameSystem(xml: string): BattleScribeGameSystem;
```

**Parameters:**

| Name  | Type     | Description                                    |
| ----- | -------- | ---------------------------------------------- |
| `xml` | `string` | Raw XML string from a BattleScribe `.gst` file |

**Returns:** `BattleScribeGameSystem` -- parsed object with a `gameSystem` root element containing all nested data (profile types, category entries, shared profiles, etc.).

**Throws:** `XmlParseError` if the XML is invalid, malformed, or missing the `gameSystem` root element.

**Example:**

```typescript
import { parseGameSystem } from '@armoury/shared';

const xml = await fs.readFile('wh40k10e.gst', 'utf-8');
const gameSystem = parseGameSystem(xml);

console.log(gameSystem.gameSystem['@_name']);
// Game system name
```

---

### `parseCatalogue`

Parses a faction catalogue XML string (`.cat` file). Catalogue files define all units, weapons, abilities, and wargear options for a specific faction.

```typescript
function parseCatalogue(xml: string): BattleScribeCatalogue;
```

**Parameters:**

| Name  | Type     | Description                                    |
| ----- | -------- | ---------------------------------------------- |
| `xml` | `string` | Raw XML string from a BattleScribe `.cat` file |

**Returns:** `BattleScribeCatalogue` -- parsed object with a `catalogue` root element containing selection entries, shared profiles, and all nested faction data.

**Throws:** `XmlParseError` if the XML is invalid, malformed, or missing the `catalogue` root element.

**Example:**

```typescript
import { parseCatalogue } from '@armoury/shared';

const xml = await fs.readFile('Imperium_-_Space_Marines.cat', 'utf-8');
const catalogue = parseCatalogue(xml);

console.log(catalogue.catalogue['@_name']);
// "Imperium - Space Marines"
```

---

### `extractUnits`

Extracts all unit definitions from a parsed catalogue. Iterates through both regular and shared selection entries, processing those with `type='unit'`. For each unit, extracts the full profile: characteristics (M, T, SV, W, LD, OC, INV), ranged and melee weapons, abilities, wargear abilities, leader info, and keywords.

```typescript
function extractUnits(catalogue: BattleScribeCatalogue, sourceFile: string, sourceSha: string): Unit[];
```

**Parameters:**

| Name         | Type                    | Description                                     |
| ------------ | ----------------------- | ----------------------------------------------- |
| `catalogue`  | `BattleScribeCatalogue` | Parsed catalogue object from `parseCatalogue()` |
| `sourceFile` | `string`                | Source file path for tracking data origin       |
| `sourceSha`  | `string`                | Git SHA of the source file for version tracking |

**Returns:** `Unit[]` -- array of unit objects with all extracted data including weapons, abilities, keywords, and characteristics.

**Example:**

```typescript
import { parseCatalogue, extractUnits } from '@armoury/shared';

const xml = await fs.readFile('Imperium_-_Space_Marines.cat', 'utf-8');
const catalogue = parseCatalogue(xml);
const units = extractUnits(catalogue, 'Imperium_-_Space_Marines.cat', 'abc123');

for (const unit of units) {
    console.log(unit.name, `T${unit.toughness}`, `${unit.wounds}W`);
    console.log(
        '  Ranged:',
        unit.rangedWeapons.map((w) => w.name),
    );
    console.log(
        '  Melee:',
        unit.meleeWeapons.map((w) => w.name),
    );
    console.log('  Keywords:', unit.keywords);
}
```

---

### `extractWeapons`

Extracts all weapon definitions from a parsed catalogue. Collects weapons from two sources: weapon profiles nested within selection entries (units and options), and shared weapon profiles in the catalogue's `sharedProfiles` section. Processes both ranged and melee weapons, extracting characteristics (Range, A, BS/WS, S, AP, D) and parsing keyword strings into structured weapon ability data.

```typescript
function extractWeapons(catalogue: BattleScribeCatalogue, sourceFile: string, sourceSha: string): Weapon[];
```

**Parameters:**

| Name         | Type                    | Description                                     |
| ------------ | ----------------------- | ----------------------------------------------- |
| `catalogue`  | `BattleScribeCatalogue` | Parsed catalogue object from `parseCatalogue()` |
| `sourceFile` | `string`                | Source file path for tracking data origin       |
| `sourceSha`  | `string`                | Git SHA of the source file for version tracking |

**Returns:** `Weapon[]` -- array of weapon objects (`RangedWeapon | MeleeWeapon`) with all extracted characteristics, raw keyword strings, and parsed keyword effects.

**Example:**

```typescript
import { parseCatalogue, extractWeapons, isRangedWeapon, isMeleeWeapon } from '@armoury/shared';

const xml = await fs.readFile('Imperium_-_Space_Marines.cat', 'utf-8');
const catalogue = parseCatalogue(xml);
const weapons = extractWeapons(catalogue, 'Imperium_-_Space_Marines.cat', 'abc123');

for (const weapon of weapons) {
    if (isRangedWeapon(weapon)) {
        console.log(`${weapon.name} Range:${weapon.range} S:${weapon.strength} AP:${weapon.ap}`);
    }
    if (isMeleeWeapon(weapon)) {
        console.log(`${weapon.name} (Melee) S:${weapon.strength} AP:${weapon.ap}`);
    }
    if (weapon.keywords.length > 0) {
        console.log('  Keywords:', weapon.keywords.join(', '));
    }
}
```

---

### `extractAbilities`

Extracts all shared ability definitions from a parsed catalogue. Collects abilities from the catalogue's `sharedProfiles` section, filtering for profiles with `typeName='Abilities'`. These are shared abilities referenced by multiple units, defined once at the catalogue level.

```typescript
function extractAbilities(catalogue: BattleScribeCatalogue, sourceFile: string, sourceSha: string): Ability[];
```

**Parameters:**

| Name         | Type                    | Description                                     |
| ------------ | ----------------------- | ----------------------------------------------- |
| `catalogue`  | `BattleScribeCatalogue` | Parsed catalogue object from `parseCatalogue()` |
| `sourceFile` | `string`                | Source file path for tracking data origin       |
| `sourceSha`  | `string`                | Git SHA of the source file for version tracking |

**Returns:** `Ability[]` -- array of ability objects with `id`, `name`, `description`, and source tracking fields.

**Example:**

```typescript
import { parseCatalogue, extractAbilities } from '@armoury/shared';

const xml = await fs.readFile('Imperium_-_Space_Marines.cat', 'utf-8');
const catalogue = parseCatalogue(xml);
const abilities = extractAbilities(catalogue, 'Imperium_-_Space_Marines.cat', 'abc123');

for (const ability of abilities) {
    console.log(`${ability.name}: ${ability.description}`);
}
```

## Dependencies

- **fast-xml-parser** -- XML parsing engine. Configured with attribute prefix `@_` and automatic array coercion for known repeating elements (`selectionEntry`, `profile`, `characteristic`, `categoryLink`, etc.).
- **XmlParseError** -- custom error class from `@armoury/shared` thrown on parse failures.
- **parseWeaponKeywords** -- internal validation utility that converts raw keyword strings (e.g., `"Lethal Hits"`, `"Sustained Hits 1"`) into structured `WeaponKeyword` objects.
