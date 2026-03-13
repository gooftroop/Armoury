/**
 * Warhammer 40K 10th Edition effect types, conditions, and rule structures.
 *
 * These types were extracted from the shared validation package because they
 * encode game-specific concepts (weapon keywords, engagement range, battle-shock,
 * Deep Strike, etc.) that belong in the game system plugin.
 */
import type { Threshold, NumericExpression, GamePhase, AttackKind, RollKind } from '@armoury/validation';

/**
 * Weapon keyword token parsed from rules text.
 *
 * Represents a parsed weapon keyword from Warhammer 40K 10th Edition rules.
 * Each variant corresponds to a specific weapon ability that modifies how attacks
 * are made or resolved. Keywords are extracted from weapon profiles and ability text.
 *
 * The 19 variants represent all weapon keywords from the core rules:
 * - Assault: Can shoot after Advancing
 * - Heavy: +1 to hit if unit Remained Stationary
 * - Rapid Fire X: +X attacks at half range
 * - Pistol: Can shoot in Engagement Range (only at engaged enemy)
 * - Torrent: Auto-hits (no hit roll needed)
 * - Blast: +1 attack per 5 models in target (can't target engaged units)
 * - Melta X: +X damage at half range
 * - Twin-linked: Can re-roll wound rolls
 * - Lethal Hits: Critical Hits auto-wound
 * - Sustained Hits X: Critical Hits score X additional hits
 * - Devastating Wounds: Critical Wounds inflict mortal wounds equal to Damage
 * - Anti-KEYWORD X+: Unmodified wound roll of X+ is a Critical Wound vs matching keyword
 * - Precision: Can allocate wounds to visible Characters in Attached units
 * - Indirect Fire: Can target non-visible units (-1 to hit, target gets cover)
 * - Ignores Cover: Target cannot benefit from cover
 * - Lance: +1 to wound if bearer charged this turn
 * - Hazardous: After unit shoots/fights, roll D6 per Hazardous weapon; on 1, model destroyed
 * - Extra Attacks: Attacks made in addition to main weapon
 * - Raw: Unparsed keyword when pattern matching fails
 */
export type WeaponKeyword =
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

/**
 * Assault weapon keyword.
 *
 * Allows the unit to shoot after Advancing. Normally units cannot shoot if they Advanced.
 */
