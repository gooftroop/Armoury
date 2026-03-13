/**
 * Query options builder for fetching a single participant.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import { getParticipant } from '@/api/getParticipant.js';
import type { CampaignParticipant, ParticipantParams } from '@/types.js';

/**
 * Builds the query key for a single participant query.
 *
 * @param params - Parameters containing the campaign ID and participant ID
 * @returns A stable, readonly query key tuple
 */
export function buildQueryParticipantKey(params: ParticipantParams) {
    return ['queryParticipant', params] as const;
}

/**
 * Builds React Query options for fetching a single participant.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the campaign ID and participant ID
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery
 */
export function queryParticipant(
    authorization: string,
    params: ParticipantParams,
    options?: Omit<UseQueryOptions<CampaignParticipant, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<CampaignParticipant, Error> {
    return {
        queryKey: buildQueryParticipantKey(params),
        queryFn: () => getParticipant(authorization, params),
        staleTime: 3_600_000,
        ...options,
    };
}
