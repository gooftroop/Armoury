import type { UseQueryOptions } from '@tanstack/react-query';
import { fetchWahapediaPageRaw } from '@/api/fetchWahapediaPageRaw.js';
import type { WahapediaFetchResult } from '@/api/fetchWahapediaPageRaw.js';

/**
 * @requirements
 * - Build React Query options for raw Wahapedia HTML.
 * - Provide stable query keys for cache identity.
 */

/**
 * Builds the query key for raw Wahapedia HTML data.
 *
 * @param url - Wahapedia page URL.
 * @returns Stable query key tuple for raw HTML.
 */
export function buildQueryWahapediaRawKey(url: string) {
    return ['wahapediaRaw', url] as const;
}

/**
 * Builds React Query options for raw Wahapedia page HTML.
 *
 * @param url - Wahapedia page URL.
 * @param options - Optional React Query overrides excluding queryKey and queryFn.
 * @returns Query options for use with useQuery.
 */
export function queryWahapediaRaw(
    url: string,
    options?: Omit<UseQueryOptions<WahapediaFetchResult, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<WahapediaFetchResult, Error> {
    return {
        queryKey: buildQueryWahapediaRawKey(url),
        queryFn: () => fetchWahapediaPageRaw(url),
        staleTime: 86_400_000,
        ...options,
    };
}
