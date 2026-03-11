/**
 * Removes a participant from a campaign via the API.
 */

import ky from 'ky';
import { CAMPAIGNS_BASE_URL } from './../config.ts';
import type { ParticipantParams } from './../types.ts';

/**
 * Deletes a participant from a campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID and participant ID
 * @returns Promise resolving when the participant is removed
 */
export async function deleteParticipant(authorization: string, params: ParticipantParams): Promise<void> {
    await ky.delete(`campaigns/${params.campaignId}/participants/${params.participantId}`, {
        prefixUrl: CAMPAIGNS_BASE_URL,
        headers: { Authorization: authorization },
    });
}
