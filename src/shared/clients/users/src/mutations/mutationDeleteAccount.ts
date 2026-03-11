/**
 * Mutation options builder for deleting a user's account.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { deleteAccount } from '@/api/deleteAccount.js';
import type { UserParams } from '@/types.js';

/**
 * Builds React Query mutation options for deleting a user's account.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationDeleteAccount(
    authorization: string,
    params: UserParams,
    options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>,
): UseMutationOptions<void, Error, void> {
    return {
        mutationFn: () => deleteAccount(authorization, params),
        ...options,
    };
}
