import type { UseQueryOptions } from '@tanstack/react-query';
import { getMatch } from '@/api/getMatch.js';
import type { Match, MatchParams } from '@/types.js';

/**
 * Builds the query key for fetching a single match.
 *
 * @param params - Parameters containing the match ID
 * @returns A stable, serializable query key tuple
 */
export function buildQueryMatchKey(params: MatchParams) {
    return ['queryMatch', params] as const;
}

/**
 * Creates a React Query options object for fetching a single match.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the match ID
 * @param options - Additional React Query options (excluding queryKey and queryFn)
 * @returns React Query options object ready for useQuery
 */
export function queryMatch(
    authorization: string,
    params: MatchParams,
    options?: Omit<UseQueryOptions<Match, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<Match, Error> {
    return {
        queryKey: buildQueryMatchKey(params),
        queryFn: () => getMatch(authorization, params),
        staleTime: 3_600_000,
        ...options,
    };
}
