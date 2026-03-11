/**
 * Mutation options builder for creating a user's account.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { postAccount } from './../api/postAccount.ts';
import type { Account, UserParams, CreateAccountRequest } from './../types.ts';

/**
 * Builds React Query mutation options for creating a new account for a user.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param body - The account creation payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationCreateAccount(
    authorization: string,
    params: UserParams,
    body: CreateAccountRequest,
    options?: Omit<UseMutationOptions<Account, Error, void>, 'mutationFn'>,
): UseMutationOptions<Account, Error, void> {
    return {
        mutationFn: () => postAccount(authorization, params, body),
        ...options,
    };
}
