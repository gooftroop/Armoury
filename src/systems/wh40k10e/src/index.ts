/**
 * Warhammer 40K 10th Edition game system plugin exports.
 */

import type { FactionData } from './models/FactionData.ts';
import type { Army } from './models/ArmyModel.ts';
import type { Campaign, CampaignParticipant } from '@armoury/models/CampaignModel';
import type { MatchData } from './models/MatchData.ts';
import type { CrusadeRules } from './models/CrusadeRulesModel.ts';
import type { ChapterApproved } from './models/ChapterApproved.ts';
import type { CoreRules } from './models/CoreRules.ts';
import type { Weapon, Ability, Stratagem, Detachment } from './types/entities.ts';
import type { Unit } from './models/UnitModel.ts';
import type { Faction } from './types/entities.ts';

declare module '@armoury/data-dao/types' {
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
} from './types/entities.ts';
export type { Unit } from './models/UnitModel.ts';
export { isRangedWeapon, isMeleeWeapon } from './types/typeGuards.ts';
export type {
    Army,
    ArmyEnhancement,
    ArmyModelConfig,
    ArmyUnit,
    ArmyVersion,
    ArmyWargearSelection,
    BattleSize,
} from './models/ArmyModel.ts';
export type { FactionData } from './models/FactionData.ts';
export type { FactionRule } from './models/FactionData.ts';
export type { CoreRules } from './models/CoreRules.ts';
export type { ProfileTypeInfo, CostTypeInfo, SharedRule } from './models/CoreRules.ts';
export type { Account, UserPreferences } from '@armoury/models/AccountModel';
export type { Friend, FriendStatus } from '@armoury/models/FriendModel';
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
} from './models/MatchData.ts';
export {
    PHASE_ORDER,
    createDefaultUnitFlags,
    createDefaultDeploymentState,
    createDefaultGameState,
} from './models/MatchData.ts';
export { Match } from './models/Match.ts';
export { MatchDAO } from './dao/MatchDAO.ts';
export type {
    CrusadeBattleHonour,
    CrusadeBattleScar,
    CrusadeParticipantData,
    CrusadeUnitProgression,
} from './models/CampaignModel.ts';
export type {
    Campaign,
    CampaignParticipant,
    CampaignPhase,
    CampaignRanking,
    CampaignStatus,
} from '@armoury/models/CampaignModel';
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
} from './models/CrusadeRulesModel.ts';
export { mergeCatalogues } from './models/mergeCatalogues.ts';
export { CampaignDAO } from '@armoury/data-dao/dao/CampaignDAO';

// Config
export { FACTION_MAP, getFactionConfig, getAllFactionIds } from './config/factionMap.ts';
export type { FactionConfig } from './config/factionMap.ts';

// Validation rules (plugin-owned, canonical location)
export { validateArmy } from './validation/engine.ts';
export { validateComposition } from './validation/rules/composition.ts';
export { validateDetachment } from './validation/rules/detachment.ts';
export { validateFactionKeyword } from './validation/rules/factionKeyword.ts';
export { validateEnhancements } from './validation/rules/enhancements.ts';
export { validateCharacter } from './validation/rules/character.ts';
export { validateLeaders } from './validation/rules/leaders.ts';
export { validatePoints } from './validation/rules/points.ts';
export { validateStrategicReserves } from './validation/rules/strategicReserves.ts';
export { validateTransport } from './validation/rules/transport.ts';
export { validateWargear } from './validation/rules/wargear.ts';
export { validateWarlord } from './validation/rules/warlord.ts';

// Validation effects
export {
    parseAbility,
    parseAbilities,
    parseFactionRule,
    parseDetachmentRule,
    parseEnhancementEffect,
} from './validation/abilityParser.ts';
export { parseWeaponKeyword, parseWeaponKeywords } from './validation/weaponKeywords.ts';
export type {
    Threshold,
    GamePhase as EffectGamePhase,
    AttackKind,
    RollKind,
    NumericExpression,
    ConstantValue,
    DiceExpression,
    RawExpression,
} from '@armoury/validation/effects/types';

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
} from './types/effects.ts';

export { parseGameSystem, parseCatalogue } from '@armoury/providers-bsdata/xmlParser';

export { extractUnits, extractWeapons, extractAbilities } from './data/extractors.ts';

export type {
    BattleScribeGameSystem,
    BattleScribeCatalogue,
    BattleScribeSelectionEntry,
    BattleScribeProfile,
} from '@armoury/providers-bsdata/types';
