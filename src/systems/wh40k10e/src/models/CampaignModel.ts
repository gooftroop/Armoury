/**
 * Campaign data model for Warhammer 40K 10th edition.
 *
 * Supports two campaign types:
 * - Master Campaign: Parent campaign created by organizer, contains phases, rankings, and participants
 * - Participant Campaign: Child campaign per player, tracks army, crusade progression, and matches
 *
 * For Crusade campaigns, participants track unit progression (XP, battle honours, scars, kills).
 * Generic campaigns are simpler narrative campaigns without crusade progression.
 */

import type { CrusadeUnitRank } from './CrusadeRulesModel.ts';

/**
 * A battle honour earned by a crusade unit.
 */
export interface CrusadeBattleHonour {
    /** Unique honour identifier */
    id: string;

    /** Type of honour */
    type: 'BattleTrait' | 'WeaponEnhancement' | 'PsychicFortitude' | 'CrusadeRelic';

    /** Honour name */
    name: string;

    /** Honour description */
    description: string;

    /** Match ID where honour was earned, null if granted manually */
    earnedInMatchId: string | null;

    /** Timestamp when honour was earned. ISO 8601 */
    earnedAt: string;
}

/**
 * A battle scar acquired by a crusade unit.
 */
export interface CrusadeBattleScar {
    /** Unique scar identifier */
    id: string;

    /** Scar name */
    name: string;

    /** Scar description */
    description: string;

    /** Match ID where scar was gained, null if applied manually */
    gainedInMatchId: string | null;

    /** Timestamp when scar was gained. ISO 8601 */
    gainedAt: string;

    /** Whether scar has been removed */
    removed: boolean;

    /** Timestamp when scar was removed, null if not removed. ISO 8601 */
    removedAt: string | null;
}

/**
 * Crusade progression for a single unit in a participant's army.
 */
export interface CrusadeUnitProgression {
    /** Army unit ID */
    armyUnitId: string;

    /** Experience points earned */
    experiencePoints: number;

    /** Current crusade rank */
    rank: CrusadeUnitRank;

    /** Number of battles fought */
    battleTally: number;

    /** Number of enemy models killed */
    killCount: number;

    /** Number of times marked for greatness */
    markedForGreatnessCount: number;

    /** Battle honours earned */
    battleHonours: CrusadeBattleHonour[];

    /** Battle scars acquired */
    battleScars: CrusadeBattleScar[];

    /** Crusade points spent on upgrades */
    crusadePoints: number;
}

/**
 * Crusade-specific data for a participant (null for generic campaigns).
 */
export interface CrusadeParticipantData {
    /** Total crusade points available */
    crusadePoints: number;

    /** Requisition points available */
    requisitionPoints: number;

    /** Supply limit for army */
    supplyLimit: number;

    /** Unit progression tracking */
    unitProgressions: CrusadeUnitProgression[];
}
