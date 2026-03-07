/**
 * Warhammer 40K 10th Edition game system plugin exports.
 */

import type { FactionData } from '@wh40k10e/models/FactionData.js';
import type { Army } from '@wh40k10e/models/ArmyModel.js';
import type { Campaign, CampaignParticipant } from '@models/CampaignModel.js';
import type { MatchData } from '@wh40k10e/models/MatchData.js';
import type { CrusadeRules } from '@wh40k10e/models/CrusadeRulesModel.js';
import type { ChapterApproved } from '@wh40k10e/models/ChapterApproved.js';
import type { CoreRules } from '@wh40k10e/models/CoreRules.js';
import type { Weapon, Ability, Stratagem, Detachment } from '@wh40k10e/types/entities.js';
import type { Unit } from '@wh40k10e/models/UnitModel.js';
import type { Faction } from '@wh40k10e/types/entities.js';

declare module '@data/types.js' {
    interface PluginEntityMap {
        faction: Faction;
        unit: Unit;
        weapon: Weapon;
        ability: Ability;
        stratagem: Stratagem;
        detachment: Detachment;
        factionModel: FactionData;
        army: Army;
        campaign: Campaign;
        campaignParticipant: CampaignParticipant;
        wh40kMatchData: MatchData;
        crusadeRules: CrusadeRules;
        chapterApproved: ChapterApproved;
        coreRules: CoreRules;
    }
}

// Models
export type {
    Weapon,
    RangedWeapon,
    MeleeWeapon,
    Ability,
    Stratagem,
    Detachment,
    Enhancement,
    Keyword,
    UnitComposition,
    WargearOption,
    WargearChoice,
    WargearAbility,
    LeaderInfo,
    UnitAbility,
} from '@wh40k10e/types/entities.js';
export type { Unit } from '@wh40k10e/models/UnitModel.js';
export { isRangedWeapon, isMeleeWeapon } from '@wh40k10e/types/typeGuards.js';
export type {
    Army,
    ArmyEnhancement,
    ArmyModelConfig,
    ArmyUnit,
    ArmyVersion,
    ArmyWargearSelection,
    BattleSize,
} from '@wh40k10e/models/ArmyModel.js';
export type { FactionData } from '@wh40k10e/models/FactionData.js';
export type { FactionRule } from '@wh40k10e/models/FactionData.js';
export type { CoreRules } from '@wh40k10e/models/CoreRules.js';
export type { ProfileTypeInfo, CostTypeInfo, SharedRule } from '@wh40k10e/models/CoreRules.js';
export type { Account, UserPreferences } from '@models/AccountModel.js';
export type { Friend, FriendStatus } from '@models/FriendModel.js';
export type {
    MatchData,
    GamePhase,
    MissionConfig,
    PlayerSecondaries,
    SecondaryMission,
    GameState,
    DeploymentState,
    PlayerState,
    ArmyProjection,
    UnitProjection,
    UnitFlags,
} from '@wh40k10e/models/MatchData.js';
export {
    PHASE_ORDER,
    createDefaultUnitFlags,
    createDefaultDeploymentState,
    createDefaultGameState,
} from '@wh40k10e/models/MatchData.js';
export { Match } from '@wh40k10e/models/Match.js';
export { MatchDAO } from '@wh40k10e/dao/MatchDAO.js';
export type {
    CrusadeBattleHonour,
    CrusadeBattleScar,
    CrusadeParticipantData,
    CrusadeUnitProgression,
} from '@wh40k10e/models/CampaignModel.js';
export type {
    Campaign,
    CampaignParticipant,
    CampaignPhase,
    CampaignRanking,
    CampaignStatus,
} from '@models/CampaignModel.js';
export type {
    CrusadeUnitRank,
    RankThreshold,
    CrusadeRequisition,
    BattleHonourType,
    BattleHonourDefinition,
    BattleScarDefinition,
    AgendaCategory,
    CrusadeAgenda,
    XPGainRule,
    BlackstoneUpgrade,
    CrusadeRuleSource,
    CrusadeRules,
} from '@wh40k10e/models/CrusadeRulesModel.js';
export { mergeCatalogues } from '@wh40k10e/models/mergeCatalogues.js';
export { CampaignDAO } from '@data/dao/CampaignDAO.js';

// Config
export { FACTION_MAP, getFactionConfig, getAllFactionIds } from '@wh40k10e/config/factionMap.js';
export type { FactionConfig } from '@wh40k10e/config/factionMap.js';

