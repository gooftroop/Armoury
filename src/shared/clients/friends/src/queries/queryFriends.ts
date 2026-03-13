/**
 * React Query options builder for fetching all friends.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import type { Friend } from '@/types.js';
import { getFriends } from '@/api/getFriends.js';

/**
 * Builds the query key for the friends list query.
 *
 * @returns A stable, readonly query key tuple.
 */
export function buildQueryFriendsKey() {
    return ['queryFriends'] as const;
}

/**
 * Builds React Query options for fetching all friend relationships.
 *
 * @param authorization - The Authorization header value.
 * @param options - Optional React Query options (queryKey and queryFn are set internally).
 * @returns A complete UseQueryOptions object ready to pass to useQuery.
 */
export function queryFriends(
    authorization: string,
    options?: Omit<UseQueryOptions<Friend[], Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<Friend[], Error> {
    return {
        queryKey: buildQueryFriendsKey(),
        queryFn: () => getFriends(authorization),
        staleTime: 3_600_000,
        ...options,
    };
}
