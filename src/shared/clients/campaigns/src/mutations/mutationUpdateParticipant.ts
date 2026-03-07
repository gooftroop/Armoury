/**
 * Mutation options builder for updating a participant.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { putParticipant } from '@clients-campaigns/api/putParticipant.js';
import type { CampaignParticipant, ParticipantParams, UpdateParticipantRequest } from '@clients-campaigns/types.js';

/**
 * Builds React Query mutation options for updating a campaign participant.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign ID, participant ID, and update payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationUpdateParticipant(
    authorization: string,
    params: ParticipantParams & UpdateParticipantRequest,
    options?: Omit<UseMutationOptions<CampaignParticipant, Error, void>, 'mutationFn'>,
): UseMutationOptions<CampaignParticipant, Error, void> {
    return {
        mutationFn: () => putParticipant(authorization, params),
        ...options,
    };
}
