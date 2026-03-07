# merge-catalogues

Utility for merging multiple BattleScribe catalogues into a single unified catalogue.

**Source:** `src/shared/data/BSData/wh40k10e/models/merge-catalogues.ts`

## Overview

Combines library files with faction-specific catalogue files. Used for factions that span multiple `.cat` files (e.g., Aeldari with a shared library plus Craftworlds and Ynnari files, or Space Marine chapters that inherit from the base Space Marines catalogue). Later catalogues override earlier ones when there are duplicate IDs.

## Exports

### `mergeCatalogues` (function)

Merges multiple BattleScribe catalogues into a single catalogue. Library files should be passed first, followed by faction-specific files.

```typescript
function mergeCatalogues(...catalogues: BattleScribeCatalogue[]): BattleScribeCatalogue;
```

#### Parameters

| Parameter       | Type                      | Description                                                       |
| --------------- | ------------------------- | ----------------------------------------------------------------- |
| `...catalogues` | `BattleScribeCatalogue[]` | Array of catalogues to merge (library first, then faction files). |

#### Returns

`BattleScribeCatalogue` -- Merged catalogue with combined data from all inputs.

#### Throws

- `Error` if no catalogues are provided (`"At least one catalogue is required to merge."`).

#### Behavior

- If only one catalogue is provided, it is returned as-is.
- For multiple catalogues, the following sections are merged by `@_id` (later entries override earlier ones):
    - `sharedProfiles` -- Shared profile definitions
    - `sharedSelectionEntries` -- Shared selection entries
    - `sharedSelectionEntryGroups` -- Shared selection entry groups
    - `sharedRules` -- Shared rules
    - `selectionEntries` -- Top-level selection entries
    - `categoryEntries` -- Category entries
- Top-level catalogue metadata is merged via `Object.assign`, with later catalogues overriding earlier ones.

## Internal Functions

### `mergeById` (not exported)

Merges arrays of items with `@_id` fields. Later items override earlier ones. Used internally for combining shared data.

```typescript
function mergeById<T extends { '@_id': string }>(...arrays: (T[] | undefined)[]): T[];
```

## Usage Example

```typescript
import { mergeCatalogues } from '@armoury/shared';
import { parseCatalogue } from '@armoury/shared';

// Aeldari: Library + Craftworlds + Ynnari (3 files)
const library = parseCatalogue(libraryXml);
const craftworlds = parseCatalogue(craftworldsXml);
const ynnari = parseCatalogue(ynnariXml);
const merged = mergeCatalogues(library, craftworlds, ynnari);

// Drukhari: Library + Drukhari (2 files)
const drukhari = parseCatalogue(drukhariXml);
const mergedDrukhari = mergeCatalogues(library, drukhari);

// Single file faction (no merge needed, returns as-is)
const necrons = parseCatalogue(necronsXml);
const mergedNecrons = mergeCatalogues(necrons);
```
