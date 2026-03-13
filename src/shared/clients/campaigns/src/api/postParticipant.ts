/**
 * Adds a participant to a campaign via the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from '@/config.js';
import type { CampaignParams, CampaignParticipant, JoinCampaignRequest } from '@/types.js';

/**
 * Adds a new participant to a campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign ID and join request payload
 * @returns Promise resolving to the created participant
 */
export async function postParticipant(
    authorization: string,
    params: CampaignParams & JoinCampaignRequest,
): Promise<CampaignParticipant> {
    const { campaignId, ...request } = params;

    return ky
        .post(`campaigns/${campaignId}/participants`, {
            prefixUrl: CAMPAIGNS_BASE_URL,
            headers: { Authorization: authorization },
            json: request,
        })
        .json<CampaignParticipant>();
}
