/** Campaign lifecycle status. */
export type CampaignStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

// ============ NARRATIVE ============

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

// ============ CAMPAIGN DATA ============

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

// ============ PHASE ============

/**
 * Campaign phase definition.
 *
 * @template TNarrative - Narrative payload type for the phase. Defaults to {@link CustomNarrative}.
 */
export interface CampaignPhase<TNarrative extends NarrativeBase = CustomNarrative> {
    /** Unique phase identifier. */
    id: string;

    /** Phase display name. */
    name: string;

    /** Phase ordering. */
    order: number;

    /** Points limit for the phase, or null for unlimited. */
    pointsLimit?: number | null;

    /** Matches required for the phase. */
    matchesRequired?: number;

    /** Organizer notes. */
    notes?: string;

    /** Narrative payload for the phase. */
    narrative?: TNarrative;

    /** Custom rules for the phase. */
    customRules?: string[];

    /** Phase start date. ISO 8601 or null. */
    startDate: string | null;

    /** Phase end date. ISO 8601 or null. */
    endDate: string | null;
}

// ============ RANKING ============

/** Campaign ranking entry for a participant. */
export interface CampaignRanking {
    /** Participant campaign identifier. */
    participantId: string;

    /** Participant user identifier. */
    userId: string;

    /** Participant display name. */
    displayName: string;

    /** Rank order. */
    rank: number;

    /** Wins count. */
    wins: number;

    /** Losses count. */
    losses: number;

    /** Draws count. */
    draws: number;

    /** Total victory points. */
    totalVP: number;
}

// ============ CAMPAIGN ============

/**
 * Core campaign entity.
 *
 * Follows the same generic-JSON pattern as {@link Match}: system-agnostic metadata
 * lives on the campaign record, while the narrative and game-system-specific data
 * are stored as typed JSONB fields.
 *
 * @template TCampaignData - Game-system-specific campaign data payload.
 *                            Defaults to `CampaignDataBase | null` for untyped/generic usage.
 * @template TNarrative - Narrative payload type. Defaults to {@link CustomNarrative}.
 */
export interface Campaign<
    TCampaignData extends CampaignDataBase | null = CampaignDataBase | null,
    TNarrative extends NarrativeBase = CustomNarrative,
> {
    /** Unique campaign identifier. */
    id: string;

    /** Campaign display name. */
    name: string;

    /** Campaign type discriminator (e.g. 'custom', 'crusade'). */
    type: string;

    /** Organizer user identifier. */
    organizerId: string;

    /** Campaign narrative payload. Stored as JSONB. */
    narrative: TNarrative;

    /** Game-system-specific campaign data payload. Stored as JSONB. */
    campaignData?: TCampaignData;

    /** Campaign start date. ISO 8601. */
    startDate: string;

    /** Campaign end date, or null if ongoing. ISO 8601. */
    endDate: string | null;

    /** Campaign lifecycle status. */
    status: CampaignStatus;

    /** Campaign phases. */
    phases: CampaignPhase<TNarrative>[];

    /** Custom rules list. */
    customRules: string[];

    /** Campaign rankings. */
    rankings: CampaignRanking[];

    /** Participant identifiers list. */
    participantIds: string[];

    /** Match identifiers list. */
    matchIds: string[];

    /** Timestamp when the campaign was created. ISO 8601. */
    createdAt: string;

    /** Timestamp when the campaign was last updated. ISO 8601. */
    updatedAt: string;
}

/**
 * Campaign participant record.
 *
 * @template TParticipantData - Game-system-specific participant data payload.
 *                               Defaults to `Record<string, unknown> | null` for untyped/generic usage.
 */
export interface CampaignParticipant<
    TParticipantData extends Record<string, unknown> | null = Record<string, unknown> | null,
> {
    /** Unique participant identifier. */
    id: string;

    /** Parent campaign identifier. */
    campaignId: string;

    /** Participant user identifier. */
    userId: string;

    /** Participant display name. */
    displayName: string;

    /** Whether the participant is the organizer. */
    isOrganizer: boolean;

    /** Army identifier used in the campaign. */
    armyId: string;

    /** Army name for display. */
    armyName: string;

    /** Current phase identifier. */
    currentPhaseId: string;

    /** Matches completed in current phase. */
    matchesInCurrentPhase: number;

    /** Game-system-specific participant progression data, or null. */
    participantData?: TParticipantData;

    /** Match identifiers list. */
    matchIds: string[];

    /** Joined timestamp. ISO 8601. */
    joinedAt: string;

    /** Updated timestamp. ISO 8601. */
    updatedAt: string;
}
