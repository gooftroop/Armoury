/**
 * Query options builder for fetching all campaigns.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import { getCampaigns } from '@/api/getCampaigns.js';
import type { Campaign } from '@/types.js';

/**
 * Builds the query key for the campaigns list query.
 *
 * @returns A stable, readonly query key tuple
 */
export function buildQueryCampaignsKey() {
    return ['queryCampaigns'] as const;
}

/**
 * Builds React Query options for fetching all campaigns.
 *
 * @param authorization - The Authorization header value
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery
 */
export function queryCampaigns(
    authorization: string,
    options?: Omit<UseQueryOptions<Campaign[], Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<Campaign[], Error> {
    return {
        queryKey: buildQueryCampaignsKey(),
        queryFn: () => getCampaigns(authorization),
        staleTime: 3_600_000,
        ...options,
    };
}