// Validation rules (plugin-owned, canonical location)
export { validateArmy } from '@wh40k10e/validation/engine.js';
export { validateComposition } from '@wh40k10e/validation/rules/composition.js';
export { validateDetachment } from '@wh40k10e/validation/rules/detachment.js';
export { validateFactionKeyword } from '@wh40k10e/validation/rules/factionKeyword.js';
export { validateEnhancements } from '@wh40k10e/validation/rules/enhancements.js';
export { validateCharacter } from '@wh40k10e/validation/rules/character.js';
export { validateLeaders } from '@wh40k10e/validation/rules/leaders.js';
export { validatePoints } from '@wh40k10e/validation/rules/points.js';
export { validateStrategicReserves } from '@wh40k10e/validation/rules/strategicReserves.js';
export { validateTransport } from '@wh40k10e/validation/rules/transport.js';
export { validateWargear } from '@wh40k10e/validation/rules/wargear.js';
export { validateWarlord } from '@wh40k10e/validation/rules/warlord.js';

// Validation effects
export {
    parseAbility,
    parseAbilities,
    parseFactionRule,
    parseDetachmentRule,
    parseEnhancementEffect,
} from '@wh40k10e/validation/abilityParser.js';
export { parseWeaponKeyword, parseWeaponKeywords } from '@wh40k10e/validation/weaponKeywords.js';
export type {
    Threshold,
    GamePhase as EffectGamePhase,
    AttackKind,
    RollKind,
    NumericExpression,
    ConstantValue,
    DiceExpression,
    RawExpression,
} from '@validation/effects/types.js';

export type {
    WeaponKeyword,
    WeaponKeywordAssault,
    WeaponKeywordHeavy,
    WeaponKeywordRapidFire,
    WeaponKeywordPistol,
    WeaponKeywordTorrent,
    WeaponKeywordBlast,
    WeaponKeywordMelta,
    WeaponKeywordTwinLinked,
    WeaponKeywordLethalHits,
    WeaponKeywordSustainedHits,
    WeaponKeywordDevastatingWounds,
    WeaponKeywordAnti,
    WeaponKeywordPrecision,
    WeaponKeywordIndirectFire,
    WeaponKeywordIgnoresCover,
    WeaponKeywordLance,
    WeaponKeywordHazardous,
    WeaponKeywordExtraAttacks,
    WeaponKeywordRaw,
    Condition,
    ConditionAnd,
    ConditionOr,
    ConditionNot,
    ConditionPhase,
    ConditionAttackType,
    ConditionWithinHalfRange,
    ConditionWithinRange,
    ConditionTargetHasKeyword,
    ConditionSourceHasKeyword,
    ConditionChargedThisTurn,
    ConditionRemainedStationary,
    ConditionAdvancedThisTurn,
    ConditionFellBackThisTurn,
    ConditionInEngagementRange,
    ConditionTargetVisible,
    ConditionBelowHalfStrength,
    ConditionCriticalHit,
    ConditionCriticalWound,
    ConditionTargetModelCountAtLeast,
    ConditionRaw,
    CharacteristicKind,
    GameEffect,
    GameEffectComposite,
    GameEffectConditional,
    GameEffectModifyRoll,
    GameEffectReroll,
    GameEffectModifyCharacteristic,
    GameEffectInvulnerableSave,
    GameEffectFeelNoPain,
    GameEffectMortalWounds,
    GameEffectExtraHits,
    GameEffectExtraAttacks,
    GameEffectAutoHit,
    GameEffectIgnoreCover,
    GameEffectGrantCover,
    GameEffectStealth,
    GameEffectTargetingRestriction,
    GameEffectDeepStrike,
    GameEffectScouts,
    GameEffectInfiltrators,
    GameEffectFightsFirst,
    GameEffectDeadlyDemise,
    GameEffectHazardousPenalty,
    GameEffectRawText,
    RuleTiming,
    RuleTimingPassive,
    RuleTimingTriggered,
    RuleTimingActivated,
    RuleTimingRaw,
    RuleDuration,
    RuleDurationInstant,
    RuleDurationUntilEndOfPhase,
    RuleDurationUntilNextCommandPhase,
    RuleDurationPermanent,
    RuleDurationRaw,
    RuleOrigin,
    RuleOriginWeapon,
    RuleOriginUnitAbility,
    RuleOriginDetachment,
    RuleOriginFactionRule,
    RuleOriginEnhancement,
    StructuredRule,
} from '@wh40k10e/types/effects.js';

export { parseGameSystem, parseCatalogue } from '@providers-bsdata/xmlParser.js';

export { extractUnits, extractWeapons, extractAbilities } from '@wh40k10e/data/extractors.js';

export type {
    BattleScribeGameSystem,
    BattleScribeCatalogue,
    BattleScribeSelectionEntry,
    BattleScribeProfile,
} from '@providers-bsdata/types.js';
