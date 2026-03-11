import type { CampaignStatus } from '@armoury/models/CampaignModel';

import type {
    CreateCampaignRequest,
    JoinCampaignRequest,
    UpdateCampaignRequest,
    UpdateParticipantRequest,
} from '@/types.js';

/** Valid campaign status values. */
const VALID_CAMPAIGN_STATUSES: ReadonlySet<string> = new Set<CampaignStatus>([
    'upcoming',
    'active',
    'completed',
    'cancelled',
]);

/**
 * Type guard for records.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for strings.
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

/**
 * Type guard for string arrays.
 */
export function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Type guard for numbers.
 */
export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Type guard for campaign narratives.
 */
export function isNarrative(value: unknown): value is CreateCampaignRequest['narrative'] {
    if (!isRecord(value)) {
        return false;
    }

    return isNumber(value['schemaVersion']);
}

/**
 * Validates a create campaign request payload.
 */
export function parseCreateCampaignRequest(body: unknown | null): CreateCampaignRequest | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const name = body['name'];
    const type = body['type'];
    const narrative = body['narrative'];
    const startDate = body['startDate'];
    const endDate = body['endDate'];
    const status = body['status'];
    const customRules = body['customRules'];
    const campaignData = body['campaignData'];

    if (!isString(name) || !isString(type) || !isString(startDate) || !isString(status)) {
        return new Error('Missing required fields for campaign creation');
    }

    if (!VALID_CAMPAIGN_STATUSES.has(status)) {
        return new Error('Invalid campaign status');
    }

    if (!isNarrative(narrative)) {
        return new Error('Invalid campaign narrative');
    }

    if (endDate !== null && endDate !== undefined && !isString(endDate)) {
        return new Error('Invalid endDate value');
    }

    if (customRules !== undefined && !isStringArray(customRules)) {
        return new Error('Invalid customRules value');
    }

    if (campaignData !== undefined && campaignData !== null && !isRecord(campaignData)) {
        return new Error('Invalid campaignData value');
    }

    return {
        name,
        type,
        narrative,
        startDate,
        endDate: endDate ?? null,
        status: status as CampaignStatus,
        customRules: customRules ?? undefined,
        campaignData: campaignData ?? undefined,
    };
}

/**
 * Validates an update campaign request payload.
 */
export function parseUpdateCampaignRequest(body: unknown | null): UpdateCampaignRequest | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const name = body['name'];
    const type = body['type'];
    const narrative = body['narrative'];
    const startDate = body['startDate'];
    const endDate = body['endDate'];
    const status = body['status'];
    const phases = body['phases'];
    const customRules = body['customRules'];
    const rankings = body['rankings'];
    const participantIds = body['participantIds'];
    const matchIds = body['matchIds'];
    const campaignData = body['campaignData'];

    if (!isString(name) || !isString(type) || !isString(startDate) || !isString(status)) {
        return new Error('Missing required fields for campaign update');
    }

    if (!VALID_CAMPAIGN_STATUSES.has(status)) {
        return new Error('Invalid campaign status');
    }

    if (!isNarrative(narrative)) {
        return new Error('Invalid campaign narrative');
    }

    if (endDate !== null && endDate !== undefined && !isString(endDate)) {
        return new Error('Invalid endDate value');
    }

    if (phases !== undefined && !Array.isArray(phases)) {
        return new Error('Invalid phases value');
    }

    if (customRules !== undefined && !isStringArray(customRules)) {
        return new Error('Invalid customRules value');
    }

    if (rankings !== undefined && !Array.isArray(rankings)) {
        return new Error('Invalid rankings value');
    }

    if (participantIds !== undefined && !isStringArray(participantIds)) {
        return new Error('Invalid participantIds value');
    }

    if (matchIds !== undefined && !isStringArray(matchIds)) {
        return new Error('Invalid matchIds value');
    }

    if (campaignData !== undefined && campaignData !== null && !isRecord(campaignData)) {
        return new Error('Invalid campaignData value');
    }

    return {
        name,
        type,
        narrative,
        startDate,
        endDate: endDate ?? null,
        status: status as CampaignStatus,
        phases: phases ?? undefined,
        customRules: customRules ?? undefined,
        rankings: rankings ?? undefined,
        participantIds: participantIds ?? undefined,
        matchIds: matchIds ?? undefined,
        campaignData: campaignData ?? undefined,
    };
}

/**
 * Validates a join campaign request payload.
 */
export function parseJoinCampaignRequest(body: unknown | null): JoinCampaignRequest | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const displayName = body['displayName'];
    const armyId = body['armyId'];
    const armyName = body['armyName'];
    const currentPhaseId = body['currentPhaseId'];
    const matchesInCurrentPhase = body['matchesInCurrentPhase'];
    const participantData = body['participantData'];
    const matchIds = body['matchIds'];

    if (!isString(displayName) || !isString(armyId) || !isString(armyName) || !isString(currentPhaseId)) {
        return new Error('Missing required fields for participant creation');
    }

    if (matchesInCurrentPhase !== undefined && !isNumber(matchesInCurrentPhase)) {
        return new Error('Invalid matchesInCurrentPhase value');
    }

    if (matchIds !== undefined && !isStringArray(matchIds)) {
        return new Error('Invalid matchIds value');
    }

    if (participantData !== undefined && participantData !== null && !isRecord(participantData)) {
        return new Error('Invalid participantData value');
    }

    return {
        displayName,
        armyId,
        armyName,
        currentPhaseId,
        matchesInCurrentPhase: matchesInCurrentPhase ?? undefined,
        participantData: participantData ?? undefined,
        matchIds: matchIds ?? undefined,
    } as JoinCampaignRequest;
}

/**
 * Validates an update participant request payload.
 */
export function parseUpdateParticipantRequest(body: unknown | null): UpdateParticipantRequest | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const displayName = body['displayName'];
    const armyId = body['armyId'];
    const armyName = body['armyName'];
    const currentPhaseId = body['currentPhaseId'];
    const matchesInCurrentPhase = body['matchesInCurrentPhase'];
    const participantData = body['participantData'];
    const matchIds = body['matchIds'];

    if (!isString(displayName) || !isString(armyId) || !isString(armyName) || !isString(currentPhaseId)) {
        return new Error('Missing required fields for participant update');
    }

    if (!isNumber(matchesInCurrentPhase)) {
        return new Error('matchesInCurrentPhase must be a number');
    }

    if (matchIds !== undefined && !isStringArray(matchIds)) {
        return new Error('Invalid matchIds value');
    }

    if (participantData !== undefined && participantData !== null && !isRecord(participantData)) {
        return new Error('Invalid participantData value');
    }

    return {
        displayName,
        armyId,
        armyName,
        currentPhaseId,
        matchesInCurrentPhase,
        participantData: participantData ?? undefined,
        matchIds: matchIds ?? undefined,
    } as UpdateParticipantRequest;
}
