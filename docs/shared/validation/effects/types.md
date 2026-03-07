# Effects Types

Type definitions for parsed game effects, weapon keywords, conditions, and structured rules.

**Source:** `src/shared/validation/effects/types.ts`

This is the largest type definition file in the validation module (~1,444 lines). It defines the discriminated union types that represent all parsed game mechanics from rules text.

## Primitive Types

### `Threshold`

D6 threshold values for X+ rolls.

```typescript
type Threshold = 2 | 3 | 4 | 5 | 6;
```

### `GamePhase`

Phases of a game turn for rule timing.

```typescript
type GamePhase = 'command' | 'movement' | 'shooting' | 'charge' | 'fight' | 'any';
```

### `AttackKind`

Attack type scope for effects.

```typescript
type AttackKind = 'ranged' | 'melee' | 'any';
```

### `RollKind`

Roll types that can be modified or rerolled.

```typescript
type RollKind = 'hit' | 'wound' | 'save' | 'damage' | 'advance' | 'charge' | 'battleshock';
```

### `CharacteristicKind`

Characteristics that can be modified by effects.

```typescript
type CharacteristicKind =
    | 'move'
    | 'toughness'
    | 'save'
    | 'wounds'
    | 'leadership'
    | 'objectiveControl'
    | 'attacks'
    | 'strength'
    | 'armourPenetration'
    | 'damage'
    | 'range';
```

## Numeric Expressions

### `NumericExpression`

Numeric expression for values that can be constant, dice-based, or raw text.

```typescript
type NumericExpression = ConstantValue | DiceExpression | RawExpression;
```

| Variant          | Type Field   | Properties                                           | Description                         |
| ---------------- | ------------ | ---------------------------------------------------- | ----------------------------------- |
| `ConstantValue`  | `'constant'` | `value: number`                                      | Fixed numeric value.                |
| `DiceExpression` | `'dice'`     | `count: number`, `sides: number`, `modifier: number` | Dice roll expression (e.g., 2D6+1). |
| `RawExpression`  | `'raw'`      | `text: string`                                       | Unparsed text when parsing fails.   |

## WeaponKeyword

Discriminated union representing all 19 weapon keywords from the game system core rules, plus a raw fallback.

```typescript
type WeaponKeyword =
    | WeaponKeywordAssault
    | WeaponKeywordHeavy
    | WeaponKeywordRapidFire
    | WeaponKeywordPistol
    | WeaponKeywordTorrent
    | WeaponKeywordBlast
    | WeaponKeywordMelta
    | WeaponKeywordTwinLinked
    | WeaponKeywordLethalHits
    | WeaponKeywordSustainedHits
    | WeaponKeywordDevastatingWounds
    | WeaponKeywordAnti
    | WeaponKeywordPrecision
    | WeaponKeywordIndirectFire
    | WeaponKeywordIgnoresCover
    | WeaponKeywordLance
    | WeaponKeywordHazardous
    | WeaponKeywordExtraAttacks
    | WeaponKeywordRaw;
```

### Variants

