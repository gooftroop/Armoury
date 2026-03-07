/**
 * Updates an existing campaign via the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from '@clients-campaigns/config.js';
import type { Campaign, CampaignParams, UpdateCampaignRequest } from '@clients-campaigns/types.js';

/**
 * Updates a campaign with the provided data.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign ID and update payload
 * @returns Promise resolving to the updated campaign
 */
export async function putCampaign(
    authorization: string,
    params: CampaignParams & UpdateCampaignRequest,
): Promise<Campaign> {
    const { campaignId, ...request } = params;

    return ky
        .put(`campaigns/${campaignId}`, {
            prefixUrl: CAMPAIGNS_BASE_URL,
            headers: { Authorization: authorization },
            json: request,
        })
        .json<Campaign>();
}
