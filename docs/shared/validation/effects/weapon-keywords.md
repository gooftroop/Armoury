# Weapon Keywords Parser

Parses weapon keyword strings into structured `WeaponKeyword` objects.

**Source:** `src/shared/validation/effects/weapon-keywords.ts`

## Exported Functions

### `parseWeaponKeyword`

Parses a single weapon keyword token into a structured `WeaponKeyword` object. Uses regex patterns for parameterized keywords and case-insensitive string matching for simple keywords. Falls back to a `WeaponKeywordRaw` object if no pattern matches.

```typescript
function parseWeaponKeyword(keyword: string): WeaponKeyword;
```

**Parameters:**

| Name      | Type     | Description                                                      |
| --------- | -------- | ---------------------------------------------------------------- |
| `keyword` | `string` | The weapon keyword string to parse (e.g., `"Sustained Hits 1"`). |

**Returns:** `WeaponKeyword` -- A discriminated union object with a `type` field and parsed data.

**Supported patterns (regex):**

| Pattern          | Regex                           | Result Type       | Extracted Fields                                |
| ---------------- | ------------------------------- | ----------------- | ----------------------------------------------- |
| Rapid Fire X     | `/^rapid\s+fire\s+(\d+)$/i`     | `'rapidFire'`     | `attacks: number`                               |
| Sustained Hits X | `/^sustained\s+hits\s+(\d+)$/i` | `'sustainedHits'` | `extraHits: number`                             |
| Anti-KEYWORD X+  | `/^anti-(.+?)\s+(\d+)\+$/i`     | `'anti'`          | `targetKeyword: string`, `threshold: Threshold` |
| Melta X          | `/^melta\s+(\d+)$/i`            | `'melta'`         | `bonusDamage: number`                           |

**Supported simple keywords (case-insensitive):**

| Input                  | Result Type           |
| ---------------------- | --------------------- |
| `"assault"`            | `'assault'`           |
| `"heavy"`              | `'heavy'`             |
| `"pistol"`             | `'pistol'`            |
| `"torrent"`            | `'torrent'`           |
| `"blast"`              | `'blast'`             |
| `"twin-linked"`        | `'twinLinked'`        |
| `"lethal hits"`        | `'lethalHits'`        |
| `"devastating wounds"` | `'devastatingWounds'` |
| `"precision"`          | `'precision'`         |
| `"indirect fire"`      | `'indirectFire'`      |
| `"ignores cover"`      | `'ignoresCover'`      |
| `"lance"`              | `'lance'`             |
| `"hazardous"`          | `'hazardous'`         |
| `"extra attacks"`      | `'extraAttacks'`      |

**Fallback:** Any unrecognized string returns `{ type: 'raw', text: keyword }`.

### `parseWeaponKeywords`

Batch version of `parseWeaponKeyword()` that processes an array of keyword strings.

```typescript
function parseWeaponKeywords(keywords: string[]): WeaponKeyword[];
```

**Parameters:**

| Name       | Type       | Description                               |
| ---------- | ---------- | ----------------------------------------- |
| `keywords` | `string[]` | Array of weapon keyword strings to parse. |

**Returns:** `WeaponKeyword[]` -- Array of parsed keyword objects.

## Usage

```typescript
import { parseWeaponKeyword, parseWeaponKeywords } from '@armoury/shared';

// Single keyword
const keyword = parseWeaponKeyword('Sustained Hits 1');
// { type: 'sustainedHits', extraHits: 1, raw: 'Sustained Hits 1' }

const antiKeyword = parseWeaponKeyword('Anti-Infantry 4+');
// { type: 'anti', targetKeyword: 'Infantry', threshold: 4, raw: 'Anti-Infantry 4+' }

const meltaKeyword = parseWeaponKeyword('Melta 2');
// { type: 'melta', bonusDamage: 2, raw: 'Melta 2' }

const simpleKeyword = parseWeaponKeyword('Lethal Hits');
// { type: 'lethalHits', raw: 'Lethal Hits' }

const unknownKeyword = parseWeaponKeyword('Custom Rule');
// { type: 'raw', text: 'Custom Rule' }

// Batch parsing
const keywords = parseWeaponKeywords(['Assault', 'Rapid Fire 2', 'Lethal Hits']);
// [
//     { type: 'assault', raw: 'Assault' },
//     { type: 'rapidFire', attacks: 2, raw: 'Rapid Fire 2' },
//     { type: 'lethalHits', raw: 'Lethal Hits' },
// ]
```
