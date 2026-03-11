/**
 * Query options builder for fetching a user's account.
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import { getAccount } from './../api/getAccount.ts';
import type { Account, UserParams } from './../types.ts';

/**
 * Builds the query key for a user's account query.
 *
 * @param params - Parameters containing the user ID
 * @returns A stable, readonly query key tuple
 */
export function buildQueryAccountKey(params: UserParams) {
    return ['queryAccount', params] as const;
}

/**
 * Builds React Query options for fetching a user's account.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery
 */
export function queryAccount(
    authorization: string,
    params: UserParams,
    options?: Omit<UseQueryOptions<Account, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<Account, Error> {
    return {
        queryKey: buildQueryAccountKey(params),
        queryFn: () => getAccount(authorization, params),
        staleTime: 3_600_000,
        ...options,
    };
}
