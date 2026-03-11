/**
 * Warhammer 40K 10th Edition game system plugin exports.
 */

import type { FactionData } from '@/models/FactionData.js';
import type { Army } from '@/models/ArmyModel.js';
import type { Campaign, CampaignParticipant } from '@armoury/models/CampaignModel';
import type { MatchData } from '@/models/MatchData.js';
import type { CrusadeRules } from '@/models/CrusadeRulesModel.js';
import type { ChapterApproved } from '@/models/ChapterApproved.js';
import type { CoreRules } from '@/models/CoreRules.js';
import type { Weapon, Ability, Stratagem, Detachment } from '@/types/entities.js';
import type { Unit } from '@/models/UnitModel.js';
import type { Faction } from '@/types/entities.js';

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
} from '@/types/entities.js';
export type { Unit } from '@/models/UnitModel.js';
export { isRangedWeapon, isMeleeWeapon } from '@/types/typeGuards.js';
export type {
    Army,
    ArmyEnhancement,
    ArmyModelConfig,
    ArmyUnit,
    ArmyVersion,
    ArmyWargearSelection,
    BattleSize,
} from '@/models/ArmyModel.js';
export type { FactionData } from '@/models/FactionData.js';
export type { FactionRule } from '@/models/FactionData.js';
export type { CoreRules } from '@/models/CoreRules.js';
export type { ProfileTypeInfo, CostTypeInfo, SharedRule } from '@/models/CoreRules.js';
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
} from '@/models/MatchData.js';
export {
    PHASE_ORDER,
    createDefaultUnitFlags,
    createDefaultDeploymentState,
    createDefaultGameState,
} from '@/models/MatchData.js';
export { Match } from '@/models/Match.js';
export { MatchDAO } from '@/dao/MatchDAO.js';
export type {
    CrusadeBattleHonour,
    CrusadeBattleScar,
    CrusadeParticipantData,
    CrusadeUnitProgression,
} from '@/models/CampaignModel.js';
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
} from '@/models/CrusadeRulesModel.js';
export { mergeCatalogues } from '@/models/mergeCatalogues.js';
export { CampaignDAO } from '@armoury/data-dao/dao/CampaignDAO';

// Config
export { FACTION_MAP, getFactionConfig, getAllFactionIds } from '@/config/factionMap.js';
export type { FactionConfig } from '@/config/factionMap.js';

// Validation rules (plugin-owned, canonical location)
export { validateArmy } from '@/validation/engine.js';
export { validateComposition } from '@/validation/rules/composition.js';
export { validateDetachment } from '@/validation/rules/detachment.js';
export { validateFactionKeyword } from '@/validation/rules/factionKeyword.js';
export { validateEnhancements } from '@/validation/rules/enhancements.js';
export { validateCharacter } from '@/validation/rules/character.js';
export { validateLeaders } from '@/validation/rules/leaders.js';
export { validatePoints } from '@/validation/rules/points.js';
export { validateStrategicReserves } from '@/validation/rules/strategicReserves.js';
export { validateTransport } from '@/validation/rules/transport.js';
export { validateWargear } from '@/validation/rules/wargear.js';
export { validateWarlord } from '@/validation/rules/warlord.js';

// Validation effects
export {
    parseAbility,
    parseAbilities,
    parseFactionRule,
    parseDetachmentRule,
    parseEnhancementEffect,
} from '@/validation/abilityParser.js';
export { parseWeaponKeyword, parseWeaponKeywords } from '@/validation/weaponKeywords.js';
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
} from '@/types/effects.js';

export { parseGameSystem, parseCatalogue } from '@armoury/providers-bsdata/xmlParser';

export { extractUnits, extractWeapons, extractAbilities } from '@/data/extractors.js';

export type {
    BattleScribeGameSystem,
    BattleScribeCatalogue,
    BattleScribeSelectionEntry,
    BattleScribeProfile,
} from '@armoury/providers-bsdata/types';
