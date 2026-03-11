/**
 * Mutation options builder for creating a campaign.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { postCampaign } from './../api/postCampaign.ts';
import type { Campaign, CreateCampaignRequest } from './../types.ts';

/**
 * Builds React Query mutation options for creating a new campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - The campaign creation payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationCreateCampaign(
    authorization: string,
    params: CreateCampaignRequest,
    options?: Omit<UseMutationOptions<Campaign, Error, void>, 'mutationFn'>,
): UseMutationOptions<Campaign, Error, void> {
    return {
        mutationFn: () => postCampaign(authorization, params),
        ...options,
    };
}
