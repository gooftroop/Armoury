import type { UseQueryOptions } from '@tanstack/react-query';
import { fetchWahapediaPage } from '@/api/fetchWahapediaPage.js';
import type { IWahapediaParser } from '@/types.js';

/**
 * @requirements
 * - Build React Query options for parsed Wahapedia responses.
 * - Provide stable query keys for cache identity.
 */

/**
 * Builds the query key for parsed Wahapedia data.
 *
 * @param url - Wahapedia page URL.
 * @returns Stable query key tuple for parsed data.
 */
export function buildQueryWahapediaKey(url: string) {
    return ['wahapedia', url] as const;
}

/**
 * Builds React Query options for parsed Wahapedia content.
 *
 * @template T - Parsed result type.
 * @param url - Wahapedia page URL.
 * @param parser - Parser that converts HTML into typed data.
 * @param options - Optional React Query overrides excluding queryKey and queryFn.
 * @returns Query options for use with useQuery.
 */
export function queryWahapedia<T>(
    url: string,
    parser: IWahapediaParser<T>,
    options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<T, Error> {
    return {
        queryKey: buildQueryWahapediaKey(url),
        queryFn: () => fetchWahapediaPage(url, parser),
        staleTime: 86_400_000,
        ...options,
    };
}