| Type                             | Discriminator         | Extra Properties                                                | Rule                                       |
| -------------------------------- | --------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `WeaponKeywordAssault`           | `'assault'`           | `raw?: string`                                                  | Can shoot after Advancing.                 |
| `WeaponKeywordHeavy`             | `'heavy'`             | `raw?: string`                                                  | +1 to hit if Remained Stationary.          |
| `WeaponKeywordRapidFire`         | `'rapidFire'`         | `attacks: number`, `raw?: string`                               | +X attacks at half range.                  |
| `WeaponKeywordPistol`            | `'pistol'`            | `raw?: string`                                                  | Can shoot in Engagement Range.             |
| `WeaponKeywordTorrent`           | `'torrent'`           | `raw?: string`                                                  | Auto-hits (no hit roll).                   |
| `WeaponKeywordBlast`             | `'blast'`             | `raw?: string`                                                  | +1 attack per 5 models in target.          |
| `WeaponKeywordMelta`             | `'melta'`             | `bonusDamage: number`, `raw?: string`                           | +X damage at half range.                   |
| `WeaponKeywordTwinLinked`        | `'twinLinked'`        | `raw?: string`                                                  | Re-roll wound rolls.                       |
| `WeaponKeywordLethalHits`        | `'lethalHits'`        | `raw?: string`                                                  | Critical Hits auto-wound.                  |
| `WeaponKeywordSustainedHits`     | `'sustainedHits'`     | `extraHits: number`, `raw?: string`                             | Critical Hits score X additional hits.     |
| `WeaponKeywordDevastatingWounds` | `'devastatingWounds'` | `raw?: string`                                                  | Critical Wounds inflict mortal wounds.     |
| `WeaponKeywordAnti`              | `'anti'`              | `targetKeyword: string`, `threshold: Threshold`, `raw?: string` | X+ is Critical Wound vs keyword.           |
| `WeaponKeywordPrecision`         | `'precision'`         | `raw?: string`                                                  | Allocate wounds to visible Characters.     |
| `WeaponKeywordIndirectFire`      | `'indirectFire'`      | `raw?: string`                                                  | Target non-visible units (-1 to hit).      |
| `WeaponKeywordIgnoresCover`      | `'ignoresCover'`      | `raw?: string`                                                  | Target cannot benefit from cover.          |
| `WeaponKeywordLance`             | `'lance'`             | `raw?: string`                                                  | +1 to wound if charged this turn.          |
| `WeaponKeywordHazardous`         | `'hazardous'`         | `raw?: string`                                                  | Risk of model destruction on D6 roll of 1. |
| `WeaponKeywordExtraAttacks`      | `'extraAttacks'`      | `raw?: string`                                                  | Attacks in addition to main weapon.        |
| `WeaponKeywordRaw`               | `'raw'`               | `text: string`                                                  | Unparsed keyword fallback.                 |

## Condition

Boolean condition evaluated against game state. Conditions can be combined with logical operators (And, Or, Not) to create complex rule logic.

```typescript
type Condition =
    | ConditionAnd
    | ConditionOr
    | ConditionNot
    | ConditionPhase
    | ConditionAttackType
    | ConditionWithinHalfRange
    | ConditionWithinRange
    | ConditionTargetHasKeyword
    | ConditionSourceHasKeyword
    | ConditionChargedThisTurn
    | ConditionRemainedStationary
    | ConditionAdvancedThisTurn
    | ConditionFellBackThisTurn
    | ConditionInEngagementRange
    | ConditionTargetVisible
    | ConditionBelowHalfStrength
    | ConditionCriticalHit
    | ConditionCriticalWound
    | ConditionTargetModelCountAtLeast
    | ConditionRaw;
```

### Variants

