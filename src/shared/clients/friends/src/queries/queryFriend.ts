/**
 * React Query options builder for fetching a single friend.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import type { Friend, FriendParams } from './../types.ts';
import { getFriend } from './../api/getFriend.ts';

/**
 * Builds the query key for a single friend query.
 *
 * @param params - Parameters containing the friend relationship ID.
 * @param params.friendId - The unique identifier of the friend relationship.
 * @returns A stable, readonly query key tuple.
 */
export function buildQueryFriendKey(params: FriendParams) {
    return ['queryFriend', params.friendId] as const;
}

/**
 * Builds React Query options for fetching a single friend relationship.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the friend relationship ID.
 * @param params.friendId - The unique identifier of the friend relationship.
 * @param options - Optional React Query options (queryKey and queryFn are set internally).
 * @returns A complete UseQueryOptions object ready to pass to useQuery.
 */
export function queryFriend(
    authorization: string,
    params: FriendParams,
    options?: Omit<UseQueryOptions<Friend, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<Friend, Error> {
    return {
        queryKey: buildQueryFriendKey(params),
        queryFn: () => getFriend(authorization, params),
        staleTime: 3_600_000,
        ...options,
    };
}
