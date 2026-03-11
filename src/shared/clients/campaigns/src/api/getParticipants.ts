/**
 * Fetches all participants for a campaign from the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from './../config.ts';
import type { CampaignParams, CampaignParticipant } from './../types.ts';

/**
 * Retrieves the list of all participants in a campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID
 * @returns Promise resolving to an array of participants
 */
export async function getParticipants(authorization: string, params: CampaignParams): Promise<CampaignParticipant[]> {
    return ky
        .get(`campaigns/${params.campaignId}/participants`, {
            prefixUrl: CAMPAIGNS_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<CampaignParticipant[]>();
}
