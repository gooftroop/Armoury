/**
 * Query options builder for fetching participants in a campaign.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import { getParticipants } from './../api/getParticipants.ts';
import type { CampaignParams, CampaignParticipant } from './../types.ts';

/**
 * Builds the query key for a campaign's participants list query.
 *
 * @param params - Parameters containing the campaign ID
 * @returns A stable, readonly query key tuple
 */
export function buildQueryParticipantsKey(params: CampaignParams) {
    return ['queryParticipants', params] as const;
}

/**
 * Builds React Query options for fetching all participants in a campaign.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery
 */
export function queryParticipants(
    authorization: string,
    params: CampaignParams,
    options?: Omit<UseQueryOptions<CampaignParticipant[], Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<CampaignParticipant[], Error> {
    return {
        queryKey: buildQueryParticipantsKey(params),
        queryFn: () => getParticipants(authorization, params),
        staleTime: 3_600_000,
        ...options,
    };
}
