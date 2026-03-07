/**
 * Campaigns client types, request/response shapes, and error classes.
 *
 * These are client-side types mirrored from the campaigns service.
 * They represent the shapes the client receives from and sends to the REST API.
 */

// === Narrative Types ===

/**
 * Base constraint for campaign narrative data.
 * Every narrative payload must extend this interface.
 */
export interface NarrativeBase {
    /** Schema version for forward/backward compatibility of the narrative payload. */
    schemaVersion: number;
    /** Allow additional narrative-specific properties. */
    [key: string]: unknown;
}

/**
 * Default campaign narrative for custom (non-system-specific) campaigns.
 */
export interface CustomNarrative extends NarrativeBase {
    /** Narrative text content. */
    narrative: string;
}

// === Campaign Data Types ===

/**
 * Base constraint for game-system-specific campaign data.
 * Every system's campaign data payload must extend this interface.
 */
export interface CampaignDataBase {
    /** Game system identifier (e.g. 'wh40k10e'). Must match the parent Campaign's type. */
    systemId: string;
    /** Schema version for forward/backward compatibility of the campaign data payload. */
    schemaVersion: number;
}

// === Campaign Types ===

/** Status of a campaign lifecycle. */
export type CampaignStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/**
 * A phase within a campaign defining progression rules and schedule.
 *
 * @template TNarrative - Narrative payload type for the phase. Defaults to {@link CustomNarrative}.
 */
export interface CampaignPhase<TNarrative extends NarrativeBase = CustomNarrative> {
    /** Unique identifier for this phase. */
    id: string;

    /** Display name of the phase. */
    name: string;

    /** Ordering position of this phase within the campaign. */
    order: number;

    /** Maximum points allowed in this phase, or null for unlimited. */
    pointsLimit?: number | null;

    /** Number of matches required to complete this phase. */
    matchesRequired?: number;

    /** Organizer notes for the phase. */
    notes?: string;

    /** Narrative payload for the phase. */
    narrative?: TNarrative;

    /** Custom rules specific to this phase. */
    customRules?: string[];

    /** Start date of the phase in ISO 8601 format, or null if not scheduled. */
    startDate: string | null;

    /** End date of the phase in ISO 8601 format, or null if open-ended. */
    endDate: string | null;
}

/** A participant's ranking within a campaign leaderboard. */
export interface CampaignRanking {
    /** The participant's unique identifier. */
    participantId: string;

    /** The participant's user identifier. */
    userId: string;

    /** The participant's display name. */
    displayName: string;

    /** Current rank position (1-based). */
    rank: number;

    /** Total number of wins. */
    wins: number;

    /** Total number of losses. */
    losses: number;

    /** Total number of draws. */
    draws: number;

    /** Total victory points accumulated. */
    totalVP: number;
}

/**
 * A campaign entity as returned by the campaigns REST API.
 *
 * Follows the same generic-JSON pattern as Match: system-agnostic metadata
 * lives on the campaign record, while the narrative and game-system-specific data
 * are stored as typed JSON fields.
 *
 * @template TCampaignData - Game-system-specific campaign data payload.
 *                            Defaults to `CampaignDataBase | null` for untyped/generic usage.
 * @template TNarrative - Narrative payload type. Defaults to {@link CustomNarrative}.
 */
export interface Campaign<
    TCampaignData extends CampaignDataBase | null = CampaignDataBase | null,
    TNarrative extends NarrativeBase = CustomNarrative,
> {
    /** Unique identifier for the campaign. */
    id: string;

    /** Display name of the campaign. */
    name: string;

    /** Campaign type discriminator (e.g. 'custom', 'crusade'). */
    type: string;

    /** User ID of the campaign organizer. */
    organizerId: string;

    /** Campaign narrative payload. Stored as JSON. */
    narrative: TNarrative;

    /** Game-system-specific campaign data payload. Stored as JSON. */
    campaignData?: TCampaignData;

    /** Start date of the campaign in ISO 8601 format. */
    startDate: string;

    /** End date of the campaign in ISO 8601 format, or null if open-ended. */
    endDate: string | null;

    /** Current lifecycle status of the campaign. */
    status: CampaignStatus;

    /** Ordered list of campaign phases. */
    phases: CampaignPhase<TNarrative>[];

    /** Custom rules applied to the entire campaign. */
    customRules: string[];

    /** Current participant rankings. */
    rankings: CampaignRanking[];

    /** IDs of participants in this campaign. */
    participantIds: string[];

    /** IDs of matches played in this campaign. */
    matchIds: string[];

    /** When this campaign was created. ISO 8601. */
    createdAt: string;

    /** When this campaign was last updated. ISO 8601. */
    updatedAt: string;
}

/** 
 * A participant in a campaign with their army and progression data.
 *
 * @template TParticipantData - Game-system-specific participant data payload.
 *                               Defaults to `Record<string, unknown> | null` for untyped/generic usage.
 */
export interface CampaignParticipant<
    TParticipantData extends Record<string, unknown> | null = Record<string, unknown> | null,
> {
    /** Unique identifier for the participant record. */
    id: string;

    /** The campaign this participant belongs to. */
    campaignId: string;

    /** The participant's user account ID. */
    userId: string;

    /** The participant's display name. */
    displayName: string;

    /** Whether this participant is the campaign organizer. */
    isOrganizer: boolean;

    /** The ID of the army the participant is using. */
    armyId: string;

    /** The display name of the participant's army. */
    armyName: string;

    /** The ID of the phase the participant is currently in. */
    currentPhaseId: string;

    /** Number of matches played in the current phase. */
    matchesInCurrentPhase: number;

    /** Game-system-specific participant progression data, or null. */
    participantData?: TParticipantData;

    /** IDs of matches this participant has played. */
    matchIds: string[];

    /** When the participant joined the campaign. ISO 8601. */
    joinedAt: string;

    /** When the participant record was last updated. ISO 8601. */
    updatedAt: string;
}

