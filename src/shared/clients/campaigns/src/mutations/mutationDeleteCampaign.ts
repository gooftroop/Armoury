/**
 * Mutation options builder for deleting a campaign.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { deleteCampaign } from '@clients-campaigns/api/deleteCampaign.js';
import type { CampaignParams } from '@clients-campaigns/types.js';

/**
 * Builds React Query mutation options for deleting a campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationDeleteCampaign(
    authorization: string,
    params: CampaignParams,
    options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>,
): UseMutationOptions<void, Error, void> {
    return {
        mutationFn: () => deleteCampaign(authorization, params),
        ...options,
    };
}
