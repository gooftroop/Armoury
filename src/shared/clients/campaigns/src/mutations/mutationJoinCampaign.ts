/**
 * Mutation options builder for joining a campaign.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { postParticipant } from '@/api/postParticipant.js';
import type { CampaignParams, CampaignParticipant, JoinCampaignRequest } from '@/types.js';

/**
 * Builds React Query mutation options for joining a campaign as a participant.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign ID and join request payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationJoinCampaign(
    authorization: string,
    params: CampaignParams & JoinCampaignRequest,
    options?: Omit<UseMutationOptions<CampaignParticipant, Error, void>, 'mutationFn'>,
): UseMutationOptions<CampaignParticipant, Error, void> {
    return {
        mutationFn: () => postParticipant(authorization, params),
        ...options,
    };
}
