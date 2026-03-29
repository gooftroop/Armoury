/**
 * Updates a participant's campaign data via the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from '@/config.js';
import type { CampaignParticipant, ParticipantParams, UpdateParticipantRequest } from '@/types.js';

/**
 * Updates a participant's data within a campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign ID, participant ID, and update payload
 * @returns Promise resolving to the updated participant
 */
export async function putParticipant(
    authorization: string,
    params: ParticipantParams & UpdateParticipantRequest,
): Promise<CampaignParticipant> {
    const { campaignId, participantId, ...request } = params;

    return ky
        .put(`${campaignId}/participants/${participantId}`, {
            prefixUrl: CAMPAIGNS_BASE_URL,
            headers: { Authorization: authorization },
            json: request,
        })
        .json<CampaignParticipant>();
}
