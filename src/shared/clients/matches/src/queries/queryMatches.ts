import type { UseQueryOptions } from '@tanstack/react-query';
import { getMatches } from '@clients-matches/api/getMatches.js';
import type { Match } from '@clients-matches/types.js';

/**
 * Builds the query key for listing all matches.
 *
 * @returns A stable, serializable query key tuple
 */
export function buildQueryMatchesKey() {
    return ['queryMatches'] as const;
}

/**
 * Creates a React Query options object for listing all matches.
 *
 * @param authorization - The Authorization header value.
 * @param options - Additional React Query options (excluding queryKey and queryFn)
 * @returns React Query options object ready for useQuery
 */
export function queryMatches(
    authorization: string,
    options?: Omit<UseQueryOptions<Match[], Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<Match[], Error> {
    return {
        queryKey: buildQueryMatchesKey(),
        queryFn: () => getMatches(authorization),
        staleTime: 3_600_000,
        ...options,
    };
}
