/**
 * Fetches a single campaign by ID from the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from '@clients-campaigns/config.js';
import type { Campaign, CampaignParams } from '@clients-campaigns/types.js';

/**
 * Retrieves a single campaign by its unique identifier.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID
 * @returns Promise resolving to the campaign
 */
export async function getCampaign(authorization: string, params: CampaignParams): Promise<Campaign> {
    return ky
        .get(`campaigns/${params.campaignId}`, {
            prefixUrl: CAMPAIGNS_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<Campaign>();
}