| Type                               | Discriminator               | Extra Properties                   | Description                          |
| ---------------------------------- | --------------------------- | ---------------------------------- | ------------------------------------ |
| `ConditionAnd`                     | `'and'`                     | `conditions: Condition[]`          | All conditions must be true.         |
| `ConditionOr`                      | `'or'`                      | `conditions: Condition[]`          | At least one condition must be true. |
| `ConditionNot`                     | `'not'`                     | `condition: Condition`             | Inverts the condition.               |
| `ConditionPhase`                   | `'phase'`                   | `phase: Exclude<GamePhase, 'any'>` | Matches a specific game phase.       |
| `ConditionAttackType`              | `'attackType'`              | `attackType: 'ranged' \| 'melee'`  | Matches an attack type.              |
| `ConditionWithinHalfRange`         | `'withinHalfRange'`         | --                                 | Target is within half range.         |
| `ConditionWithinRange`             | `'withinRange'`             | `range: number`                    | Target is within a specific range.   |
| `ConditionTargetHasKeyword`        | `'targetHasKeyword'`        | `keyword: string`                  | Target has a keyword.                |
| `ConditionSourceHasKeyword`        | `'sourceHasKeyword'`        | `keyword: string`                  | Source has a keyword.                |
| `ConditionChargedThisTurn`         | `'chargedThisTurn'`         | --                                 | Unit charged this turn.              |
| `ConditionRemainedStationary`      | `'remainedStationary'`      | --                                 | Unit remained stationary.            |
| `ConditionAdvancedThisTurn`        | `'advancedThisTurn'`        | --                                 | Unit advanced this turn.             |
| `ConditionFellBackThisTurn`        | `'fellBackThisTurn'`        | --                                 | Unit fell back this turn.            |
| `ConditionInEngagementRange`       | `'inEngagementRange'`       | --                                 | Unit is in engagement range.         |
| `ConditionTargetVisible`           | `'targetVisible'`           | --                                 | Target is visible.                   |
| `ConditionBelowHalfStrength`       | `'belowHalfStrength'`       | --                                 | Unit is below half strength.         |
| `ConditionCriticalHit`             | `'criticalHit'`             | --                                 | A critical hit was rolled.           |
| `ConditionCriticalWound`           | `'criticalWound'`           | --                                 | A critical wound was rolled.         |
| `ConditionTargetModelCountAtLeast` | `'targetModelCountAtLeast'` | `count: number`                    | Target has at least N models.        |
| `ConditionRaw`                     | `'raw'`                     | `text: string`                     | Unparsed condition fallback.         |

## GameEffect

Discriminated union describing semantic rule outcomes. Represents what a parsed rule does mechanically.

```typescript
type GameEffect =
    | GameEffectComposite
    | GameEffectConditional
    | GameEffectModifyRoll
    | GameEffectReroll
    | GameEffectModifyCharacteristic
    | GameEffectInvulnerableSave
    | GameEffectFeelNoPain
    | GameEffectMortalWounds
    | GameEffectExtraHits
    | GameEffectExtraAttacks
    | GameEffectAutoHit
    | GameEffectIgnoreCover
    | GameEffectGrantCover
    | GameEffectStealth
    | GameEffectTargetingRestriction
    | GameEffectDeepStrike
    | GameEffectScouts
    | GameEffectInfiltrators
    | GameEffectFightsFirst
    | GameEffectDeadlyDemise
    | GameEffectHazardousPenalty
    | GameEffectRawText;
```

### Variants

