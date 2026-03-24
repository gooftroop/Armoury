/**
 * Matches client types, error classes, and type guards.
 */

// Match model types

/** Base interface for system-specific match data. */
export interface MatchDataBase<TPlayerState extends object = Record<string, unknown>> {
    /** Identifier of the game system this match data belongs to. */
    systemId: string;
    /** Schema version number for the match data format. */
    schemaVersion: number;
    /** Per-player game state, keyed by player ID. */
    playerStateById: Record<string, TPlayerState>;
}

/** A player participating in a match. */
export interface MatchPlayer {
    /** Unique identifier of the player. */
    playerId: string;
    /** Identifier linking to a campaign participant, or null if not part of a campaign. */
    campaignParticipantId: string | null;
}

/** Turn tracking state for a match. */
export interface MatchTurn {
    /** Player ID of the currently active player, or null if no active player. */
    activePlayerId: string | null;
    /** Ordered list of player IDs defining the turn sequence. */
    turnOrder: string[];
    /** Current turn number (1-based). */
    turnNumber: number;
}

/** A single scoring event recorded during a match. */
export interface MatchScoreEvent {
    /** Player ID who earned the points. */
    playerId: string;
    /** Number of points earned. */
    points: number;
    /** Description of why the points were earned. */
    reason: string;
    /** ISO 8601 timestamp of when the score was recorded. */
    recordedAt: string;
}

/** Score tracking for a match. */
export interface MatchScore {
    /** Aggregate point totals keyed by player ID. */
    totalsByPlayerId: Record<string, number>;
    /** Chronological list of scoring events. */
    events: MatchScoreEvent[];
}

/** Possible states a match can be in. */
export type MatchStatus = 'setup' | 'deploying' | 'in_progress' | 'completed' | 'abandoned';

/** Possible outcomes for a player in a completed match. */
export type PlayerResult = 'win' | 'loss' | 'draw';

/** Outcome and results of a match. */
export interface MatchOutcome {
    /** Current status of the match. */
    status: MatchStatus;
    /** Per-player results keyed by player ID. */
    resultsByPlayerId: Record<string, PlayerResult>;
}

/** A match entity with all associated state. */
export interface Match<TMatchData extends MatchDataBase<object> | null = MatchDataBase | null> {
    /** Unique identifier of the match. */
    id: string;
    /** Identifier of the game system this match uses. */
    systemId: string;
    /** List of players participating in the match. */
    players: MatchPlayer[];
    /** Current turn tracking state. */
    turn: MatchTurn;
    /** Score tracking, or null if scoring is not enabled. */
    score: MatchScore | null;
    /** Match outcome and per-player results. */
    outcome: MatchOutcome;
    /** Campaign this match belongs to, or null if standalone. */
    campaignId: string | null;
    /** System-specific match data, or null if not set. */
    matchData?: TMatchData;
    /** Free-text notes about the match. */
    notes: string;
    /** ISO 8601 timestamp of when the match was played, or null if not set. */
    playedAt: string | null;
    /** ISO 8601 timestamp of when the match was created. */
    createdAt: string;
    /** ISO 8601 timestamp of when the match was last updated. */
    updatedAt: string;
}

// REST request types

/** Request body for creating a new match. */
export interface CreateMatchRequest {
    /** Identifier of the game system for the match. */
    systemId: string;
    /** List of players participating in the match. */
    players: MatchPlayer[];
    /** Optional turn order. If omitted, defaults to player order. */
    turnOrder?: string[];
    /** Optional campaign ID to associate this match with. */
    campaignId?: string | null;
    /** Optional system-specific match data. */
    matchData?: MatchDataBase | null;
    /** Optional notes about the match. */
    notes?: string;
    /** Optional ISO 8601 timestamp of when the match was played. */
    playedAt?: string | null;
}

/** Request body for updating an existing match. */
export interface UpdateMatchRequest {
    /** Updated list of players. */
    players?: MatchPlayer[];
    /** Updated turn tracking state. */
    turn?: MatchTurn;
    /** Updated score tracking. */
    score?: MatchScore | null;
    /** Updated match outcome. */
    outcome?: MatchOutcome;
    /** Updated campaign association. */
    campaignId?: string | null;
    /** Updated system-specific match data. */
    matchData?: MatchDataBase | null;
    /** Updated notes. */
    notes?: string;
    /** Updated played-at timestamp. */
    playedAt?: string | null;
}

