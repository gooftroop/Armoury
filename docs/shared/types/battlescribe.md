# battlescribe.ts

XML structure types that model the parsed output of `.gst` (game system) and `.cat` (catalogue) files.

**Source:** `src/shared/types/battlescribe.ts`

## Overview

This file defines TypeScript interfaces that mirror the XML structure of community data files as parsed by `fast-xml-parser`. XML attributes are prefixed with `@_` (the parser's default `attributeNamePrefix`). These types are used internally by the XML parser and data extraction layer. The file also exports a utility function `ensureArray` for normalizing parser output.

The data format uses two primary file types:

- **Game System files (`.gst`)** -- Core rules and definitions shared across all factions
- **Catalogue files (`.cat`)** -- Faction-specific units, weapons, abilities, and rules

---

## Interfaces

### `BattleScribeAttributes`

Common XML attributes shared by most BattleScribe elements. Serves as a base interface.

```typescript
interface BattleScribeAttributes {
    '@_id': string;
    '@_name': string;
}
```

| Property   | Type     | Description                          |
| ---------- | -------- | ------------------------------------ |
| `'@_id'`   | `string` | Unique identifier attribute from XML |
| `'@_name'` | `string` | Name attribute from XML              |

---

### `BattleScribeCharacteristicType`

Defines a type of characteristic available in the game system (e.g., M, T, SV, W, LD, OC). Maps to `<characteristicType>` elements in `.gst` files.

```typescript
interface BattleScribeCharacteristicType extends BattleScribeAttributes {
    '@_id': string;
    '@_name': string;
}
```

| Property   | Type     | Description                                         |
| ---------- | -------- | --------------------------------------------------- |
| `'@_id'`   | `string` | Unique identifier for the characteristic type       |
| `'@_name'` | `string` | Display name (e.g., `"M"`, `"Toughness"`, `"Save"`) |

---

### `BattleScribeProfileType`

Defines the structure of a profile type (e.g., Unit, Ranged Weapons, Melee Weapons, Abilities). Maps to `<profileType>` elements in `.gst` files.

```typescript
interface BattleScribeProfileType extends BattleScribeAttributes {
    characteristicTypes?: {
        characteristicType: BattleScribeCharacteristicType | BattleScribeCharacteristicType[];
    };
}
```

| Property              | Type                                     | Description                                                                  |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `characteristicTypes` | `{ characteristicType: ... }` (optional) | Container for characteristic type definitions belonging to this profile type |

---

### `BattleScribeCategory`

Category used to organize units and selections (e.g., HQ, Troops, Elites). Maps to `<categoryEntry>` elements.

```typescript
interface BattleScribeCategory extends BattleScribeAttributes {
    '@_hidden'?: string;
}
```

| Property     | Type                | Description                            |
| ------------ | ------------------- | -------------------------------------- |
| `'@_hidden'` | `string` (optional) | If present, category is hidden from UI |

---

### `BattleScribeCostType`

Defines a cost type in the game system (e.g., pts for points, PL for Power Level). Maps to `<costType>` elements.

```typescript
interface BattleScribeCostType extends BattleScribeAttributes {
    '@_defaultCostLimit'?: string;
}
```

| Property               | Type                | Description                           |
| ---------------------- | ------------------- | ------------------------------------- |
| `'@_defaultCostLimit'` | `string` (optional) | Default cost limit for this cost type |

---

### `BattleScribeCharacteristic`

A single characteristic value within a profile (e.g., M=6", T=4, SV=3+). Maps to `<characteristic>` elements.

```typescript
interface BattleScribeCharacteristic {
    '@_name': string;
    '@_typeId': string;
    '#text'?: string;
}
```

| Property     | Type                | Description                                             |
| ------------ | ------------------- | ------------------------------------------------------- |
| `'@_name'`   | `string`            | Name of the characteristic (e.g., `"M"`, `"Toughness"`) |
| `'@_typeId'` | `string`            | Reference to the characteristic type definition         |
| `'#text'`    | `string` (optional) | The actual value (e.g., `"6\""`, `"4"`, `"3+"`)         |

---

### `BattleScribeProfile`

A profile containing characteristics (unit stats, weapon stats, ability descriptions). Maps to `<profile>` elements.

```typescript
interface BattleScribeProfile extends BattleScribeAttributes {
    '@_typeId': string;
    '@_typeName': string;
    '@_hidden'?: string;
    characteristics?: {
        characteristic: BattleScribeCharacteristic | BattleScribeCharacteristic[];
    };
}
```

| Property          | Type                                 | Description                                                           |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------- |
| `'@_typeId'`      | `string`                             | Reference to the profile type definition                              |
| `'@_typeName'`    | `string`                             | Display name of the profile type (e.g., `"Unit"`, `"Ranged Weapons"`) |
| `'@_hidden'`      | `string` (optional)                  | If present, profile is hidden from UI                                 |
| `characteristics` | `{ characteristic: ... }` (optional) | Container for characteristic values                                   |

---

### `BattleScribeInfoLink`

A reference to another element (shared rule, profile, etc.). Maps to `<infoLink>` elements.

```typescript
interface BattleScribeInfoLink extends BattleScribeAttributes {
    '@_targetId': string;
    '@_type': string;
    '@_hidden'?: string;
}
```

| Property       | Type                | Description                                                    |
| -------------- | ------------------- | -------------------------------------------------------------- |
| `'@_targetId'` | `string`            | ID of the element being referenced                             |
| `'@_type'`     | `string`            | Type of element being referenced (e.g., `"profile"`, `"rule"`) |
| `'@_hidden'`   | `string` (optional) | If present, link is hidden from UI                             |

---

### `BattleScribeCost`

A cost value for a unit or selection (e.g., 100 points). Maps to `<cost>` elements.

```typescript
interface BattleScribeCost {
    '@_name': string;
    '@_typeId': string;
    '@_value': string;
}
```

| Property     | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `'@_name'`   | `string` | Display name of the cost type (e.g., `"pts"`, `"PL"`) |
| `'@_typeId'` | `string` | Reference to the cost type definition                 |
| `'@_value'`  | `string` | The numeric cost value as a string                    |

---

### `BattleScribeConstraint`

A constraint on selections that defines rules for unit composition. Maps to `<constraint>` elements.

```typescript
interface BattleScribeConstraint extends BattleScribeAttributes {
    '@_type': string;
    '@_value': string;
    '@_field': string;
    '@_scope': string;
}
```

| Property    | Type     | Description                                                       |
| ----------- | -------- | ----------------------------------------------------------------- |
| `'@_type'`  | `string` | Constraint type (e.g., `"min"`, `"max"`, `"equal"`)               |
| `'@_value'` | `string` | Constraint value (e.g., `"1"`, `"3"`, `"6"`)                      |
| `'@_field'` | `string` | Field being constrained (e.g., `"selections"`, `"points"`)        |
| `'@_scope'` | `string` | Scope of the constraint (e.g., `"parent"`, `"roster"`, `"force"`) |

---

### `BattleScribeCategoryLink`

Assigns a selection to a category (e.g., HQ, Troops). Maps to `<categoryLink>` elements.

```typescript
interface BattleScribeCategoryLink extends BattleScribeAttributes {
    '@_targetId': string;
    '@_primary'?: string;
    '@_hidden'?: string;
}
```

| Property       | Type                | Description                                     |
| -------------- | ------------------- | ----------------------------------------------- |
| `'@_targetId'` | `string`            | ID of the category being linked                 |
| `'@_primary'`  | `string` (optional) | Flag indicating if this is the primary category |
| `'@_hidden'`   | `string` (optional) | If present, link is hidden from UI              |

---

### `BattleScribeSelectionEntry`

A unit, upgrade, or other selectable item. This is the primary building block of catalogue data. Can contain nested profiles, links, sub-selections, costs, and constraints. Maps to `<selectionEntry>` elements.

```typescript
interface BattleScribeSelectionEntry extends BattleScribeAttributes {
    '@_type': string;
    '@_hidden'?: string;
    '@_collective'?: string;
    '@_import'?: string;
    profiles?: { profile: BattleScribeProfile | BattleScribeProfile[] };
    infoLinks?: { infoLink: BattleScribeInfoLink | BattleScribeInfoLink[] };
    categoryLinks?: { categoryLink: BattleScribeCategoryLink | BattleScribeCategoryLink[] };
    selectionEntries?: { selectionEntry: BattleScribeSelectionEntry | BattleScribeSelectionEntry[] };
    selectionEntryGroups?: { selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[] };
    entryLinks?: { entryLink: BattleScribeEntryLink | BattleScribeEntryLink[] };
    costs?: { cost: BattleScribeCost | BattleScribeCost[] };
    constraints?: { constraint: BattleScribeConstraint | BattleScribeConstraint[] };
}
```

| Property               | Type                | Description                                                |
| ---------------------- | ------------------- | ---------------------------------------------------------- |
| `'@_type'`             | `string`            | Type of selection (e.g., `"unit"`, `"upgrade"`, `"model"`) |
| `'@_hidden'`           | `string` (optional) | If present, entry is hidden from UI                        |
| `'@_collective'`       | `string` (optional) | If present, entry represents a collective unit             |
| `'@_import'`           | `string` (optional) | If present, entry is imported from another file            |
| `profiles`             | (optional)          | Container for profiles (unit stats, weapon stats)          |
| `infoLinks`            | (optional)          | Container for references to shared rules and profiles      |
| `categoryLinks`        | (optional)          | Container for category assignments                         |
| `selectionEntries`     | (optional)          | Container for nested sub-selections                        |
| `selectionEntryGroups` | (optional)          | Container for option groupings                             |
| `entryLinks`           | (optional)          | Container for references to shared selections              |
| `costs`                | (optional)          | Container for points costs                                 |
| `constraints`          | (optional)          | Container for min/max selection constraints                |

---

### `BattleScribeSelectionEntryGroup`

Groups related selection options together (e.g., weapon options, upgrade choices). Maps to `<selectionEntryGroup>` elements.

```typescript
interface BattleScribeSelectionEntryGroup extends BattleScribeAttributes {
    '@_hidden'?: string;
    '@_collective'?: string;
    '@_defaultSelectionEntryId'?: string;
    selectionEntries?: { selectionEntry: BattleScribeSelectionEntry | BattleScribeSelectionEntry[] };
    selectionEntryGroups?: { selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[] };
    entryLinks?: { entryLink: BattleScribeEntryLink | BattleScribeEntryLink[] };
    constraints?: { constraint: BattleScribeConstraint | BattleScribeConstraint[] };
}
```

| Property                      | Type                | Description                                    |
| ----------------------------- | ------------------- | ---------------------------------------------- |
| `'@_hidden'`                  | `string` (optional) | If present, group is hidden from UI            |
| `'@_collective'`              | `string` (optional) | If present, group represents a collective unit |
| `'@_defaultSelectionEntryId'` | `string` (optional) | Default selection entry ID in this group       |
| `selectionEntries`            | (optional)          | Container for selection entries in this group  |
| `selectionEntryGroups`        | (optional)          | Container for nested groups                    |
| `entryLinks`                  | (optional)          | Container for entry links                      |
| `constraints`                 | (optional)          | Container for constraints                      |

---

### `BattleScribeEntryLink`

A reference to a shared selection entry, used to reuse definitions without duplication. Maps to `<entryLink>` elements.

```typescript
interface BattleScribeEntryLink extends BattleScribeAttributes {
    '@_targetId': string;
    '@_type': string;
    '@_hidden'?: string;
    costs?: { cost: BattleScribeCost | BattleScribeCost[] };
    constraints?: { constraint: BattleScribeConstraint | BattleScribeConstraint[] };
}
```

| Property       | Type                | Description                                       |
| -------------- | ------------------- | ------------------------------------------------- |
| `'@_targetId'` | `string`            | ID of the shared selection entry being referenced |
| `'@_type'`     | `string`            | Type of element being referenced                  |
| `'@_hidden'`   | `string` (optional) | If present, link is hidden from UI                |
| `costs`        | (optional)          | Container for costs specific to this link         |
| `constraints`  | (optional)          | Container for constraints specific to this link   |

---

### `BattleScribeSharedSelectionEntry`

Type alias for `BattleScribeSelectionEntry`. Shared selection entries are defined once and referenced via `BattleScribeEntryLink`.

```typescript
type BattleScribeSharedSelectionEntry = BattleScribeSelectionEntry;
```

---

### `BattleScribePublication`

Metadata about the source publication of game data. Maps to `<publication>` elements.

```typescript
interface BattleScribePublication extends BattleScribeAttributes {
    '@_shortName'?: string;
    '@_publisherUrl'?: string;
}
```

| Property           | Type                | Description                                                 |
| ------------------ | ------------------- | ----------------------------------------------------------- |
| `'@_shortName'`    | `string` (optional) | Short name or abbreviation (e.g., `"Core"`, `"Supplement"`) |
| `'@_publisherUrl'` | `string` (optional) | URL to the publisher's website                              |

---

### `BattleScribeRule`

A named rule or ability with description. Maps to `<rule>` elements.

```typescript
interface BattleScribeRule extends BattleScribeAttributes {
    '@_hidden'?: string;
    description?: string;
}
```

| Property      | Type                | Description                              |
| ------------- | ------------------- | ---------------------------------------- |
| `'@_hidden'`  | `string` (optional) | If present, rule is hidden from UI       |
| `description` | `string` (optional) | Full text description of the rule effect |

---

### `BattleScribeGameSystem`

Game System file (`.gst`) structure. Contains core rules and definitions for a game system.

```typescript
interface BattleScribeGameSystem {
    gameSystem: {
        '@_id': string;
        '@_name': string;
        '@_revision': string;
        '@_battleScribeVersion': string;
        '@_authorName'?: string;
        '@_authorContact'?: string;
        '@_authorUrl'?: string;
        publications?: { publication: BattleScribePublication | BattleScribePublication[] };
        costTypes?: { costType: BattleScribeCostType | BattleScribeCostType[] };
        profileTypes?: { profileType: BattleScribeProfileType | BattleScribeProfileType[] };
        categoryEntries?: { categoryEntry: BattleScribeCategory | BattleScribeCategory[] };
        sharedSelectionEntries?: {
            selectionEntry: BattleScribeSharedSelectionEntry | BattleScribeSharedSelectionEntry[];
        };
        sharedSelectionEntryGroups?: {
            selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[];
        };
        sharedProfiles?: { profile: BattleScribeProfile | BattleScribeProfile[] };
        sharedRules?: { rule: BattleScribeRule | BattleScribeRule[] };
    };
}
```

| Property                                | Type       | Description                                       |
| --------------------------------------- | ---------- | ------------------------------------------------- |
| `gameSystem['@_id']`                    | `string`   | Unique identifier for the game system             |
| `gameSystem['@_name']`                  | `string`   | Display name of the game system                   |
| `gameSystem['@_revision']`              | `string`   | Revision number                                   |
| `gameSystem['@_battleScribeVersion']`   | `string`   | Data format version the file was created with     |
| `gameSystem.publications`               | (optional) | Publication references                            |
| `gameSystem.costTypes`                  | (optional) | Cost type definitions (e.g., points, power level) |
| `gameSystem.profileTypes`               | (optional) | Profile type definitions (e.g., Unit, Weapons)    |
| `gameSystem.categoryEntries`            | (optional) | Category definitions (e.g., HQ, Troops)           |
| `gameSystem.sharedSelectionEntries`     | (optional) | Shared selection entries                          |
| `gameSystem.sharedSelectionEntryGroups` | (optional) | Shared selection entry groups                     |
| `gameSystem.sharedProfiles`             | (optional) | Shared profiles                                   |
| `gameSystem.sharedRules`                | (optional) | Shared rules                                      |

```typescript
import type { BattleScribeGameSystem } from '@armoury/shared';

function getProfileTypes(gst: BattleScribeGameSystem): string[] {
    const types = gst.gameSystem.profileTypes?.profileType;
    if (!types) {
        return [];
    }
    const arr = Array.isArray(types) ? types : [types];
    return arr.map((t) => t['@_name']);
}
```

---

### `BattleScribeCatalogue`

Catalogue file (`.cat`) structure. Contains faction-specific units and rules.

```typescript
interface BattleScribeCatalogue {
    catalogue: {
        '@_id': string;
        '@_name': string;
        '@_revision': string;
        '@_battleScribeVersion': string;
        '@_authorName'?: string;
        '@_authorContact'?: string;
        '@_authorUrl'?: string;
        '@_library'?: string;
        '@_gameSystemId': string;
        '@_gameSystemRevision': string;
        publications?: { publication: BattleScribePublication | BattleScribePublication[] };
        categoryEntries?: { categoryEntry: BattleScribeCategory | BattleScribeCategory[] };
        entryLinks?: { entryLink: BattleScribeEntryLink | BattleScribeEntryLink[] };
        sharedSelectionEntries?: {
            selectionEntry: BattleScribeSharedSelectionEntry | BattleScribeSharedSelectionEntry[];
        };
        sharedSelectionEntryGroups?: {
            selectionEntryGroup: BattleScribeSelectionEntryGroup | BattleScribeSelectionEntryGroup[];
        };
        sharedProfiles?: { profile: BattleScribeProfile | BattleScribeProfile[] };
        sharedRules?: { rule: BattleScribeRule | BattleScribeRule[] };
        selectionEntries?: { selectionEntry: BattleScribeSelectionEntry | BattleScribeSelectionEntry[] };
    };
}
```

| Property                            | Type                | Description                                                   |
| ----------------------------------- | ------------------- | ------------------------------------------------------------- |
| `catalogue['@_id']`                 | `string`            | Unique identifier for the catalogue                           |
| `catalogue['@_name']`               | `string`            | Faction name                                                  |
| `catalogue['@_revision']`           | `string`            | Revision number                                               |
| `catalogue['@_gameSystemId']`       | `string`            | ID of the parent game system                                  |
| `catalogue['@_gameSystemRevision']` | `string`            | Revision of the game system this catalogue is compatible with |
| `catalogue['@_library']`            | `string` (optional) | If present, this is a library catalogue                       |
| `catalogue.selectionEntries`        | (optional)          | Faction-specific selection entries (units, upgrades)          |

All other optional properties mirror those in `BattleScribeGameSystem`.

```typescript
import type { BattleScribeCatalogue } from '@armoury/shared';

function getCatalogueName(cat: BattleScribeCatalogue): string {
    return cat.catalogue['@_name'];
}
```

---

## Functions

### `ensureArray`

Normalizes `fast-xml-parser` output to a consistent array format. The parser may return a single item or an array for repeated XML elements; this function ensures the result is always an array.

```typescript
function ensureArray<T>(value: T | T[] | undefined): T[];
```

**Type Parameters:**

| Parameter | Description      |
| --------- | ---------------- |
| `T`       | The element type |

**Parameters:**

| Parameter | Type                    | Description                                   |
| --------- | ----------------------- | --------------------------------------------- |
| `value`   | `T \| T[] \| undefined` | A single item, array of items, or `undefined` |

**Returns:** `T[]` -- An array containing the item(s), or an empty array if `undefined`.

```typescript
import { ensureArray } from '@armoury/shared';
import type { BattleScribeProfile, BattleScribeSelectionEntry } from '@armoury/shared';

function getProfiles(entry: BattleScribeSelectionEntry): BattleScribeProfile[] {
    return ensureArray(entry.profiles?.profile);
}

// Single item -> [item]
ensureArray('hello'); // ['hello']

// Array -> same array
ensureArray([1, 2, 3]); // [1, 2, 3]

// undefined -> empty array
ensureArray(undefined); // []
```

Note: `ensureArray` is not exported from the public `@armoury/shared` barrel file. It is available internally within the shared package at `src/shared/types/battlescribe.ts`.
