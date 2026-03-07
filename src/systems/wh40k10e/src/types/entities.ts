/**
 * Warhammer 40K 10th Edition entity interfaces.
 */

import type { StructuredRule, WeaponKeyword } from '@wh40k10e/types/effects.js';

/**
 * Base entity interface for all domain objects.
 * Provides common identity and source tracking properties.
 */
export interface Entity {
    /** Unique identifier for the entity */
    id: string;
    /** Display name of the entity */
    name: string;
    /** Path to the source file (BattleScribe .gst or .cat file) where this entity was defined */
    sourceFile: string;
    /** SHA hash of the source file for change detection and caching */
    sourceSha: string;
}

/**
 * Represents a faction for a tabletop game system.
 * Extends Entity with faction-specific data source information.
 */
export interface Faction extends Entity {
    /** Path to the BattleScribe catalogue (.cat) file for this faction */
    catalogueFile: string;
}

/**
 * Base interface for weapon profiles (ranged and melee).
 * Contains common weapon statistics and ability keywords.
 */
interface WeaponBase extends Entity {
    /** Number of attacks (e.g., "1", "2", "D6", "2D6") - can be fixed or random */
    attacks: string;
    /** Ballistic Skill (BS) for ranged weapons or Weapon Skill (WS) for melee weapons (e.g., "3+", "4+") */
    skill: string;
    /** Strength characteristic - compared against target Toughness for wound rolls */
    strength: number;
    /** Armour Penetration - subtracted from target's saving throw (negative values like -1, -2) */
    ap: number;
    /** Damage inflicted per unsaved hit (e.g., "1", "D3", "D6+1") - can be fixed or random */
    damage: string;
    /** Raw weapon ability keywords as strings (e.g., "Assault", "Heavy", "Lethal Hits") */
    keywords: string[];
    /** Parsed weapon keywords with structured effect information */
    parsedKeywords: WeaponKeyword[];
    /** Optional reference to the unit this weapon belongs to */
    unitId?: string;
}

/**
 * Ranged weapon profile with distance-based targeting.
 * Extends WeaponBase with range characteristic.
 */
export interface RangedWeapon extends WeaponBase {
    /** Literal type discriminator for ranged weapons */
    type: 'ranged';
    /** Maximum distance in inches (e.g., "24\"", "12\"", "Aura 6\"") */
    range: string;
}

/**
 * Melee weapon profile for close combat.
 * Extends WeaponBase with melee-specific characteristics (range is always "Melee").
 */
export interface MeleeWeapon extends WeaponBase {
    /** Literal type discriminator for melee weapons */
    type: 'melee';
}

/**
 * Union type for any weapon (ranged or melee).
 * Use type guards isRangedWeapon() or isMeleeWeapon() to narrow the type.
 */
export type Weapon = RangedWeapon | MeleeWeapon;

/**
 * Represents a unit ability, stratagem, or special rule in Warhammer 40K.
 * Abilities define special effects and modifications to game mechanics.
 */
export interface Ability extends Entity {
    /** Full text description of the ability effect */
    description: string;
    /** Optional game phase when the ability applies (e.g., "Command", "Movement", "Shooting", "Fight") */
    phase?: string;
    /** Optional structured effect information for programmatic processing */
    effect?: string;
}

/**
 * Represents a Warhammer 40K stratagem - a special tactic that costs Command Points.
 * Stratagems provide powerful effects that can be used during specific game phases.
 */
export interface Stratagem extends Entity {
    /** Command Point cost to use this stratagem (typically 1 or 2) */
    cp: number;
    /** Game phase when this stratagem can be used (e.g., "Command", "Movement", "Shooting", "Fight") */
    phase: string;
    /** Full text description of the stratagem effect */
    description: string;
    /** Optional reference to the detachment this stratagem belongs to (faction-specific stratagems) */
    detachmentId?: string;
}

/**
 * Represents a Warhammer 40K detachment - a set of faction-specific rules and abilities.
 * Detachments provide stratagems, enhancements, and special rules for army construction.
 */
export interface Detachment extends Entity {
    /** Reference to the faction this detachment belongs to */
    factionId: string;
    /** Raw text descriptions of detachment rules and abilities */
    rules: string[];
    /** Parsed detachment rules with structured effect information */
    structuredRules: StructuredRule[];
    /** Available enhancements that can be applied to characters in this detachment */
    enhancements: Enhancement[];
}

/**
 * Represents a Warhammer 40K enhancement - a special upgrade that can be applied to characters.
 * Enhancements cost points and provide powerful abilities to individual models.
 */
export interface Enhancement {
    /** Unique identifier for the enhancement */
    id: string;
    /** Display name of the enhancement */
    name: string;
    /** Points cost to add this enhancement to a character */
    points: number;
    /** Full text description of the enhancement effect */
    description: string;
    /** Unit keywords that are eligible to receive this enhancement (e.g., "Character", "Infantry") */
    eligibleKeywords: string[];
    /** Parsed enhancement effect with structured rule information, or null if not yet parsed */
    structuredEffect: StructuredRule | null;
}

/**
 * Represents a Warhammer 40K keyword - a tag used to categorize units and abilities.
 * Keywords are used for army construction rules and ability targeting.
 */
export interface Keyword {
    /** Unique identifier for the keyword */
    id: string;
    /** Display name of the keyword (e.g., "Infantry", "Character", "Adeptus Astartes") */
    name: string;
    /** Keyword category: 'faction' for faction keywords (e.g., Adeptus Astartes) or 'unit' for unit keywords (e.g., Infantry, Vehicle) */
    type: 'faction' | 'unit';
}

/**
 * An ability specific to a piece of wargear.
 * Describes special rules or effects granted by equipped weapons or equipment.
 */
export interface WargearAbility {
    /** Unique identifier for this wargear ability */
    id: string;
    /** Display name of the wargear ability */
    name: string;
    /** Full description of the ability's effect */
    description: string;
}

/**
 * Describes which units a leader can be attached to.
 * Leaders are Character units that can form Attached units with Bodyguard units.
 * In Warhammer 40K, a Leader attaches to a Bodyguard unit, and attacks cannot be allocated
 * to the Leader until the Bodyguard is destroyed.
 */
export interface LeaderInfo {
    /** List of unit keyword names this leader can attach to as a Bodyguard */
    canAttachTo: string[];
    /** Description of the leader ability (e.g. "This unit can be attached to a Bodyguard unit") */
    leaderAbility: string;
}

/**
 * An ability with full description, attached to a unit.
 * Represents special rules, keywords, or effects that apply to the unit in battle.
 */
export interface UnitAbility {
    /** Unique identifier for this unit ability */
    id: string;
    /** Display name of the ability */
    name: string;
    /** Full description of the ability's effect in the game */
    description: string;
}

export type { Unit, UnitComposition, WargearOption, WargearChoice } from '@wh40k10e/models/UnitModel.js';
