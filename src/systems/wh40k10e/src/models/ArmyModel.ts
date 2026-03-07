/**
 * Army list model for Warhammer 40K 10th edition.
 *
 * Represents a complete army roster similar to a BattleScribe roster file,
 * including unit selections, configurations, enhancements, and version history.
 */

/**
 * Configuration for a single model in an army unit.
 */
export interface ArmyModelConfig {
    /** The model name or identifier */
    modelName: string;
    /** Ranged weapon IDs equipped on this model */
    rangedWeaponIds: string[];
    /** Melee weapon IDs equipped on this model */
    meleeWeaponIds: string[];
    /** Wargear selections made for this model */
    wargear?: ArmyWargearSelection[];
}

/**
 * A wargear selection made for an army unit.
 */
export interface ArmyWargearSelection {
    /** The wargear option ID from the unit datasheet */
    wargearOptionId: string;
    /** The chosen wargear choice ID */
    choiceId: string;
    /** The chosen wargear choice name for display */
    choiceName: string;
}

/**
 * An enhancement applied to a Character unit in the army.
 * Enhancements are special upgrades that can be applied to Character units.
 * Max 3 enhancements per army, each must be unique, and only Characters can take them.
 */
export interface ArmyEnhancement {
    /** The enhancement ID from the faction data (references Enhancement.id) */
    enhancementId: string;
    /** The enhancement name for display (e.g. "Warlord Trait", "Relic") */
    enhancementName: string;
    /** Points cost of the enhancement */
    points: number;
}

/**
 * A unit in an army list with user-configured selections and state.
 * Represents a specific instance of a unit type in the army with all player choices applied.
 */
export interface ArmyUnit {
    /** Unique identifier for this army unit instance (different from unitId) */
    id: string;
    /** The unit datasheet ID from faction data (references Unit.id) */
    unitId: string;
    /** Number of models in this unit (determined by composition selection) */
    modelCount: number;
    /** Total points cost for this unit including all selections (composition + wargear + enhancement) */
    totalPoints: number;
    /** Per-model weapon configurations (tracks which weapons each model has) */
    modelConfigs: ArmyModelConfig[];
    /** Wargear selections made for this unit (e.g. chosen upgrades, equipment) */
    wargearSelections: ArmyWargearSelection[];
    /** Enhancement applied to this unit, if any (only for Characters, max 3 per army) */
    enhancement: ArmyEnhancement | null;
    /** ID of the unit this unit is attached to as a Leader, if any (Leader-Bodyguard relationship) */
    leadingUnitId: string | null;
}

/**
 * A snapshot of the army at a specific point in time.
 */
export interface ArmyVersion {
    /** Version number for this snapshot */
    version: number;
    /** When this version was saved */
    savedAt: string; // ISO 8601
    /** Units in this version */
    units: ArmyUnit[];
    /** Total points in this version */
    totalPoints: number;
}

/**
 * Battle size determines the points limit for an army.
 * In Warhammer 40K 10th edition, battle size defines the game's scope and duration.
 * - Incursion: 1000 points, ~2 hours, 44" x 60" battlefield
 * - Strike Force: 2000 points, ~3 hours, 44" x 60" battlefield
 * - Onslaught: 3000 points, ~4 hours, 44" x 90" battlefield
 */
export type BattleSize = 'Incursion' | 'StrikeForce' | 'Onslaught';

/**
 * A complete army list for Warhammer 40K 10th edition.
 * Represents a player's saved army roster with unit selections, configurations, and version history.
 * Similar to a BattleScribe roster file, but stored in the application database.
 */
export interface Army {
    /** Unique identifier for this army */
    id: string;
    /** User ID of the army owner */
    ownerId: string;
    /** Army name for display (e.g. "Ultramarines Strike Force") */
    name: string;
    /** Faction ID from faction data (e.g. "space-marines", "necrons") */
    factionId: string;
    /** Detachment ID from faction data, if any (e.g. "ultramarines-battle-demi-company") */
    detachmentId: string | null;
    /** ID of the unit designated as the Warlord (must be a Character unit) */
    warlordUnitId: string | null;
    /** Battle size (determines points limit and game duration) */
    battleSize: BattleSize;
    /** Points limit for this army based on battle size (1000, 2000, or 3000) */
    pointsLimit: number;
    /** Current units in the army */
    units: ArmyUnit[];
    /** Total points of current units (sum of all unit costs) */
    totalPoints: number;
    /** User-provided notes about the army (strategy, painting status, etc.) */
    notes: string;
    /** Version history of this army (snapshots at different points in time) */
    versions: ArmyVersion[];
    /** Index of the current version in the versions array */
    currentVersion: number;
    /** When this army was created. ISO 8601 */
    createdAt: string;
    /** When this army was last updated. ISO 8601 */
    updatedAt: string;
}
