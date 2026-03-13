/**
 * Mutation options builder for updating a user's account.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { putAccount } from '@/api/putAccount.js';
import type { Account, UserParams, UpdateAccountRequest } from '@/types.js';

/**
 * Builds React Query mutation options for updating a user's account.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param body - The account update payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationUpdateAccount(
    authorization: string,
    params: UserParams,
    body: UpdateAccountRequest,
    options?: Omit<UseMutationOptions<Account, Error, void>, 'mutationFn'>,
): Omit<UseMutationOptions<Account, Error, void>, 'mutationFn'> & { mutationFn: () => Promise<Account> } {
    return {
        mutationFn: () => putAccount(authorization, params, body),
        ...options,
    };
}
