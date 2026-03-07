/**
 * Crusade campaign rules reference data model.
 *
 * Provides complete crusade campaign ruleset definitions including rank thresholds,
 * requisitions, battle honours, battle scars, agendas, and XP gain rules.
 * Supports multiple rulesets (Core, Armageddon, Pariah Nexus).
 */

/**
 * Unit rank progression in a crusade campaign.
 */
export type CrusadeUnitRank = 'Battle-ready' | 'Bloodied' | 'Battle-hardened' | 'Heroic' | 'Legendary';

/**
 * XP threshold and benefits for a specific rank.
 * Defines the progression path for crusade units through ranks.
 */
export interface RankThreshold {
    /** The rank this threshold represents (Battle-ready, Bloodied, Battle-hardened, Heroic, Legendary). */
    rank: CrusadeUnitRank;
    /** Minimum XP required to achieve this rank. */
    minXP: number;
    /** Number of battle honours allowed at this rank. */
    battleHonoursAllowed: number;
}

/**
 * A requisition that can be purchased with requisition points.
 * Requisitions are upgrades that can be applied to crusade units.
 */
export interface CrusadeRequisition {
    /** Unique identifier for this requisition. */
    id: string;
    /** Display name of the requisition (e.g. "Relic", "Warlord Trait"). */
    name: string;
    /** Cost in requisition points. */
    costRP: number;
    /** Description of what this requisition provides. */
    description: string;
    /** When this requisition can be used (anyTime, addUnit, beforeAfterBattle, whenRankGained). */
    timing: 'anyTime' | 'addUnit' | 'beforeAfterBattle' | 'whenRankGained';
    /** Restrictions on which units can use this requisition (e.g. "Infantry only", "Character only"). */
    restrictions: string[];
}

/**
 * Category of battle honour.
 */
export type BattleHonourType = 'BattleTrait' | 'WeaponEnhancement' | 'PsychicFortitude' | 'CrusadeRelic';

/**
 * A battle honour that can be awarded to units.
 * Battle honours are permanent upgrades earned through crusade progression.
 */
export interface BattleHonourDefinition {
    /** Unique identifier for this battle honour. */
    id: string;
    /** Type of battle honour (BattleTrait, WeaponEnhancement, PsychicFortitude, CrusadeRelic). */
    type: BattleHonourType;
    /** Display name of the battle honour. */
    name: string;
    /** Description of the battle honour's effect. */
    description: string;
    /** Unit keywords this honour can be applied to (e.g. "Infantry", "Character", "Vehicle"). */
    applicableTo: string[];
    /** Relic tier (only for CrusadeRelic type: Artificer, Antiquity, or Legendary). */
    relicTier?: 'Artificer' | 'Antiquity' | 'Legendary';
}

/**
 * A battle scar that can be inflicted on units.
 */
export interface BattleScarDefinition {
    /** Unique identifier for this battle scar. */
    id: string;
    /** Display name of the battle scar. */
    name: string;
    /** Description of the battle scar. */
    description: string;
    /** Game effect of the battle scar. */
    effect: string;
    /** Severity of the battle scar. */
    severity: 'mild' | 'severe';
    /** Whether this scar can be removed. */
    removable: boolean;
}

/**
 * Category of crusade agenda.
 */
export type AgendaCategory =
    | 'PurgeTheEnemy'
    | 'NoMercyNoRespite'
    | 'BattlefieldSupremacy'
    | 'ShadowOperations'
    | 'Warpcraft';

/**
 * A crusade agenda that can be selected for a battle.
 */
export interface CrusadeAgenda {
    /** Unique identifier for this agenda. */
    id: string;
    /** Display name of the agenda. */
    name: string;
    /** Category of this agenda. */
    category: AgendaCategory;
    /** Description of the agenda's objectives. */
    description: string;
    /** XP reward for completing this agenda. */
    xpReward: number;
}

/**
 * A rule for how units gain XP.
 */
export interface XPGainRule {
    /** Unique identifier for this XP gain rule. */
    id: string;
    /** Display name of the rule. */
    name: string;
    /** Amount of XP gained. */
    amount: number;
    /** Description of when XP is gained. */
    description: string;
    /** Which units this rule applies to. */
    appliesTo: 'allParticipating' | 'unit' | 'chosenOne';
}

/**
 * A blackstone upgrade that can be applied to units.
 */
export interface BlackstoneUpgrade {
    /** Unique identifier for this upgrade. */
    id: string;
    /** Display name of the upgrade. */
    name: string;
    /** Cost in requisition points. */
    cost: number;
    /** Description of the upgrade's effect. */
    effect: string;
}

/**
 * Source rulebook for crusade rules.
 */
export type CrusadeRuleSource = 'core' | 'armageddon' | 'pariah-nexus';

/**
 * Complete crusade campaign ruleset.
 * Defines all rules, progression mechanics, and available upgrades for a crusade campaign.
 */
export interface CrusadeRules {
    /** Unique identifier for this ruleset. */
    id: string;
    /** Source rulebook (core, armageddon, or pariah-nexus). */
    source: CrusadeRuleSource;
    /** Display name of the ruleset (e.g. "Crusade Core Rules"). */
    name: string;
    /** Version of the ruleset (e.g. "1.0", "2.1"). */
    version: string;
    /** Starting supply limit for new campaigns. */
    startingSupplyLimit: number;
    /** Starting requisition points for new campaigns. */
    startingRequisitionPoints: number;
    /** Requisition points gained per battle. */
    rpPerBattle: number;
    /** Rank thresholds and XP requirements for unit progression. */
    rankThresholds: RankThreshold[];
    /** XP gain rules for battles (how units earn experience). */
    xpGainRules: XPGainRule[];
    /** Available requisitions that can be purchased with requisition points. */
    requisitions: CrusadeRequisition[];
    /** Available battle honours that can be earned by units. */
    battleHonours: BattleHonourDefinition[];
    /** Available battle scars that can be inflicted on units. */
    battleScars: BattleScarDefinition[];
    /** Available agendas that can be selected for battles. */
    agendas: CrusadeAgenda[];
    /** Narrative campaign description and lore. */
    narrative: string;
    /** Rulebook-specific mechanics and expansions. */
    sourceMechanics: {
        /** Armageddon-specific mechanics. */
        armageddon?: {
            /** Armageddon-specific requisitions. */
            requisitions: CrusadeRequisition[];
            /** Armageddon-specific battle honours. */
            battleHonours: BattleHonourDefinition[];
        };
        /** Pariah Nexus-specific mechanics. */
        blackstone?: {
            /** Blackstone upgrades available. */
            upgrades: BlackstoneUpgrade[];
            /** Blackstone corruption rules. */
            corruptionRules: string;
        };
    };
}
