import type { DatabaseAdapter } from '@armoury/data-dao';
import type { CampaignPhase, CampaignRanking, CampaignStatus, NarrativeBase } from '@armoury/models';

/**
 * Authenticated user context extracted from API Gateway authorizer.
 */
export interface UserContext {
    /** User subject identifier from the identity provider. */
    sub: string;

    /** User email address from the identity provider. */
    email: string;

    /** User display name from the identity provider. */
    name: string;
}

/**
 * Route path parameters extracted from API Gateway.
 */
export interface PathParameters {
    id?: string;

    /** Participant campaign identifier parameter. */
    pid?: string;
}

/**
 * API Gateway proxy response type alias.
 */
export interface ApiResponse {
    /** HTTP status code for the response. */
    statusCode: number;

    /** Optional HTTP response headers. */
    headers?: Record<string, string>;

    /** Stringified response body payload. */
    body: string;
}

/**
 * Route handler signature for campaigns service endpoints.
 */
export type RouteHandler = (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
) => Promise<ApiResponse>;

/**
 * Request body for creating a master campaign.
 */
export interface CreateCampaignRequest {
    /** Campaign name. */
    name: string;

    /** Campaign type discriminator (e.g. 'custom', 'crusade'). */
    type: string;

    /** Campaign narrative configuration. */
    narrative: NarrativeBase;

    /** Campaign start date as ISO string. */
    startDate: string;

    /** Campaign end date as ISO string or null. */
    endDate: string | null;

    /** Campaign status. */
    status: CampaignStatus;

    /** Optional custom rules list. */
    customRules?: string[];

    /** Optional campaign data payload. */
    campaignData?: Record<string, unknown> | null;
}

/**
 * Request body for updating a master campaign.
 */
export interface UpdateCampaignRequest {
    /** Campaign name. */
    name: string;

    /** Campaign type discriminator (e.g. 'custom', 'crusade'). */
    type: string;

    /** Campaign narrative configuration. */
    narrative: NarrativeBase;

    /** Campaign start date as ISO string. */
    startDate: string;

    /** Campaign end date as ISO string or null. */
    endDate: string | null;

    /** Campaign status. */
    status: CampaignStatus;

    /** Optional campaign phases. */
    phases?: CampaignPhase[];

    /** Optional custom rules list. */
    customRules?: string[];

    /** Optional campaign rankings. */
    rankings?: CampaignRanking[];

    /** Optional participant identifiers list. */
    participantIds?: string[];

    /** Optional match identifiers list. */
    matchIds?: string[];

    /** Optional campaign data payload. */
    campaignData?: Record<string, unknown> | null;
}

/**
 * Request body for joining a campaign as a participant.
 */
export interface JoinCampaignRequest {
    /** Participant display name. */
    displayName: string;

    /** Army identifier associated with the participant. */
    armyId: string;

    /** Army name for display. */
    armyName: string;

    /** Current campaign phase identifier. */
    currentPhaseId: string;

    /** Optional match count in the current phase. */
    matchesInCurrentPhase?: number;

    /** Optional participant data payload. */
    participantData?: Record<string, unknown> | null;

    /** Optional match identifiers list. */
    matchIds?: string[];
}

/**
 * Request body for updating a participant campaign.
 */
export interface UpdateParticipantRequest {
    /** Participant display name. */
    displayName: string;

    /** Army identifier associated with the participant. */
    armyId: string;

    /** Army name for display. */
    armyName: string;

    /** Current campaign phase identifier. */
    currentPhaseId: string;

    /** Match count in the current phase. */
    matchesInCurrentPhase: number;

    /** Optional participant data payload. */
    participantData?: Record<string, unknown> | null;

    /** Optional match identifiers list. */
    matchIds?: string[];
}
