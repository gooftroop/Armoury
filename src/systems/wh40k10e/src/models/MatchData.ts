/**
 * Warhammer 40K 10th Edition match data types.
 *
 * Contains only game-specific data: mission configuration, round/phase tracking,
 * deployment state, per-player army projections with unit state, and CP tracking.
 * Player identity, scoring, turn order, campaign refs, and match lifecycle
 * live in the core Match model (@models/MatchModel).
 */

import type { MatchDataBase } from '@models/MatchModel.js';
import type { BattleSize } from '@wh40k10e/models/ArmyModel.js';

// ============ GAME PHASE ============

/**
 * Phase within a player's turn in a 40K battle round.
 * Follows the 10th Edition turn sequence including pre-game and end-of-turn phases.
 */
export type GamePhase = 'Setup' | 'Deployment' | 'Command' | 'Movement' | 'Shooting' | 'Charge' | 'Fight' | 'End';

/**
 * Canonical ordering of in-turn phases within a player's turn.
 * Excludes pre-game phases (Setup, Deployment) which are not part of the turn cycle.
 * Used by the Match class to advance through the phase state machine.
 */
export const PHASE_ORDER: readonly GamePhase[] = ['Command', 'Movement', 'Shooting', 'Charge', 'Fight', 'End'];

// ============ MISSION CONFIG ============

/**
 * A secondary mission selected by a player.
 */
export interface SecondaryMission {
    /** Mission identifier from the mission pack. */
    id: string;
    /** Display name of the secondary mission. */
    name: string;
    /** Whether this secondary has been scored (completed its condition). */
    scored: boolean;
    /** VP earned from this secondary mission. */
    vpEarned: number;
}

/**
 * Per-player secondary mission configuration.
 */
export interface PlayerSecondaries {
    /** Whether the player chose fixed or tactical secondaries. */
    type: 'fixed' | 'tactical';
    /** Selected secondary missions (up to 2). */
    missions: SecondaryMission[];
}

/**
 * Mission configuration for a 40K match.
 *
 * Extends `Record<string, unknown>` so that future Chapter Approved mission
 * rules can be added as additional fields without a schema change.
 * All reference fields (missionId, deploymentTypeId, gambit values)
 * are IDs that the client resolves against local database records.
 */
export interface MissionConfig extends Record<string, unknown> {
    /** Battle size category (Incursion, StrikeForce, Onslaught). */
    battleSize: BattleSize;
    /** Points limit for the match (1000, 2000, or 3000). */
    pointsLimit: number;
    /** Mission ID referencing local mission data (e.g. from the mission pack). */
    missionId: string;
    /** Deployment type ID referencing local deployment data. */
    deploymentTypeId: string;
    /** Per-player gambit declarations, keyed by player ID. Values are gambit IDs from local data. */
    gambitByPlayerId: Record<string, string>;
    /** Per-player secondary mission configuration, keyed by player ID. */
    secondariesByPlayerId: Record<string, PlayerSecondaries>;
}

// ============ DEPLOYMENT STATE ============

/**
 * Tracks the alternating deployment sequence during the Deployment phase.
 */
export interface DeploymentState {
    /** Ordered list of player IDs for deployment alternation. */
    deploymentOrder: string[];
    /** Index into deploymentOrder of the player currently deploying. */
    activeDeployerIndex: number;
    /** Whether all players have finished deploying. */
    complete: boolean;
}

// ============ GAME STATE ============

/**
 * Current game state tracking round, phase, and deployment progress.
 */
export interface GameState {
    /** Current battle round (1–5). 0 during pre-game (Setup/Deployment). */
    round: number;
    /** Current phase of the active player's turn. */
    phase: GamePhase;
    /** Player ID of the currently active player within the game state. */
    activePlayerId: string | null;
    /** Deployment state, tracked during the Deployment phase. */
    deployment: DeploymentState;
    /** Whether the game has ended. */
    gameEnded: boolean;
}

// ============ UNIT PROJECTION ============

/**
 * Boolean flags tracking the transient state of a unit during gameplay.
 * These flags are reset at appropriate phase boundaries per the core rules.
 */