// === Request Types ===

/** Request body for creating a new campaign. */
export interface CreateCampaignRequest {
    /** Display name of the campaign. */
    name: string;

    /** Campaign type discriminator (e.g. 'custom', 'crusade'). */
    type: string;

    /** Narrative information for the campaign. */
    narrative: NarrativeBase;

    /** Start date of the campaign in ISO 8601 format. */
    startDate: string;

    /** End date of the campaign in ISO 8601 format, or null if open-ended. */
    endDate: string | null;

    /** Initial lifecycle status of the campaign. */
    status: CampaignStatus;

    /** Optional custom rules applied to the entire campaign. */
    customRules?: string[];

    /** Optional campaign data payload. */
    campaignData?: Record<string, unknown> | null;
}

/** Request body for updating an existing campaign. */
export interface UpdateCampaignRequest {
    /** Display name of the campaign. */
    name: string;

    /** Campaign type discriminator (e.g. 'custom', 'crusade'). */
    type: string;

    /** Narrative information for the campaign. */
    narrative: NarrativeBase;

    /** Start date of the campaign in ISO 8601 format. */
    startDate: string;

    /** End date of the campaign in ISO 8601 format, or null if open-ended. */
    endDate: string | null;

    /** Current lifecycle status of the campaign. */
    status: CampaignStatus;

    /** Optional updated list of campaign phases. */
    phases?: CampaignPhase[];

    /** Optional updated custom rules. */
    customRules?: string[];

    /** Optional updated participant rankings. */
    rankings?: CampaignRanking[];

    /** Optional updated list of participant IDs. */
    participantIds?: string[];

    /** Optional updated list of match IDs. */
    matchIds?: string[];

    /** Optional campaign data payload. */
    campaignData?: Record<string, unknown> | null;
}

/** Request body for joining a campaign as a participant. */
export interface JoinCampaignRequest {
    /** Display name to use in the campaign. */
    displayName: string;

    /** ID of the army to use in the campaign. */
    armyId: string;

    /** Display name of the army. */
    armyName: string;

    /** ID of the phase to start in. */
    currentPhaseId: string;

    /** Optional initial number of matches in the current phase. */
    matchesInCurrentPhase?: number;

    /** Optional participant data payload. */
    participantData?: Record<string, unknown> | null;

    /** Optional initial list of match IDs. */
    matchIds?: string[];
}

/** Request body for updating a participant's campaign data. */
export interface UpdateParticipantRequest {
    /** Updated display name. */
    displayName: string;

    /** Updated army ID. */
    armyId: string;

    /** Updated army display name. */
    armyName: string;

    /** Updated current phase ID. */
    currentPhaseId: string;

    /** Updated match count in the current phase. */
    matchesInCurrentPhase: number;

    /** Optional updated participant data payload. */
    participantData?: Record<string, unknown> | null;

    /** Optional updated list of match IDs. */
    matchIds?: string[];
}

// === Param Interfaces ===

/** Parameters for operations on a single campaign. */
export interface CampaignParams {
    /** Unique identifier of the campaign. */
    campaignId: string;
}

/** Parameters for operations on a single participant within a campaign. */
export interface ParticipantParams {
    /** Unique identifier of the campaign. */
    campaignId: string;
    /** Unique identifier of the participant. */
    participantId: string;
}


// === Error Classes ===

/**
 * Error thrown when a campaigns API call returns an HTTP error response.
 * Includes the HTTP status code for programmatic error handling.
 */
export class CampaignsApiError extends Error {
    /** HTTP status code returned by the campaigns API (e.g., 400, 404, 500). */
    readonly statusCode: number;

    /**
     * Creates a new CampaignsApiError.
     *
     * @param message - Human-readable error description
     * @param statusCode - HTTP status code from the failed request
     */
    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'CampaignsApiError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, CampaignsApiError.prototype);
    }
}

/**
 * Error thrown when a network failure occurs while communicating with the campaigns API.
 * Includes the underlying cause error for debugging connection issues.
 */
export class CampaignsNetworkError extends Error {
    /** The underlying error that caused the network failure (if available). */
    override readonly cause: Error | undefined;

    /**
     * Creates a new CampaignsNetworkError.
     *
     * @param message - Human-readable error description
     * @param cause - Optional underlying error that caused the network failure
     */
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'CampaignsNetworkError';
        this.cause = cause;
        Object.setPrototypeOf(this, CampaignsNetworkError.prototype);
    }
}

// === Type Guards ===

/**
 * Type guard to narrow an unknown error to CampaignsApiError.
 *
 * @param error - The error to check
 * @returns True if error is a CampaignsApiError instance
 */
export function isCampaignsApiError(error: unknown): error is CampaignsApiError {
    return error instanceof CampaignsApiError;
}

/**
 * Type guard to narrow an unknown error to CampaignsNetworkError.
 *
 * @param error - The error to check
 * @returns True if error is a CampaignsNetworkError instance
 */
export function isCampaignsNetworkError(error: unknown): error is CampaignsNetworkError {
    return error instanceof CampaignsNetworkError;
}

