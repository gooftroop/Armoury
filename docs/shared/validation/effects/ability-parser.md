# Ability Parser

Parses unit abilities, faction rules, detachment rules, and enhancements into structured rules with typed effects.

**Source:** `src/shared/validation/effects/ability-parser.ts`

## Exported Functions

### `parseAbility`

Converts a unit ability into a `StructuredRule` with parsed effects and timing. Uses natural language pattern matching to identify known abilities and extract structured game effects. Falls back to `rawText` effect with `confidence=0` if no patterns match.

```typescript
function parseAbility(ability: { id: string; name: string; description: string }): StructuredRule;
```

**Parameters:**

| Name      | Type                                                | Description                        |
| --------- | --------------------------------------------------- | ---------------------------------- |
| `ability` | `{ id: string; name: string; description: string }` | Ability data from unit definition. |

**Returns:** `StructuredRule` with `origin.type = 'unitAbility'`.

### `parseAbilities`

Batch version of `parseAbility()` that processes an array of ability objects.

```typescript
function parseAbilities(
    abilities: {
        id: string;
        name: string;
        description: string;
    }[],
): StructuredRule[];
```

**Parameters:**

| Name        | Type                                                  | Description                    |
| ----------- | ----------------------------------------------------- | ------------------------------ |
| `abilities` | `{ id: string; name: string; description: string }[]` | Array of ability data objects. |

**Returns:** `StructuredRule[]` -- Array of parsed structured rules.

### `parseFactionRule`

Converts a faction rule into a `StructuredRule`. Uses the same pattern matching as `parseAbility()`. Faction rules are army-wide rules that apply to all units with the faction keyword.

```typescript
function parseFactionRule(rule: { id: string; name: string; description: string }): StructuredRule;
```

**Parameters:**

| Name   | Type                                                | Description                          |
| ------ | --------------------------------------------------- | ------------------------------------ |
| `rule` | `{ id: string; name: string; description: string }` | Faction rule data from faction data. |

**Returns:** `StructuredRule` with `origin.type = 'factionRule'`.

### `parseDetachmentRule`

Converts a detachment rule text into a `StructuredRule`. The rule ID is generated from `detachmentId` and `index` to ensure uniqueness when a detachment has multiple rules.

```typescript
function parseDetachmentRule(
    ruleText: string,
    detachmentId: string,
    detachmentName: string,
    index: number,
): StructuredRule;
```

**Parameters:**

| Name             | Type     | Description                                                       |
| ---------------- | -------- | ----------------------------------------------------------------- |
| `ruleText`       | `string` | The rule description text from detachment data.                   |
| `detachmentId`   | `string` | The ID of the detachment this rule belongs to.                    |
| `detachmentName` | `string` | The human-readable name of the detachment.                        |
| `index`          | `number` | The index of this rule within the detachment (for ID generation). |

**Returns:** `StructuredRule` with `origin.type = 'detachment'` and `id = '{detachmentId}-rule-{index}'`.

### `parseEnhancementEffect`

Converts an enhancement description into a `StructuredRule`. Enhancements are special upgrades applied to Characters (max 3 per army, each unique).

```typescript
function parseEnhancementEffect(enhancement: { id: string; name: string; description: string }): StructuredRule;
```

**Parameters:**

| Name          | Type                                                | Description                             |
| ------------- | --------------------------------------------------- | --------------------------------------- |
| `enhancement` | `{ id: string; name: string; description: string }` | Enhancement data from enhancement data. |

**Returns:** `StructuredRule` with `origin.type = 'enhancement'`.

## Pattern Matching

The parser recognizes the following patterns in ability names and descriptions. Patterns are checked against the ability name first (exact match), then against the description text (partial match).

### Name-based patterns (confidence = 1.0)

| Name Pattern        | Effect Type                            | Timing                  |
| ------------------- | -------------------------------------- | ----------------------- |
| `"Stealth"`         | `stealth`                              | Passive, any phase      |
| `"Lone Operative"`  | `targetingRestriction` (maxRange: 12)  | Passive, any phase      |
| `"Deep Strike"`     | `deepStrike` (minDistance: 9)          | Passive, movement phase |
| `"Scouts X\""`      | `scouts` (distance: X, minDistance: 9) | Passive, movement phase |
| `"Infiltrators"`    | `infiltrators` (minDistance: 9)        | Passive, movement phase |
| `"Deadly Demise X"` | `deadlyDemise` (amount: parsed)        | Triggered, on death     |
| `"Fights First"`    | `fightsFirst`                          | Passive, fight phase    |
| `"Feel No Pain X+"` | `feelNoPain` (threshold: X)            | Passive, any phase      |

### Description-based patterns (confidence = 0.7-0.9)

| Description Contains                         | Effect Type                            | Confidence |
| -------------------------------------------- | -------------------------------------- | ---------- |
| `"feel no pain"` or `"ignore wound"` with X+ | `feelNoPain` (threshold: X)            | 0.9        |
| `"invulnerable save"` with X+                | `invulnerableSave` (threshold: X)      | 0.8        |
| `"re-roll"` + `"hit roll"`                   | `reroll` (roll: hit, mode: all)        | 0.7        |
| `"re-roll"` + `"wound roll"`                 | `reroll` (roll: wound, mode: all)      | 0.7        |
| `"add 1 to"` or `"+1 to"` + `"hit roll"`     | `modifyRoll` (roll: hit, modifier: +1) | 0.7        |
| `"subtract 1"` or `"-1 to"` + `"hit roll"`   | `modifyRoll` (roll: hit, modifier: -1) | 0.7        |

### Fallback

If no pattern matches, returns a `rawText` effect with `confidence: 0` and `reason: 'unmatched'`.

### Timing inference

The `inferTiming` helper determines timing from the description:

- If description contains `"each time"`: Triggered timing (trigger: "each time", phase: any, duration: instant)
- Otherwise: Passive timing (phase: any)

## Usage

```typescript
import {
    parseAbility,
    parseAbilities,
    parseFactionRule,
    parseDetachmentRule,
    parseEnhancementEffect,
} from '@armoury/shared';

// Parse a unit ability
const stealthRule = parseAbility({
    id: 'ability-001',
    name: 'Stealth',
    description: 'This unit has the Stealth ability.',
});
// stealthRule.effect = { type: 'stealth' }
// stealthRule.confidence = 1.0

// Parse an ability with description pattern
const fnpRule = parseAbility({
    id: 'ability-002',
    name: 'Narthecium',
    description: 'Models in this unit have a Feel No Pain 6+ ability.',
});
// fnpRule.effect = { type: 'feelNoPain', threshold: 6, against: 'all' }
// fnpRule.confidence = 0.9

// Parse a faction rule
const factionRule = parseFactionRule({
    id: 'faction-001',
    name: 'Oath of Moment',
    description: 'At the start of your Command phase, select one enemy unit...',
});

// Parse a detachment rule
const detachmentRule = parseDetachmentRule(
    'Each time a model makes a ranged attack, re-roll a hit roll of 1.',
    'det-001',
    'Gladius Task Force',
    0,
);

// Parse an enhancement
const enhancementRule = parseEnhancementEffect({
    id: 'enh-001',
    name: 'Artificer Armour',
    description: 'The bearer has a Save of 2+ and a Feel No Pain 5+ ability.',
});
```
