/**
 * Creates a new campaign via the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from '@/config.js';
import type { Campaign, CreateCampaignRequest } from '@/types.js';

/**
 * Creates a new campaign with the provided data.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign creation payload
 * @returns Promise resolving to the created campaign
 */
export async function postCampaign(authorization: string, params: CreateCampaignRequest): Promise<Campaign> {
    return ky
        .post('', {
            prefixUrl: CAMPAIGNS_BASE_URL,
            headers: { Authorization: authorization },
            json: params,
        })
        .json<Campaign>();
}
