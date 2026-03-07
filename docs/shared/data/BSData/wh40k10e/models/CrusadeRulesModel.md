# CrusadeRulesModel

Crusade campaign rules reference data model with rank thresholds, requisitions, battle honours, battle scars, and agendas.

**Source:** `src/shared/data/BSData/wh40k10e/models/CrusadeRulesModel.ts`

## Overview

Provides complete crusade campaign ruleset definitions. Supports multiple rulesets: Core, Armageddon, and Pariah Nexus. Each ruleset defines progression mechanics, available upgrades, and campaign-specific rules.

## Exports

### `CrusadeUnitRank` (type alias)

Unit rank progression in a crusade campaign.

```typescript
type CrusadeUnitRank = 'Battle-ready' | 'Bloodied' | 'Battle-hardened' | 'Heroic' | 'Legendary';
```

### `RankThreshold` (interface)

XP threshold and benefits for a specific rank.

```typescript
interface RankThreshold {
    rank: CrusadeUnitRank;
    minXP: number;
    battleHonoursAllowed: number;
}
```

### `CrusadeRequisition` (interface)

A requisition that can be purchased with requisition points.

```typescript
interface CrusadeRequisition {
    id: string;
    name: string;
    costRP: number;
    description: string;
    timing: 'anyTime' | 'addUnit' | 'beforeAfterBattle' | 'whenRankGained';
    restrictions: string[];
}
```

### `BattleHonourType` (type alias)

```typescript
type BattleHonourType = 'BattleTrait' | 'WeaponEnhancement' | 'PsychicFortitude' | 'CrusadeRelic';
```

### `BattleHonourDefinition` (interface)

A battle honour that can be awarded to units.

```typescript
interface BattleHonourDefinition {
    id: string;
    type: BattleHonourType;
    name: string;
    description: string;
    applicableTo: string[];
    relicTier?: 'Artificer' | 'Antiquity' | 'Legendary';
}
```

### `BattleScarDefinition` (interface)

A battle scar that can be inflicted on units.

```typescript
interface BattleScarDefinition {
    id: string;
    name: string;
    description: string;
    effect: string;
    severity: 'mild' | 'severe';
    removable: boolean;
}
```

### `AgendaCategory` (type alias)

```typescript
type AgendaCategory = 'PurgeTheEnemy' | 'NoMercyNoRespite' | 'BattlefieldSupremacy' | 'ShadowOperations' | 'Warpcraft';
```

### `CrusadeAgenda` (interface)

A crusade agenda that can be selected for a battle.

```typescript
interface CrusadeAgenda {
    id: string;
    name: string;
    category: AgendaCategory;
    description: string;
    xpReward: number;
}
```

### `XPGainRule` (interface)

A rule for how units gain XP.

```typescript
interface XPGainRule {
    id: string;
    name: string;
    amount: number;
    description: string;
    appliesTo: 'allParticipating' | 'unit' | 'chosenOne';
}
```

### `BlackstoneUpgrade` (interface)

A blackstone upgrade (Pariah Nexus-specific).

```typescript
interface BlackstoneUpgrade {
    id: string;
    name: string;
    cost: number;
    effect: string;
}
```

### `CrusadeRuleSource` (type alias)

```typescript
type CrusadeRuleSource = 'core' | 'armageddon' | 'pariah-nexus';
```

### `CrusadeRules` (interface)

Complete crusade campaign ruleset.

```typescript
interface CrusadeRules {
    id: string;
    source: CrusadeRuleSource;
    name: string;
    version: string;
    startingSupplyLimit: number;
    startingRequisitionPoints: number;
    rpPerBattle: number;
    rankThresholds: RankThreshold[];
    xpGainRules: XPGainRule[];
    requisitions: CrusadeRequisition[];
    battleHonours: BattleHonourDefinition[];
    battleScars: BattleScarDefinition[];
    agendas: CrusadeAgenda[];
    narrative: string;
    sourceMechanics: {
        armageddon?: {
            requisitions: CrusadeRequisition[];
            battleHonours: BattleHonourDefinition[];
        };
        blackstone?: {
            upgrades: BlackstoneUpgrade[];
            corruptionRules: string;
        };
    };
}
```

| Property                    | Type                       | Description                                           |
| --------------------------- | -------------------------- | ----------------------------------------------------- |
| `id`                        | `string`                   | Unique ruleset identifier.                            |
| `source`                    | `CrusadeRuleSource`        | Source rulebook.                                      |
| `name`                      | `string`                   | Ruleset name.                                         |
| `version`                   | `string`                   | Ruleset version.                                      |
| `startingSupplyLimit`       | `number`                   | Starting supply limit for new campaigns.              |
| `startingRequisitionPoints` | `number`                   | Starting requisition points.                          |
| `rpPerBattle`               | `number`                   | RP gained per battle.                                 |
| `rankThresholds`            | `RankThreshold[]`          | Rank progression thresholds.                          |
| `xpGainRules`               | `XPGainRule[]`             | How units earn XP.                                    |
| `requisitions`              | `CrusadeRequisition[]`     | Available requisitions.                               |
| `battleHonours`             | `BattleHonourDefinition[]` | Available battle honours.                             |
| `battleScars`               | `BattleScarDefinition[]`   | Available battle scars.                               |
| `agendas`                   | `CrusadeAgenda[]`          | Available battle agendas.                             |
| `narrative`                 | `string`                   | Campaign narrative and lore.                          |
| `sourceMechanics`           | `object`                   | Rulebook-specific mechanics (Armageddon, Blackstone). |

## Usage Example

```typescript
import type { CrusadeRules, CrusadeUnitRank, RankThreshold } from '@armoury/shared';

const coreRules: CrusadeRules = {
    id: 'core',
    source: 'core',
    name: 'Crusade Core Rules',
    version: '1.0',
    startingSupplyLimit: 1000,
    startingRequisitionPoints: 5,
    rpPerBattle: 1,
    rankThresholds: [
        { rank: 'Battle-ready', minXP: 0, battleHonoursAllowed: 0 },
        { rank: 'Bloodied', minXP: 6, battleHonoursAllowed: 1 },
        { rank: 'Battle-hardened', minXP: 16, battleHonoursAllowed: 2 },
        { rank: 'Heroic', minXP: 31, battleHonoursAllowed: 3 },
        { rank: 'Legendary', minXP: 51, battleHonoursAllowed: 4 },
    ],
    xpGainRules: [],
    requisitions: [],
    battleHonours: [],
    battleScars: [],
    agendas: [],
    narrative: '',
    sourceMechanics: {},
};

await adapter.put('crusadeRules', coreRules);
```