export interface WeaponKeywordAssault {
    /**
     * Discriminator for assault keyword.
     */
    type: 'assault';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Heavy weapon keyword.
 *
 * Grants +1 to hit rolls if the unit Remained Stationary this turn.
 */
export interface WeaponKeywordHeavy {
    /**
     * Discriminator for heavy keyword.
     */
    type: 'heavy';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Rapid Fire weapon keyword.
 *
 * Grants additional attacks at half range. At half range or less, the unit makes
 * attacks + X additional attacks instead of the normal number of attacks.
 */
export interface WeaponKeywordRapidFire {
    /**
     * Discriminator for rapid fire keyword.
     */
    type: 'rapidFire';
    /**
     * Additional attacks at half range.
     */
    attacks: number;
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Pistol weapon keyword.
 *
 * Can be shot in Engagement Range, but only at enemy units the bearer is engaged with.
 */
export interface WeaponKeywordPistol {
    /**
     * Discriminator for pistol keyword.
     */
    type: 'pistol';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Torrent weapon keyword.
 *
 * Automatically hits the target without rolling to hit.
 */
export interface WeaponKeywordTorrent {
    /**
     * Discriminator for torrent keyword.
     */
    type: 'torrent';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Blast weapon keyword.
 *
 * Grants +1 attack for every 5 models in the target unit. Cannot target units in Engagement Range.
 */
export interface WeaponKeywordBlast {
    /**
     * Discriminator for blast keyword.
     */
    type: 'blast';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Melta weapon keyword.
 *
 * Grants bonus damage at half range or less. Damage is increased by X when attacking at half range.
 */
export interface WeaponKeywordMelta {
    /**
     * Discriminator for melta keyword.
     */
    type: 'melta';
    /**
     * Bonus damage at half range.
     */
    bonusDamage: number;
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Twin-linked weapon keyword.
 *
 * Can re-roll wound rolls made for this weapon.
 */
export interface WeaponKeywordTwinLinked {
    /**
     * Discriminator for twin-linked keyword.
     */
    type: 'twinLinked';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Lethal Hits weapon keyword.
 *
 * Critical Hits (unmodified 6 to hit) automatically wound the target without rolling to wound.
 */
export interface WeaponKeywordLethalHits {
    /**
     * Discriminator for lethal hits keyword.
     */
    type: 'lethalHits';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Sustained Hits weapon keyword.
 *
 * Critical Hits (unmodified 6 to hit) generate X additional hits automatically.
 */
export interface WeaponKeywordSustainedHits {
    /**
     * Discriminator for sustained hits keyword.
     */
    type: 'sustainedHits';
    /**
     * Extra hits generated on critical hits.
     */
    extraHits: number;
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Devastating Wounds weapon keyword.
 *
 * Critical Wounds (unmodified 6 to wound) inflict mortal wounds equal to the Damage characteristic instead of normal wounds.
 */
export interface WeaponKeywordDevastatingWounds {
    /**
     * Discriminator for devastating wounds keyword.
     */
    type: 'devastatingWounds';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Anti keyword with target and threshold.
 *
 * Unmodified wound rolls of X+ against targets with the specified keyword are Critical Wounds.
 * Example: Anti-Infantry 4+ means unmodified 4+ to wound vs Infantry keyword is a Critical Wound.
 */
export interface WeaponKeywordAnti {
    /**
     * Discriminator for anti keyword.
     */
    type: 'anti';
    /**
     * Target keyword the weapon is anti against.
     */
    targetKeyword: string;
    /**
     * Threshold for critical wounds.
     */
    threshold: Threshold;
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Precision weapon keyword.
 *
 * Wounds from this weapon can be allocated to visible Characters in Attached units, bypassing the normal allocation rules.
 */
export interface WeaponKeywordPrecision {
    /**
     * Discriminator for precision keyword.
     */
    type: 'precision';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Indirect Fire weapon keyword.
 *
 * Can target non-visible units. Attacks made this way suffer -1 to hit, and the target gains the Benefit of Cover.
 */
export interface WeaponKeywordIndirectFire {
    /**
     * Discriminator for indirect fire keyword.
     */
    type: 'indirectFire';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Ignores Cover weapon keyword.
 *
 * The target cannot benefit from cover when hit by this weapon.
 */
export interface WeaponKeywordIgnoresCover {
    /**
     * Discriminator for ignores cover keyword.
     */
    type: 'ignoresCover';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Lance weapon keyword.
 *
 * Grants +1 to wound rolls if the bearer charged this turn.
 */
export interface WeaponKeywordLance {
    /**
     * Discriminator for lance keyword.
     */
    type: 'lance';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Hazardous weapon keyword.
 *
 * After the unit shoots or fights with this weapon, roll D6 per Hazardous weapon.
 * On a 1, a model is destroyed (or 3 mortal wounds for Characters/Monsters/Vehicles).
 */
export interface WeaponKeywordHazardous {
    /**
     * Discriminator for hazardous keyword.
     */
    type: 'hazardous';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Extra Attacks weapon keyword.
 *
 * This weapon makes attacks in addition to the unit's normal attacks.
 */
export interface WeaponKeywordExtraAttacks {
    /**
     * Discriminator for extra attacks keyword.
     */
    type: 'extraAttacks';
    /**
     * Original token text when available.
     */
    raw?: string;
}

/**
 * Raw weapon keyword when parsing fails.
 */
export interface WeaponKeywordRaw {
    /**
     * Discriminator for raw keyword.
     */
    type: 'raw';
    /**
     * Unparsed keyword text.
     */
    text: string;
}

/**
 * Boolean condition evaluated against game state.
 *
 * Represents a predicate that can be evaluated during gameplay to determine
 * if a rule or effect applies. Conditions can be combined with logical operators
 * (And, Or, Not) to create complex rule logic. Each variant represents a specific
 * game state check (phase, attack type, unit status, etc.).
 */
export type Condition =
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

/**
 * Logical AND of multiple conditions.
 */
export interface ConditionAnd {
    /**
     * Discriminator for and condition.
     */
    type: 'and';
    /**
     * Conditions that must all be true.
     */
    conditions: Condition[];
}

/**
 * Logical OR of multiple conditions.
 */
export interface ConditionOr {
    /**
     * Discriminator for or condition.
     */
    type: 'or';
    /**
     * Conditions where at least one must be true.
     */
    conditions: Condition[];
}

/**
 * Logical NOT of a condition.
 */
export interface ConditionNot {
    /**
     * Discriminator for not condition.
     */
    type: 'not';
    /**
     * Condition to invert.
     */
    condition: Condition;
}

/**
 * Condition for a specific game phase.
 */
export interface ConditionPhase {
    /**
     * Discriminator for phase condition.
     */
    type: 'phase';
    /**
     * Game phase to match.
     */
    phase: Exclude<GamePhase, 'any'>;
}

/**
 * Condition for attack type.
 */
export interface ConditionAttackType {
    /**
     * Discriminator for attack type condition.
     */
    type: 'attackType';
    /**
     * Attack type to match.
     */
    attackType: 'ranged' | 'melee';
}

/**
 * Condition when target is within half range.
 */
export interface ConditionWithinHalfRange {
    /**
     * Discriminator for within half range condition.
     */
    type: 'withinHalfRange';
}

/**
 * Condition when target is within a specific range.
 */
export interface ConditionWithinRange {
    /**
     * Discriminator for within range condition.
     */
    type: 'withinRange';
    /**
     * Range in inches.
     */
    range: number;
}

/**
 * Condition when target has a keyword.
 */
export interface ConditionTargetHasKeyword {
    /**
     * Discriminator for target keyword condition.
     */
    type: 'targetHasKeyword';
    /**
     * Keyword to check on target.
     */
    keyword: string;
}

/**
 * Condition when source has a keyword.
 */
export interface ConditionSourceHasKeyword {
    /**
     * Discriminator for source keyword condition.
     */
    type: 'sourceHasKeyword';
    /**
     * Keyword to check on source.
     */
    keyword: string;
}

/**
 * Condition when the unit charged this turn.
 */
export interface ConditionChargedThisTurn {
    /**
     * Discriminator for charged this turn condition.
     */
    type: 'chargedThisTurn';
}

/**
 * Condition when the unit remained stationary.
 */
export interface ConditionRemainedStationary {
    /**
     * Discriminator for remained stationary condition.
     */
    type: 'remainedStationary';
}

/**
 * Condition when the unit advanced this turn.
 */
export interface ConditionAdvancedThisTurn {
    /**
     * Discriminator for advanced this turn condition.
     */
    type: 'advancedThisTurn';
}

/**
 * Condition when the unit fell back this turn.
 */
export interface ConditionFellBackThisTurn {
    /**
     * Discriminator for fell back this turn condition.
     */
    type: 'fellBackThisTurn';
}

/**
 * Condition when unit is in engagement range.
 */
export interface ConditionInEngagementRange {
    /**
     * Discriminator for in engagement range condition.
     */
    type: 'inEngagementRange';
}

/**
 * Condition when target is visible.
 */
export interface ConditionTargetVisible {
    /**
     * Discriminator for target visible condition.
     */
    type: 'targetVisible';
}

/**
 * Condition when unit is below half strength.
 */
export interface ConditionBelowHalfStrength {
    /**
     * Discriminator for below half strength condition.
     */
    type: 'belowHalfStrength';
}

/**
 * Condition when a critical hit is rolled.
 */
export interface ConditionCriticalHit {
    /**
     * Discriminator for critical hit condition.
     */
    type: 'criticalHit';
}

/**
 * Condition when a critical wound is rolled.
 */
export interface ConditionCriticalWound {
    /**
     * Discriminator for critical wound condition.
     */
    type: 'criticalWound';
}

/**
 * Condition when target has at least a model count.
 */
export interface ConditionTargetModelCountAtLeast {
    /**
     * Discriminator for target model count condition.
     */
    type: 'targetModelCountAtLeast';
    /**
     * Minimum model count required.
     */
    count: number;
}

/**
 * Raw condition when parsing fails.
 */
export interface ConditionRaw {
    /**
     * Discriminator for raw condition.
     */
    type: 'raw';
    /**
     * Unparsed condition text.
     */
    text: string;
}

/**
 * Characteristics that can be modified by effects.
 */
export type CharacteristicKind = string;

/**
 * Game effect describing semantic rule outcomes.
 *
 * Represents a parsed game effect that describes what a rule does mechanically.
 * Effects can be simple (e.g., "grant stealth") or complex (e.g., "conditional
 * effect that applies different bonuses based on game state"). Each variant
 * represents a specific type of game mechanic that can be applied to units.
 */
export type GameEffect =
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

/**
 * Composite effect of multiple effects.
 */
export interface GameEffectComposite {
    /**
     * Discriminator for composite effect.
     */
    type: 'composite';
    /**
     * Effects to apply in order.
     */
    effects: GameEffect[];
}

/**
 * Conditional effect based on a predicate.
 */
export interface GameEffectConditional {
    /**
     * Discriminator for conditional effect.
     */
    type: 'conditional';
    /**
     * Condition that must be true.
     */
    when: Condition;
    /**
     * Effect applied when condition is true.
     */
    then: GameEffect;
    /**
     * Effect applied when condition is false.
     */
    else?: GameEffect;
}

/**
 * Modifier applied to a roll.
 */
export interface GameEffectModifyRoll {
    /**
     * Discriminator for modify roll effect.
     */
    type: 'modifyRoll';
    /**
     * Roll type to modify.
     */
    roll: RollKind;
    /**
     * Modifier applied to the roll.
     */
    modifier: number;
    /**
     * Optional attack type scope.
     */
    attackType?: AttackKind;
}

/**
 * Reroll effect for a roll type.
 */
export interface GameEffectReroll {
    /**
     * Discriminator for reroll effect.
     */
    type: 'reroll';
    /**
     * Roll type to reroll.
     */
    roll: RollKind;
    /**
     * Reroll mode applied.
     */
    mode: 'all' | 'ones' | 'failed';
    /**
     * Optional attack type scope.
     */
    attackType?: AttackKind;
}

/**
 * Modification to a characteristic.
 */
export interface GameEffectModifyCharacteristic {
    /**
     * Discriminator for modify characteristic effect.
     */
    type: 'modifyCharacteristic';
    /**
     * Characteristic to modify.
     */
    characteristic: CharacteristicKind;
    /**
     * Operation applied to the characteristic.
     */
    operation: 'add' | 'set';
    /**
     * Value used by the operation.
     */
    value: NumericExpression;
}

/**
 * Invulnerable save granted to a unit.
 */
export interface GameEffectInvulnerableSave {
    /**
     * Discriminator for invulnerable save effect.
     */
    type: 'invulnerableSave';
    /**
     * Threshold used for the save.
     */
    threshold: Threshold;
}

/**
 * Feel No Pain rule.
 */
export interface GameEffectFeelNoPain {
    /**
     * Discriminator for feel no pain effect.
     */
    type: 'feelNoPain';
    /**
     * Threshold used to ignore a wound.
     */
    threshold: Threshold;
    /**
     * Scope of wounds the rule applies to.
     */
    against: 'all' | 'mortalOnly';
}

/**
 * Mortal wounds applied by an effect.
 */
export interface GameEffectMortalWounds {
    /**
     * Discriminator for mortal wounds effect.
     */
    type: 'mortalWounds';
    /**
     * Amount of mortal wounds.
     */
    amount: NumericExpression;
    /**
     * Timing for when mortal wounds are applied.
     */
    timing: 'onCriticalWound' | 'onDeath' | 'onCharge' | 'direct';
}

/**
 * Extra hits generated on a trigger.
 */
export interface GameEffectExtraHits {
    /**
     * Discriminator for extra hits effect.
     */
    type: 'extraHits';
    /**
     * Number of extra hits to add.
     */
    extraHits: number;
    /**
     * Trigger for extra hits.
     */
    on: 'criticalHit';
}

/**
 * Extra attacks generated for a unit.
 */
export interface GameEffectExtraAttacks {
    /**
     * Discriminator for extra attacks effect.
     */
    type: 'extraAttacks';
    /**
     * Number of attacks added.
     */
    attacks: NumericExpression;
    /**
     * Optional attack type scope.
     */
    attackType?: AttackKind;
}

/**
 * Auto-hit effect for attacks.
 */
export interface GameEffectAutoHit {
    /**
     * Discriminator for auto hit effect.
     */
    type: 'autoHit';
}

/**
 * Ignore cover effect for attacks.
 */
export interface GameEffectIgnoreCover {
    /**
     * Discriminator for ignore cover effect.
     */
    type: 'ignoreCover';
    /**
     * Optional attack type scope.
     */
    attackType?: AttackKind;
}

/**
 * Grant cover effect to a unit.
 */
export interface GameEffectGrantCover {
    /**
     * Discriminator for grant cover effect.
     */
    type: 'grantCover';
}

/**
 * Stealth effect reducing ranged hit rolls.
 */
export interface GameEffectStealth {
    /**
     * Discriminator for stealth effect.
     */
    type: 'stealth';
}

/**
 * Targeting restriction effect.
 */
export interface GameEffectTargetingRestriction {
    /**
     * Discriminator for targeting restriction effect.
     */
    type: 'targetingRestriction';
    /**
     * Maximum range at which the target can be chosen.
     */
    maxRange: number;
    /**
     * Keywords that are exempt from the restriction.
     */
    exceptions?: string[];
}

/**
 * Deep Strike deployment effect.
 */
export interface GameEffectDeepStrike {
    /**
     * Discriminator for deep strike effect.
     */
    type: 'deepStrike';
    /**
     * Minimum distance from enemy models.
     */
    minDistanceFromEnemies: number;
}

/**
 * Scouts pre-game move effect.
 */
export interface GameEffectScouts {
    /**
     * Discriminator for scouts effect.
     */
    type: 'scouts';
    /**
     * Distance of the scouts move.
     */
    distance: number;
    /**
     * Minimum distance from enemy models.
     */
    minDistanceFromEnemies: number;
}

/**
 * Infiltrators deployment effect.
 */
export interface GameEffectInfiltrators {
    /**
     * Discriminator for infiltrators effect.
     */
    type: 'infiltrators';
    /**
     * Minimum distance from enemy models.
     */
    minDistanceFromEnemies: number;
}

/**
 * Fights First effect for a unit.
 */
export interface GameEffectFightsFirst {
    /**
     * Discriminator for fights first effect.
     */
    type: 'fightsFirst';
}

/**
 * Deadly Demise explosion effect.
 */
export interface GameEffectDeadlyDemise {
    /**
     * Discriminator for deadly demise effect.
     */
    type: 'deadlyDemise';
    /**
     * Amount of mortal wounds dealt.
     */
    amount: NumericExpression;
}

/**
 * Hazardous penalty effect for failed hazardous rolls.
 */
export interface GameEffectHazardousPenalty {
    /**
     * Discriminator for hazardous penalty effect.
     */
    type: 'hazardousPenalty';
    /**
     * Die result that causes the penalty.
     */
    failsOn: number;
    /**
     * Outcome for standard models.
     */
    normalOutcome: 'modelDestroyed';
    /**
     * Keywords that use the heavy penalty instead.
     */
    heavyKeywords?: string[];
    /**
     * Mortal wounds dealt for heavy models.
     */
    heavyMortalWounds?: number;
}

/**
 * Raw text effect when parsing fails.
 */
export interface GameEffectRawText {
    /**
     * Discriminator for raw text effect.
     */
    type: 'rawText';
    /**
     * Unparsed effect text.
     */
    text: string;
    /**
     * Optional reason for fallback.
     */
    reason?: string;
}

/**
 * Timing for when a rule applies.
 *
 * Describes when a rule is active or triggered during gameplay.
 * - Passive: Always active during a specific phase
 * - Triggered: Activates when a specific event occurs
 * - Activated: Requires player activation (e.g., spending Command Points)
 * - Raw: Unparsed timing when pattern matching fails
 */
export type RuleTiming = RuleTimingPassive | RuleTimingTriggered | RuleTimingActivated | RuleTimingRaw;

/**
 * Duration for a triggered or active rule.
 *
 * Describes how long a triggered or activated rule remains in effect.
 * - Instant: Effect applies immediately and ends
 * - UntilEndOfPhase: Effect lasts until the current phase ends
 * - UntilNextCommandPhase: Effect lasts until the next Command phase
 * - Permanent: Effect is permanent (e.g., unit gains a keyword)
 * - Raw: Unparsed duration when pattern matching fails
 */
export type RuleDuration =
    | RuleDurationInstant
    | RuleDurationUntilEndOfPhase
    | RuleDurationUntilNextCommandPhase
    | RuleDurationPermanent
    | RuleDurationRaw;

/**
 * Passive timing with a phase scope.
 */
export interface RuleTimingPassive {
    /**
     * Discriminator for passive timing.
     */
    type: 'passive';
    /**
     * Phase the rule is relevant to.
     */
    phase: GamePhase;
}

/**
 * Triggered timing with a duration.
 */
export interface RuleTimingTriggered {
    /**
     * Discriminator for triggered timing.
     */
    type: 'triggered';
    /**
     * Brief description of the trigger event.
     */
    trigger: string;
    /**
     * Phase in which the trigger occurs.
     */
    phase: GamePhase;
    /**
     * Duration of the triggered effect.
     */
    duration: RuleDuration;
}

/**
 * Activated timing with optional usage limits.
 */
export interface RuleTimingActivated {
    /**
     * Discriminator for activated timing.
     */
    type: 'activated';
    /**
     * Phase the activation occurs in.
     */
    phase: GamePhase;
    /**
     * Optional usage limit.
     */
    usageLimit?: 'oncePerBattle' | 'oncePerPhase';
}

/**
 * Raw timing when parsing fails.
 */
export interface RuleTimingRaw {
    /**
     * Discriminator for raw timing.
     */
    type: 'raw';
    /**
     * Unparsed timing text.
     */
    text: string;
}

/**
 * Instant duration for a rule.
 */
export interface RuleDurationInstant {
    /**
     * Discriminator for instant duration.
     */
    type: 'instant';
}

/**
 * Duration until the end of a phase.
 */
export interface RuleDurationUntilEndOfPhase {
    /**
     * Discriminator for until end of phase duration.
     */
    type: 'untilEndOfPhase';
    /**
     * Optional explicit phase if different from current.
     */
    phase?: GamePhase;
}

/**
 * Duration until the next command phase.
 */
export interface RuleDurationUntilNextCommandPhase {
    /**
     * Discriminator for until next command phase duration.
     */
    type: 'untilNextCommandPhase';
}

/**
 * Permanent duration for a rule.
 */
export interface RuleDurationPermanent {
    /**
     * Discriminator for permanent duration.
     */
    type: 'permanent';
}

/**
 * Raw duration when parsing fails.
 */
export interface RuleDurationRaw {
    /**
     * Discriminator for raw duration.
     */
    type: 'raw';
    /**
     * Unparsed duration text.
     */
    text: string;
}

/**
 * Origin of a parsed rule.
 *
 * Identifies where a rule comes from in the BattleScribe data hierarchy.
 * - Weapon: Rule from a weapon profile
 * - UnitAbility: Rule from a unit ability
 * - Detachment: Rule from the selected detachment
 * - FactionRule: Rule from the faction rules
 * - Enhancement: Rule from an enhancement upgrade
 */
export type RuleOrigin =
    | RuleOriginWeapon
    | RuleOriginUnitAbility
    | RuleOriginDetachment
    | RuleOriginFactionRule
    | RuleOriginEnhancement;

/**
 * Rule origin from a weapon.
 */
export interface RuleOriginWeapon {
    /**
     * Discriminator for weapon origin.
     */
    type: 'weapon';
    /**
     * Optional weapon identifier.
     */
    weaponId?: string;
    /**
     * Optional weapon display name.
     */
    weaponName?: string;
}

/**
 * Rule origin from a unit ability.
 */
export interface RuleOriginUnitAbility {
    /**
     * Discriminator for unit ability origin.
     */
    type: 'unitAbility';
    /**
     * Optional ability identifier.
     */
    abilityId?: string;
    /**
     * Ability display name.
     */
    abilityName: string;
}

/**
 * Rule origin from a detachment.
 */
export interface RuleOriginDetachment {
    /**
     * Discriminator for detachment origin.
     */
    type: 'detachment';
    /**
     * Optional detachment identifier.
     */
    detachmentId?: string;
    /**
     * Optional detachment display name.
     */
    detachmentName?: string;
}

/**
 * Rule origin from a faction rule.
 */
export interface RuleOriginFactionRule {
    /**
     * Discriminator for faction rule origin.
     */
    type: 'factionRule';
    /**
     * Optional rule identifier.
     */
    ruleId?: string;
    /**
     * Rule display name.
     */
    ruleName: string;
}

/**
 * Rule origin from an enhancement.
 */
export interface RuleOriginEnhancement {
    /**
     * Discriminator for enhancement origin.
     */
    type: 'enhancement';
    /**
     * Optional enhancement identifier.
     */
    enhancementId?: string;
    /**
     * Optional enhancement display name.
     */
    enhancementName?: string;
}

/**
 * Structured rule with parsed metadata and effect.
 *
 * Represents a fully parsed game rule extracted from BattleScribe data.
 * Contains the original text, parsed effect, timing information, and confidence
 * score indicating how well the parser understood the rule. Used by the validation
 * engine to evaluate rule effects during army construction and gameplay.
 *
 * The confidence field (0-1) indicates parsing success:
 * - 1.0: Exact match with known pattern
 * - 0.7-0.9: Partial match with pattern
 * - 0.0: No match, rawText fallback used
 */
export interface StructuredRule {
    /**
     * Unique rule identifier.
     * Used to reference this rule in validation results and error messages.
     */
    id: string;
    /**
     * Human-readable rule name.
     * Displayed to users in UI and error messages.
     */
    name: string;
    /**
     * Original BattleScribe text for the rule.
     * Preserved for debugging and fallback display when parsing fails.
     */
    originalText: string;
    /**
     * Origin metadata for the rule.
     * Identifies where this rule comes from (weapon, ability, detachment, etc.).
     */
    origin: RuleOrigin;
    /**
     * Timing description for the rule.
     * Describes when the rule is active or triggered during gameplay.
     */
    timing: RuleTiming;
    /**
     * Parsed effect data for the rule.
     * The structured game mechanic that this rule implements.
     */
    effect: GameEffect;
    /**
     * Optional parse confidence from 0 to 1.
     * Indicates how well the parser understood the original text.
     * 0 = rawText fallback, 1 = exact match.
     */
    confidence?: number;
}
