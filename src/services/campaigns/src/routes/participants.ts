import { randomUUID } from 'crypto';

import type { DatabaseAdapter } from '@armoury/data-dao/types';
import type { Campaign, CampaignParticipant } from '@armoury/models/CampaignModel';
import type { ApiResponse, PathParameters, RouteHandler, UserContext } from '@/types.js';
import { errorResponse, jsonResponse } from '@/utils/response.js';
import { parseJoinCampaignRequest, parseUpdateParticipantRequest } from '@/utils/validation.js';

/**
 * Adds a participant to a campaign.
 */
export const joinCampaign: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const campaignId = pathParameters?.id;

    if (!campaignId) {
        return errorResponse(400, 'ValidationError', 'Missing campaign id');
    }

    const request = parseJoinCampaignRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const campaign = await adapter.get('campaign', campaignId);

    if (!campaign) {
        return errorResponse(404, 'NotFound', 'Campaign not found');
    }

    const now = new Date().toISOString();
    const participant: CampaignParticipant = {
        id: randomUUID(),
        campaignId,
        userId: userContext.sub,
        displayName: request.displayName,
        isOrganizer: false,
        armyId: request.armyId,
        armyName: request.armyName,
        currentPhaseId: request.currentPhaseId,
        matchesInCurrentPhase: request.matchesInCurrentPhase ?? 0,
        participantData: request.participantData ?? null,
        matchIds: request.matchIds ?? [],
        joinedAt: now,
        updatedAt: now,
    };

    await adapter.transaction(async () => {
        await adapter.put('campaignParticipant', participant);

        const updatedCampaign: Campaign = {
            ...campaign,
            participantIds: [...campaign.participantIds, participant.id],
            updatedAt: now,
        };

        await adapter.put('campaign', updatedCampaign);
    });

    return jsonResponse(201, participant);
};

/**
 * Lists participants for a campaign.
 */
export const listParticipants: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const campaignId = pathParameters?.id;

    if (!campaignId) {
        return errorResponse(400, 'ValidationError', 'Missing campaign id');
    }

    const participants = await adapter.getByField('campaignParticipant', 'campaignId', campaignId);

    return jsonResponse(200, participants);
};

/**
 * Retrieves a participant by ID.
 */
export const getParticipant: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const participantId = pathParameters?.pid;

    if (!participantId) {
        return errorResponse(400, 'ValidationError', 'Missing participant id');
    }

    const participant = await adapter.get('campaignParticipant', participantId);

    if (!participant) {
        return errorResponse(404, 'NotFound', 'Participant not found');
    }

    return jsonResponse(200, participant);
};

/**
 * Updates a participant campaign.
 */
export const updateParticipant: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const participantId = pathParameters?.pid;

    if (!participantId) {
        return errorResponse(400, 'ValidationError', 'Missing participant id');
    }

    const request = parseUpdateParticipantRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const participant = await adapter.get('campaignParticipant', participantId);

    if (!participant) {
        return errorResponse(404, 'NotFound', 'Participant not found');
    }

    const updated: CampaignParticipant = {
        ...participant,
        displayName: request.displayName,
        armyId: request.armyId,
        armyName: request.armyName,
        currentPhaseId: request.currentPhaseId,
        matchesInCurrentPhase: request.matchesInCurrentPhase,
        participantData: request.participantData ?? participant.participantData,
        matchIds: request.matchIds ?? participant.matchIds,
        updatedAt: new Date().toISOString(),
    };

    await adapter.put('campaignParticipant', updated);

    return jsonResponse(200, updated);
};

/**
 * Removes a participant from a campaign.
 */
export const deleteParticipant: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const campaignId = pathParameters?.id;
    const participantId = pathParameters?.pid;

    if (!campaignId || !participantId) {
        return errorResponse(400, 'ValidationError', 'Missing campaign or participant id');
    }

    const campaign = await adapter.get('campaign', campaignId);

    if (!campaign) {
        return errorResponse(404, 'NotFound', 'Campaign not found');
    }

    const participant = await adapter.get('campaignParticipant', participantId);

    if (!participant) {
        return errorResponse(404, 'NotFound', 'Participant not found');
    }

    await adapter.transaction(async () => {
        await adapter.delete('campaignParticipant', participantId);

        const updatedCampaign: Campaign = {
            ...campaign,
            participantIds: campaign.participantIds.filter((id: string) => id !== participantId),
            updatedAt: new Date().toISOString(),
        };

        await adapter.put('campaign', updatedCampaign);
    });

    return {
        statusCode: 204,
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    };
};