| Type                             | Discriminator            | Key Properties                                                                                                 | Description                              |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `GameEffectComposite`            | `'composite'`            | `effects: GameEffect[]`                                                                                        | Multiple effects applied in order.       |
| `GameEffectConditional`          | `'conditional'`          | `when: Condition`, `then: GameEffect`, `else?: GameEffect`                                                     | Conditional effect based on a predicate. |
| `GameEffectModifyRoll`           | `'modifyRoll'`           | `roll: RollKind`, `modifier: number`, `attackType?: AttackKind`                                                | Modifier applied to a roll.              |
| `GameEffectReroll`               | `'reroll'`               | `roll: RollKind`, `mode: 'all' \| 'ones' \| 'failed'`, `attackType?: AttackKind`                               | Reroll effect for a roll type.           |
| `GameEffectModifyCharacteristic` | `'modifyCharacteristic'` | `characteristic: CharacteristicKind`, `operation: 'add' \| 'set'`, `value: NumericExpression`                  | Modification to a unit characteristic.   |
| `GameEffectInvulnerableSave`     | `'invulnerableSave'`     | `threshold: Threshold`                                                                                         | Invulnerable save granted to a unit.     |
| `GameEffectFeelNoPain`           | `'feelNoPain'`           | `threshold: Threshold`, `against: 'all' \| 'mortalOnly'`                                                       | Feel No Pain wound-ignoring rule.        |
| `GameEffectMortalWounds`         | `'mortalWounds'`         | `amount: NumericExpression`, `timing: 'onCriticalWound' \| 'onDeath' \| 'onCharge' \| 'direct'`                | Mortal wounds applied by an effect.      |
| `GameEffectExtraHits`            | `'extraHits'`            | `extraHits: number`, `on: 'criticalHit'`                                                                       | Extra hits generated on a trigger.       |
| `GameEffectExtraAttacks`         | `'extraAttacks'`         | `attacks: NumericExpression`, `attackType?: AttackKind`                                                        | Extra attacks generated for a unit.      |
| `GameEffectAutoHit`              | `'autoHit'`              | --                                                                                                             | Attacks automatically hit.               |
| `GameEffectIgnoreCover`          | `'ignoreCover'`          | `attackType?: AttackKind`                                                                                      | Target cannot benefit from cover.        |
| `GameEffectGrantCover`           | `'grantCover'`           | --                                                                                                             | Unit gains Benefit of Cover.             |
| `GameEffectStealth`              | `'stealth'`              | --                                                                                                             | -1 to hit rolls against this unit.       |
| `GameEffectTargetingRestriction` | `'targetingRestriction'` | `maxRange: number`, `exceptions?: string[]`                                                                    | Can only be targeted within max range.   |
| `GameEffectDeepStrike`           | `'deepStrike'`           | `minDistanceFromEnemies: number`                                                                               | Deep Strike deployment.                  |
| `GameEffectScouts`               | `'scouts'`               | `distance: number`, `minDistanceFromEnemies: number`                                                           | Pre-game Scouts move.                    |
| `GameEffectInfiltrators`         | `'infiltrators'`         | `minDistanceFromEnemies: number`                                                                               | Infiltrators deployment.                 |
| `GameEffectFightsFirst`          | `'fightsFirst'`          | --                                                                                                             | Fights in the Fights First step.         |
| `GameEffectDeadlyDemise`         | `'deadlyDemise'`         | `amount: NumericExpression`                                                                                    | Mortal wounds on destruction.            |
| `GameEffectHazardousPenalty`     | `'hazardousPenalty'`     | `failsOn: number`, `normalOutcome: 'modelDestroyed'`, `heavyKeywords?: string[]`, `heavyMortalWounds?: number` | Penalty for failed Hazardous rolls.      |
| `GameEffectRawText`              | `'rawText'`              | `text: string`, `reason?: string`                                                                              | Unparsed effect fallback.                |

## RuleTiming

Describes when a rule is active or triggered during gameplay.

```typescript
type RuleTiming = RuleTimingPassive | RuleTimingTriggered | RuleTimingActivated | RuleTimingRaw;
```

| Variant               | Discriminator | Properties                                                           | Description                            |
| --------------------- | ------------- | -------------------------------------------------------------------- | -------------------------------------- |
| `RuleTimingPassive`   | `'passive'`   | `phase: GamePhase`                                                   | Always active during a specific phase. |
| `RuleTimingTriggered` | `'triggered'` | `trigger: string`, `phase: GamePhase`, `duration: RuleDuration`      | Activates on a specific event.         |
| `RuleTimingActivated` | `'activated'` | `phase: GamePhase`, `usageLimit?: 'oncePerBattle' \| 'oncePerPhase'` | Requires player activation.            |
| `RuleTimingRaw`       | `'raw'`       | `text: string`                                                       | Unparsed timing fallback.              |

## RuleDuration

Describes how long a triggered or activated rule remains in effect.

```typescript
type RuleDuration =
    | RuleDurationInstant
    | RuleDurationUntilEndOfPhase
    | RuleDurationUntilNextCommandPhase
    | RuleDurationPermanent
    | RuleDurationRaw;
```