// WebSocket field updates

/** Subset of match fields that can be updated via WebSocket. */
export interface UpdateMatchFields {
    /** Updated turn tracking state. */
    turn?: MatchTurn;
    /** Updated score tracking. */
    score?: MatchScore | null;
    /** Updated match outcome. */
    outcome?: MatchOutcome;
    /** Updated system-specific match data. */
    matchData?: MatchDataBase | null;
    /** Updated notes. */
    notes?: string;
}

// WebSocket client-to-server messages

/** Client message to subscribe to real-time updates for a match. */
export interface SubscribeMatchMessage {
    /** The action type identifier. */
    action: 'subscribeMatch';
    /** The match ID to subscribe to. */
    matchId: string;
}

/** Client message to unsubscribe from real-time updates for a match. */
export interface UnsubscribeMatchMessage {
    /** The action type identifier. */
    action: 'unsubscribeMatch';
    /** The match ID to unsubscribe from. */
    matchId: string;
}

/** Client message to send a match update via WebSocket. */
export interface UpdateMatchMessage {
    /** The action type identifier. */
    action: 'updateMatch';
    /** The match ID to update. */
    matchId: string;
    /** The fields to update on the match. */
    data: UpdateMatchFields;
}

/** Union of all client-to-server WebSocket message types. */
export type MatchesClientMessage = SubscribeMatchMessage | UnsubscribeMatchMessage | UpdateMatchMessage;

// WebSocket server-to-client messages

/** Server message containing the full match state after subscribing. */
export interface MatchStateMessage {
    /** The action type identifier. */
    action: 'matchState';
    /** The match ID this state belongs to. */
    matchId: string;
    /** The full match entity. */
    data: Match;
}

/** Server message broadcast when a match is updated by another client. */
export interface MatchUpdatedMessage {
    /** The action type identifier. */
    action: 'matchUpdated';
    /** The match ID that was updated. */
    matchId: string;
    /** The full updated match entity. */
    data: Match;
}

/** Union of all server-to-client WebSocket message types. */
export type MatchesServerMessage = MatchStateMessage | MatchUpdatedMessage;

// WebSocket client config

/** Configuration for the matches WebSocket client. */
export interface MatchesWsConfig {
    /** WebSocket URL for the matches real-time service (e.g., 'ws://localhost:3002'). */
    wsUrl: string;
    /** Function that returns an authentication token for WebSocket connections. */
    getToken: () => Promise<string> | string;
}

// Connection state

/** Possible states of the WebSocket connection. */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// === WebSocket Error Types ===

/**
 * Identifies which WebSocket lifecycle event produced the error.
 *
 * - `ws:error`                – The `error` event fired on the WebSocket instance.
 * - `ws:unexpected-response`  – The server responded with a non-101 HTTP status during handshake.
 * - `ws:message-parse`        – An incoming message could not be parsed as valid JSON.
 * - `ws:token-resolve`        – The `getToken` callback threw or rejected.
 * - `ws:send`                 – Sending a message failed (connection not open).
 */
export type WebSocketErrorSource =
    | 'ws:error'
    | 'ws:unexpected-response'
    | 'ws:message-parse'
    | 'ws:token-resolve'
    | 'ws:send';

/**
 * A structured error event emitted on the client's `errors$` observable.
 *
 * Every WebSocket error — regardless of which event produced it — is surfaced
 * through this uniform shape so consumers can log, report to Sentry, or display
 * UI without coupling to WebSocket internals.
 */
export interface WebSocketErrorEvent {
    /** The underlying error instance. */
    readonly error: Error;

    /** Which WebSocket lifecycle event produced this error. */
    readonly source: WebSocketErrorSource;

    /** ISO 8601 timestamp of when the error was captured. */
    readonly timestamp: string;

    /** Optional contextual data (e.g. HTTP status code from unexpected-response). */
    readonly context?: Readonly<Record<string, unknown>>;
}

