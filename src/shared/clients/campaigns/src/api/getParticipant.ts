/**
 * Fetches a single participant by ID from the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from '@clients-campaigns/config.js';
import type { CampaignParticipant, ParticipantParams } from '@clients-campaigns/types.js';

/**
 * Retrieves a single participant by their unique identifier.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID and participant ID
 * @returns Promise resolving to the participant
 */
export async function getParticipant(
    authorization: string,
    params: ParticipantParams,
): Promise<CampaignParticipant> {
    return ky.get(`campaigns/${params.campaignId}/participants/${params.participantId}`, {
        prefixUrl: CAMPAIGNS_BASE_URL,
        headers: { Authorization: authorization },
    }).json<CampaignParticipant>();
}
