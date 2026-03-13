/**
 * Fetches all campaigns from the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from '@/config.js';
import type { Campaign } from '@/types.js';

/**
 * Retrieves the list of all campaigns.
 *
 * @param authorization - The Authorization header value
 * @returns Promise resolving to an array of campaigns
 */
export async function getCampaigns(authorization: string): Promise<Campaign[]> {
    return ky
        .get('campaigns', {
            prefixUrl: CAMPAIGNS_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<Campaign[]>();
}