// === Param Interfaces ===

/** Parameters for operations on a single match. */
export interface MatchParams {
    /** Unique identifier of the match. */
    matchId: string;
}

// Error classes

/**
 * Error thrown when a matches API call fails.
 * Includes HTTP status code for debugging.
 */
export class MatchesApiError extends Error {
    /** HTTP status code returned by the matches API. */
    readonly statusCode: number;

    /**
     * Creates a new MatchesApiError.
     * @param message - Human-readable error description
     * @param statusCode - HTTP status code from the failed request
     */
    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'MatchesApiError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, MatchesApiError.prototype);
    }
}

/**
 * Error thrown when a network operation fails.
 * Includes the underlying cause error for debugging.
 */
export class MatchesNetworkError extends Error {
    /** The underlying error that caused the network failure (if available). */
    override readonly cause: Error | undefined;

    /**
     * Creates a new MatchesNetworkError.
     * @param message - Human-readable error description
     * @param cause - Optional underlying error that caused the network failure
     */
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'MatchesNetworkError';
        this.cause = cause;
        Object.setPrototypeOf(this, MatchesNetworkError.prototype);
    }
}

// Type guards

/**
 * Type guard to narrow an unknown error to MatchesApiError.
 * @param error - The error to check
 * @returns True if error is a MatchesApiError instance
 */
export function isMatchesApiError(error: unknown): error is MatchesApiError {
    return error instanceof MatchesApiError;
}

/**
 * Type guard to narrow an unknown error to MatchesNetworkError.
 * @param error - The error to check
 * @returns True if error is a MatchesNetworkError instance
 */
export function isMatchesNetworkError(error: unknown): error is MatchesNetworkError {
    return error instanceof MatchesNetworkError;
}

// Realtime client interface

/**
 * Interface for the matches WebSocket real-time client.
 *
 * Defines the contract for bidirectional WebSocket communication with the
 * matches service for real-time match updates. Supports subscribing to
 * match state changes, sending updates, and receiving broadcasts.
 */
export interface IMatchesRealtimeClient {
    /**
     * Stream of all server-to-client messages.
     */
    readonly messages$: import('rxjs').Observable<MatchesServerMessage>;

    /**
     * Stream of the current WebSocket connection state.
     */
    readonly connectionState$: import('rxjs').Observable<ConnectionState>;

    /**
     * Observable stream of structured error events from the WebSocket lifecycle.
     *
     * Every error — connection failures, handshake rejections, message parse
     * failures, token resolution errors, and send failures — is emitted here
     * with a `source` field identifying the originating event. Consumers can
     * subscribe once and route all errors to Sentry or a logging backend.
     */
    readonly errors$: import('rxjs').Observable<WebSocketErrorEvent>;

    /**
     * Establishes the WebSocket connection with authentication.
     */
    connect(): void;

    /**
     * Cleanly closes the WebSocket connection.
     */
    disconnect(): void;

    /**
     * Subscribes to real-time updates for a specific match.
     *
     * @param matchId - The match ID to subscribe to
     */
    subscribeMatch(matchId: string): void;

    /**
     * Unsubscribes from real-time updates for a specific match.
     *
     * @param matchId - The match ID to unsubscribe from
     */
    unsubscribeMatch(matchId: string): void;

    /**
     * Sends a match update to the server via WebSocket.
     *
     * @param matchId - The match ID to update
     * @param data - The fields to update
     */
    sendMatchUpdate(matchId: string, data: UpdateMatchFields): void;

    /**
     * Filtered observable for a specific match's state messages.
     *
     * @param matchId - The match ID to filter for
     * @returns Observable emitting only MatchStateMessage for the given match
     */
    matchState$(matchId: string): import('rxjs').Observable<MatchStateMessage>;

    /**
     * Filtered observable for a specific match's update messages.
     *
     * @param matchId - The match ID to filter for
     * @returns Observable emitting only MatchUpdatedMessage for the given match
     */
    matchUpdated$(matchId: string): import('rxjs').Observable<MatchUpdatedMessage>;

    /**
     * Completes all subjects, closes connection, and cleans up resources.
     */
    dispose(): void;
}
