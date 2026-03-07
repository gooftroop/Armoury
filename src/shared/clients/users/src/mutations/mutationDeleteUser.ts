/**
 * Mutation options builder for deleting a user.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { deleteUser } from '@clients-users/api/deleteUser.js';
import type { UserParams } from '@clients-users/types.js';

/**
 * Builds React Query mutation options for deleting a user.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationDeleteUser(
    authorization: string,
    params: UserParams,
    options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>,
): UseMutationOptions<void, Error, void> {
    return {
        mutationFn: () => deleteUser(authorization, params),
        ...options,
    };
}
