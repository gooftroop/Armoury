import { randomUUID } from 'crypto';

import type { DatabaseAdapter } from '@armoury/data-dao/types';
import type { Campaign } from '@armoury/models/CampaignModel';
import type { ApiResponse, PathParameters, RouteHandler, UserContext } from '@/types.js';
import { errorResponse, jsonResponse } from '@/utils/response.js';
import { parseCreateCampaignRequest, parseUpdateCampaignRequest } from '@/utils/validation.js';

/**
 * Creates a master campaign.
 */
export const createCampaign: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const request = parseCreateCampaignRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const now = new Date().toISOString();
    const campaign: Campaign = {
        id: randomUUID(),
        name: request.name,
        type: request.type,
        organizerId: userContext.sub,
        narrative: request.narrative as Campaign['narrative'],
        campaignData: (request.campaignData ?? undefined) as Campaign['campaignData'],
        startDate: request.startDate,
        endDate: request.endDate,
        status: request.status,
        phases: [],
        customRules: request.customRules ?? [],
        rankings: [],
        participantIds: [],
        matchIds: [],
        createdAt: now,
        updatedAt: now,
    };

    await adapter.put('campaign', campaign);

    return jsonResponse(201, campaign);
};

/**
 * Lists all master campaigns.
 */
export const listCampaigns: RouteHandler = async (adapter: DatabaseAdapter): Promise<ApiResponse> => {
    const campaigns = await adapter.getAll('campaign');

    return jsonResponse(200, campaigns);
};

/**
 * Retrieves a master campaign by ID.
 */
export const getCampaign: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const campaignId = pathParameters?.id;

    if (!campaignId) {
        return errorResponse(400, 'ValidationError', 'Missing campaign id');
    }

    const campaign = await adapter.get('campaign', campaignId);

    if (!campaign) {
        return errorResponse(404, 'NotFound', 'Campaign not found');
    }

    return jsonResponse(200, campaign);
};

/**
 * Updates a master campaign by ID.
 */
export const updateCampaign: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const campaignId = pathParameters?.id;

    if (!campaignId) {
        return errorResponse(400, 'ValidationError', 'Missing campaign id');
    }

    const request = parseUpdateCampaignRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const existing = await adapter.get('campaign', campaignId);

    if (!existing) {
        return errorResponse(404, 'NotFound', 'Campaign not found');
    }

    const updated: Campaign = {
        ...existing,
        name: request.name,
        type: request.type,
        narrative: request.narrative as Campaign['narrative'],
        campaignData: (request.campaignData !== undefined
            ? request.campaignData
            : existing.campaignData) as Campaign['campaignData'],
        startDate: request.startDate,
        endDate: request.endDate,
        status: request.status,
        phases: request.phases ?? existing.phases,
        customRules: request.customRules ?? existing.customRules,
        rankings: request.rankings ?? existing.rankings,
        participantIds: request.participantIds ?? existing.participantIds,
        matchIds: request.matchIds ?? existing.matchIds,
        updatedAt: new Date().toISOString(),
    };

    await adapter.put('campaign', updated);

    return jsonResponse(200, updated);
};

/**
 * Deletes a master campaign by ID.
 */
export const deleteCampaign: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const campaignId = pathParameters?.id;

    if (!campaignId) {
        return errorResponse(400, 'ValidationError', 'Missing campaign id');
    }

    const existing = await adapter.get('campaign', campaignId);

    if (!existing) {
        return errorResponse(404, 'NotFound', 'Campaign not found');
    }

    await adapter.delete('campaign', campaignId);

    return {
        statusCode: 204,
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    };
};