| Variant                             | Discriminator             | Properties          | Description                                        |
| ----------------------------------- | ------------------------- | ------------------- | -------------------------------------------------- |
| `RuleDurationInstant`               | `'instant'`               | --                  | Effect applies immediately and ends.               |
| `RuleDurationUntilEndOfPhase`       | `'untilEndOfPhase'`       | `phase?: GamePhase` | Lasts until the current (or specified) phase ends. |
| `RuleDurationUntilNextCommandPhase` | `'untilNextCommandPhase'` | --                  | Lasts until the next Command phase.                |
| `RuleDurationPermanent`             | `'permanent'`             | --                  | Permanent effect.                                  |
| `RuleDurationRaw`                   | `'raw'`                   | `text: string`      | Unparsed duration fallback.                        |

## RuleOrigin

Identifies where a parsed rule comes from in the game data hierarchy.

```typescript
type RuleOrigin =
    | RuleOriginWeapon
    | RuleOriginUnitAbility
    | RuleOriginDetachment
    | RuleOriginFactionRule
    | RuleOriginEnhancement;
```

| Variant                 | Discriminator   | Properties                                           | Description                   |
| ----------------------- | --------------- | ---------------------------------------------------- | ----------------------------- |
| `RuleOriginWeapon`      | `'weapon'`      | `weaponId?: string`, `weaponName?: string`           | From a weapon profile.        |
| `RuleOriginUnitAbility` | `'unitAbility'` | `abilityId?: string`, `abilityName: string`          | From a unit ability.          |
| `RuleOriginDetachment`  | `'detachment'`  | `detachmentId?: string`, `detachmentName?: string`   | From the selected detachment. |
| `RuleOriginFactionRule` | `'factionRule'` | `ruleId?: string`, `ruleName: string`                | From the faction rules.       |
| `RuleOriginEnhancement` | `'enhancement'` | `enhancementId?: string`, `enhancementName?: string` | From an enhancement upgrade.  |

## StructuredRule

Fully parsed game rule extracted from game data. Contains the original text, parsed effect, timing information, and confidence score.

```typescript
interface StructuredRule {
    id: string;
    name: string;
    originalText: string;
    origin: RuleOrigin;
    timing: RuleTiming;
    effect: GameEffect;
    confidence?: number;
}
```

| Property       | Type         | Required | Description                                                           |
| -------------- | ------------ | -------- | --------------------------------------------------------------------- |
| `id`           | `string`     | Yes      | Unique rule identifier.                                               |
| `name`         | `string`     | Yes      | Human-readable rule name.                                             |
| `originalText` | `string`     | Yes      | Original text for the rule from game data.                            |
| `origin`       | `RuleOrigin` | Yes      | Where this rule comes from.                                           |
| `timing`       | `RuleTiming` | Yes      | When the rule is active or triggered.                                 |
| `effect`       | `GameEffect` | Yes      | The structured game mechanic.                                         |
| `confidence`   | `number`     | No       | Parse confidence from 0 to 1 (0 = rawText fallback, 1 = exact match). |

## Usage

```typescript
import type {
    WeaponKeyword,
    Condition,
    GameEffect,
    StructuredRule,
    RuleTiming,
    RuleOrigin,
    NumericExpression,
    Threshold,
} from '@armoury/shared';

// Weapon keyword example
const keyword: WeaponKeyword = {
    type: 'sustainedHits',
    extraHits: 1,
    raw: 'Sustained Hits 1',
};

// Condition example
const condition: Condition = {
    type: 'and',
    conditions: [{ type: 'phase', phase: 'shooting' }, { type: 'remainedStationary' }],
};

// Game effect example
const effect: GameEffect = {
    type: 'conditional',
    when: { type: 'remainedStationary' },
    then: { type: 'modifyRoll', roll: 'hit', modifier: 1 },
};

// Structured rule example
const rule: StructuredRule = {
    id: 'stealth-001',
    name: 'Stealth',
    originalText: 'This unit has the Stealth ability.',
    origin: { type: 'unitAbility', abilityName: 'Stealth' },
    timing: { type: 'passive', phase: 'any' },
    effect: { type: 'stealth' },
    confidence: 1.0,
};
```
