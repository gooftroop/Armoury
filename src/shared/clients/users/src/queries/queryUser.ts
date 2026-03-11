/**
 * Query options builder for fetching a single user.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import { getUser } from './../api/getUser.ts';
import type { User, UserParams } from './../types.ts';

/**
 * Builds the query key for a single user query.
 *
 * @param params - Parameters containing the user ID
 * @returns A stable, readonly query key tuple
 */
export function buildQueryUserKey(params: UserParams) {
    return ['queryUser', params] as const;
}

/**
 * Builds React Query options for fetching a single user.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery
 */
export function queryUser(
    authorization: string,
    params: UserParams,
    options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<User, Error> {
    return {
        queryKey: buildQueryUserKey(params),
        queryFn: () => getUser(authorization, params),
        staleTime: 3_600_000,
        ...options,
    };
}
