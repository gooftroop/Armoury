/**
 * Expanded Unit data model for army building.
 *
 * Represents a complete unit datasheet including stat profiles,
 * composition options, equipped weapons, wargear, abilities, and leader rules.
 */
import type { ParsedConstraint } from '@armoury/validation/constraints/types';
import type { StructuredRule } from '@/types/effects.js';
import type { Entity } from '@/types/entities.js';
import type { Weapon } from '@/types/entities.js';

/**
 * A size option for a unit (e.g. 5 models for 90pts, 10 models for 180pts).
 * Units can have multiple composition options allowing players to select different squad sizes.
 */
export interface UnitComposition {
    /** Number of models in this composition option */
    models: number;
    /** Points cost for this composition option */
    points: number;
}

/**
 * A single weapon or wargear item that can be chosen in a wargear option.
 * Represents one selectable choice within a wargear option group.
 */
export interface WargearChoice {
    /** Unique identifier for this wargear choice */
    id: string;
    /** Display name of the wargear choice */
    name: string;
    /** Points cost for selecting this wargear choice */
    points: number;
    /** Whether this choice is selected by default in the unit datasheet */
    isDefault: boolean;
}

/**
 * A set of equipment options for a unit (e.g. "Any model can replace their boltgun with:").
 * Represents a wargear selection group where players choose from available options.
 */
export interface WargearOption {
    /** Unique identifier for this wargear option group */
    id: string;
    /** Display name of the wargear option (e.g. "Weapon Options") */
    name: string;
    /** Available choices within this wargear option */
    choices: WargearChoice[];
    /** Minimum number of selections required from this option */
    minSelections: number;
    /** Maximum number of selections allowed from this option */
    maxSelections: number;
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

/**
 * Complete unit datasheet for Warhammer 40K 10th edition army building.
 * Represents a single unit type with all its stats, weapons, abilities, and composition options.
 * Units are the fundamental building blocks of armies in Warhammer 40K.
 */
export interface Unit extends Entity {
    /** Faction ID this unit belongs to */
    factionId: string;

    /** Movement characteristic (M) - distance in inches the unit can move (e.g. "6\"", "2D6\"", "-") */
    movement: string;
    /** Toughness characteristic (T) - resilience against wounds (1-10) */
    toughness: number;
    /** Save characteristic (SV) - armour save value (e.g. "3+", "4+") */
    save: string;
    /** Wounds characteristic (W) - hitpoints before destruction */
    wounds: number;
    /** Leadership characteristic (LD) - battle-shock test threshold (lower is better) */
    leadership: number;
    /** Objective Control characteristic (OC) - contribution to controlling objectives */
    objectiveControl: number;
    /** Invulnerable Save characteristic (INV) - optional, never modified by AP (e.g. "4+") */
    invulnerableSave?: string;

    /** Available composition options (different squad sizes and points costs) */
    composition: UnitComposition[];

    /** Ranged weapons available to this unit */
    rangedWeapons: Weapon[];
    /** Melee weapons available to this unit */
    meleeWeapons: Weapon[];

    /** Wargear selection options for this unit */
    wargearOptions: WargearOption[];
    /** Abilities granted by equipped wargear */
    wargearAbilities: WargearAbility[];

    /** Unit abilities and special rules */
    abilities: UnitAbility[];
    /** Parsed and structured unit abilities for rule validation */
    structuredAbilities: StructuredRule[];
    /** Army construction constraints (e.g. max 3 units with same datasheet) */
    constraints: ParsedConstraint[];

    /** Leader attachment information, if this unit is a leader */
    leader?: LeaderInfo;

    /** Unit keywords (e.g. "Infantry", "Vehicle", "Character", "Fly") */
    keywords: string[];
    /** Faction keywords (e.g. "Adeptus Astartes", "Necrons") */
    factionKeywords: string[];

    /** URL to unit artwork or army image */
    imageUrl: string;
}