export interface UnitFlags {
    /** Unit is battle-shocked (failed Battle-shock test in Command phase). */
    battleShocked: boolean;
    /** Unit Advanced this turn (moved using Advance in Movement phase). */
    advanced: boolean;
    /** Unit Fell Back this turn (moved using Fall Back in Movement phase). */
    fellBack: boolean;
    /** Unit moved this turn (any movement in Movement phase). */
    moved: boolean;
    /** Unit is in Deep Strike reserves. */
    inDeepStrike: boolean;
    /** Unit is in Strategic Reserves. */
    inStrategicReserve: boolean;
    /** Unit is performing an action (e.g. a mission action). */
    performingAction: boolean;
    /** Unit has shot this turn (in Shooting phase). */
    hasShot: boolean;
    /** Unit has declared a charge this turn (in Charge phase). */
    hasCharged: boolean;
    /** Unit has fought this turn (in Fight phase). */
    hasFought: boolean;
    /** Unit is within Engagement Range of an enemy unit. */
    engaged: boolean;
}

/**
 * Match-time projection of a single unit within a player's army.
 * Keyed by ArmyUnit.id in the parent ArmyProjection.unitsByArmyUnitId map.
 */
export interface UnitProjection {
    /** Unit datasheet ID (references Unit.id from faction data). */
    unitId: string;
    /** Per-model wound tracking keyed by model name. A value of 0 means the model is destroyed. */
    modelWounds: Record<string, number>;
    /** Number of enemy models this unit has destroyed during the match. */
    kills: number;
    /** Current status flags for this unit. */
    flags: UnitFlags;
}

// ============ PLAYER STATE ============

/**
 * Army-level projection for a player in the match.
 * Contains faction/detachment identifiers and the per-unit projections.
 */
export interface ArmyProjection {
    /** Army entry ID referencing the player's saved army (Army.id from wh40k10e). */
    armyId: string;
    /** Faction ID from faction data (e.g. 'space-marines'). */
    factionId: string;
    /** Detachment ID from faction data, or null if no detachment selected. */
    detachmentId: string | null;
    /** Per-unit projections keyed by ArmyUnit.id. */
    unitsByArmyUnitId: Record<string, UnitProjection>;
}

/**
 * Per-player game-specific state within a 40K match.
 * Tracks command points and the player's army projection.
 */
export interface PlayerState {
    /** Whether this player is the attacker (determined by pre-game roll-off). */
    isAttacker: boolean;
    /** Current command points available to this player. */
    commandPoints: number;
    /** Player's secondary mission configuration. */
    secondaries: PlayerSecondaries;
    /** Projection of the player's army with per-unit state tracking. */
    armyProjection: ArmyProjection;
}

// ============ WH40K MATCH DATA ============

/**
 * Complete game-specific match data payload for Warhammer 40K 10th Edition.
 * Stored in the core Match's `matchData` JSONB field.
 */
export interface MatchData extends MatchDataBase<PlayerState> {
    /** Game system identifier. Always 'wh40k10e'. */
    systemId: 'wh40k10e';
    /** Schema version for this match data format. */
    schemaVersion: 1;
    /** Mission and game configuration. */
    config: MissionConfig;
    /** Current game state (round, phase, deployment). */
    gameState: GameState;
}

// ============ FACTORY HELPERS ============

/** Creates a default set of unit flags with all flags set to false. */
export function createDefaultUnitFlags(): UnitFlags {
    return {
        battleShocked: false,
        advanced: false,
        fellBack: false,
        moved: false,
        inDeepStrike: false,
        inStrategicReserve: false,
        performingAction: false,
        hasShot: false,
        hasCharged: false,
        hasFought: false,
        engaged: false,
    };
}

/** Creates a default deployment state for the given player order. */
export function createDefaultDeploymentState(deploymentOrder: string[]): DeploymentState {
    return {
        deploymentOrder,
        activeDeployerIndex: 0,
        complete: false,
    };
}

/** Creates a default game state in the Setup phase. */
export function createDefaultGameState(): GameState {
    return {
        round: 0,
        phase: 'Setup',
        activePlayerId: null,
        deployment: createDefaultDeploymentState([]),
        gameEnded: false,
    };
}
