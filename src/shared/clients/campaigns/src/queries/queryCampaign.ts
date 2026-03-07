/**
 * Query options builder for fetching a single campaign.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import { getCampaign } from '@clients-campaigns/api/getCampaign.js';
import type { Campaign, CampaignParams } from '@clients-campaigns/types.js';

/**
 * Builds the query key for a single campaign query.
 *
 * @param params - Parameters containing the campaign ID
 * @returns A stable, readonly query key tuple
 */
export function buildQueryCampaignKey(params: CampaignParams) {
    return ['queryCampaign', params] as const;
}

/**
 * Builds React Query options for fetching a single campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery
 */
export function queryCampaign(
    authorization: string,
    params: CampaignParams,
    options?: Omit<UseQueryOptions<Campaign, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<Campaign, Error> {
    return {
        queryKey: buildQueryCampaignKey(params),
        queryFn: () => getCampaign(authorization, params),
        staleTime: 3_600_000,
        ...options,
    };
}
