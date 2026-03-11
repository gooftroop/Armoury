/**
 * Core match data model — game-system-agnostic.
 *
 * A match represents a game between N players tracked on a single record.
 * The core entity stores system-agnostic metadata (players, scoring, turn order,
 * outcome, campaign reference), while game-system-specific data (e.g., round state,
 * army projections, mission config) lives in the typed `matchData` JSONB field.
 *
 * Table: matches
 * | Column      | Type | Constraints |
 * |-------------|------|-------------|
 * | id          | TEXT | PRIMARY KEY |
 * | system_id   | TEXT | NOT NULL    |
 * | players     | JSONB| NOT NULL    |
 * | turn        | JSONB| NOT NULL    |
 * | score       | JSONB|             |
 * | outcome     | JSONB| NOT NULL    |
 * | campaign_id | TEXT |             |
 * | match_data  | JSONB|             |
 * | notes       | TEXT | NOT NULL    |
 * | played_at   | TEXT |             |
 * | created_at  | TEXT | NOT NULL    |
 * | updated_at  | TEXT | NOT NULL    |
 */

// ============ MATCH DATA BASE ============

/**
 * Base constraint for game-system-specific match data.
 * Every system's match data payload must extend this interface.
 */
export interface MatchDataBase<TPlayerState extends object = Record<string, unknown>> {
    /** Game system identifier (e.g. 'wh40k10e'). Must match the parent Match's systemId. */
    systemId: string;
    /** Schema version for forward/backward compatibility of the match data payload. */
    schemaVersion: number;
    /** Per-player game state, keyed by player ID. */
    playerStateById: Record<string, TPlayerState>;
}

// ============ MATCH PLAYER ============

/**
 * A participant in a match. Carries the player's identity
 * and optional campaign linkage.
 */
export interface MatchPlayer {
    /** User ID of the player. */
    playerId: string;
    /** Campaign participant ID if the match is part of a campaign, or null otherwise. */
    campaignParticipantId: string | null;
}

// ============ TURN ============

/**
 * Tracks whose turn it is and the overall turn order within the match.
 * The turn number is a global counter (not per-player).
 */
export interface MatchTurn {
    /** Player ID of the currently active player, or null if no turn is active (e.g. pre-game). */
    activePlayerId: string | null;
    /**
     * Ordered list of player IDs defining the turn sequence.
     * For 40K this is typically [attacker, defender], determined by pre-game roll-off.
     */
    turnOrder: string[];
    /** Global turn number. Starts at 0 (pre-game) and increments each time a player begins a new turn. */
    turnNumber: number;
}

// ============ SCORING ============

/**
 * An individual scoring event recording when and why points were awarded.
 * Provides an audit trail for all VP changes.
 */
export interface MatchScoreEvent {
    /** Player ID who earned (or lost) points. */
    playerId: string;
    /** Number of victory points awarded (can be negative for corrections). */
    points: number;
    /** Reason label for the score change (e.g. 'primary', 'secondary:assassinate', 'gambit'). */
    reason: string;
    /** ISO 8601 timestamp when the event was recorded. */
    recordedAt: string;
}

/**
 * Aggregated scoring for all players plus a full event audit trail.
 */
export interface MatchScore {
    /** Total VP per player, keyed by player ID. */
    totalsByPlayerId: Record<string, number>;
    /** Ordered list of all scoring events. */
    events: MatchScoreEvent[];
}

// ============ OUTCOME ============

/**
 * Lifecycle status of a match.
 * - setup: Pre-game configuration (army selection, mission selection).
 * - deploying: Players are deploying units to the battlefield.
 * - in_progress: Active gameplay.
 * - completed: Match finished normally.
 * - abandoned: Match was abandoned before completion.
 */
export type MatchStatus = 'setup' | 'deploying' | 'in_progress' | 'completed' | 'abandoned';

/**
 * Result of a match from an individual player's perspective.
 * - win: The player won the match.
 * - loss: The player lost the match.
 * - draw: The match ended in a draw.
 */
export type PlayerResult = 'win' | 'loss' | 'draw';

/**
 * Match outcome tracking status and per-player results.
 */
export interface MatchOutcome {
    /** Current lifecycle status of the match. */
    status: MatchStatus;
    /** Per-player result, keyed by player ID. Populated when the match is completed. */
    resultsByPlayerId: Record<string, PlayerResult>;
}

// ============ MATCH ============

/**
 * Core match entity representing a game between N players.
 * System-agnostic — game-specific data is stored in the typed `matchData` field.
 *
 * @template TMatchData - Game-system-specific match data payload.
 *                         Defaults to `MatchDataBase | null` for untyped/generic usage.
 */
export interface Match<TMatchData extends MatchDataBase<object> | null = MatchDataBase | null> {
    /** Unique match identifier. */
    id: string;

    /** Game system identifier (e.g. 'wh40k10e'). */
    systemId: string;

    /** Participating players with their army refs and campaign linkage. */
    players: MatchPlayer[];

    /** Turn tracking: active player, turn order, turn number. */
    turn: MatchTurn;

    /** Scoring state with VP totals and event audit trail. Null before scoring begins. */
    score: MatchScore | null;

    /** Match lifecycle status and per-player results. */
    outcome: MatchOutcome;

    /** Campaign ID if this match is part of a campaign, or null otherwise. */
    campaignId: string | null;

    /** Game-system-specific match data payload (e.g. 40K round/phase, army projections). */
    matchData?: TMatchData;

    /** Player notes about the match. */
    notes: string;

    /** Timestamp when the match was played. ISO 8601. Null if not yet played. */
    playedAt: string | null;

    /** Timestamp when the match record was created. ISO 8601. */
    createdAt: string;

    /** Timestamp when the match record was last updated. ISO 8601. */
    updatedAt: string;
}
