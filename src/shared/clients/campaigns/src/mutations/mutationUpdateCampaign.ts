/**
 * Mutation options builder for updating a campaign.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { putCampaign } from './../api/putCampaign.ts';
import type { Campaign, CampaignParams, UpdateCampaignRequest } from './../types.ts';

/**
 * Builds React Query mutation options for updating an existing campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign ID and update payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationUpdateCampaign(
    authorization: string,
    params: CampaignParams & UpdateCampaignRequest,
    options?: Omit<UseMutationOptions<Campaign, Error, void>, 'mutationFn'>,
): UseMutationOptions<Campaign, Error, void> {
    return {
        mutationFn: () => putCampaign(authorization, params),
        ...options,
    };
}
