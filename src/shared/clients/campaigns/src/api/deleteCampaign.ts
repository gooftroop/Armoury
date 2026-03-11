/**
 * Deletes a campaign via the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from './../config.ts';
import type { CampaignParams } from './../types.ts';

/**
 * Deletes a campaign by its unique identifier.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID
 * @returns Promise resolving when the campaign is deleted
 */
export async function deleteCampaign(authorization: string, params: CampaignParams): Promise<void> {
    await ky.delete(`campaigns/${params.campaignId}`, {
        prefixUrl: CAMPAIGNS_BASE_URL,
        headers: { Authorization: authorization },
    });
}
