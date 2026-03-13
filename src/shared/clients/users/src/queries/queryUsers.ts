/**
 * Query options builder for fetching all users.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import { getUsers } from '@/api/getUsers.js';
import type { User } from '@/types.js';

/**
 * Builds the query key for the users list query.
 *
 * @returns A stable, readonly query key tuple
 */
export function buildQueryUsersKey() {
    return ['queryUsers'] as const;
}

/**
 * Builds React Query options for fetching all users.
 *
 * @param authorization - The Authorization header value
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery
 */
export function queryUsers(
    authorization: string,
    options?: Omit<UseQueryOptions<User[], Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<User[], Error> {
    return {
        queryKey: buildQueryUsersKey(),
        queryFn: () => getUsers(authorization),
        staleTime: 3_600_000,
        ...options,
    };
}
