/**
 * Mutation options builder for updating a user.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { putUser } from '@/api/putUser.js';
import type { User, UserParams, UpdateUserRequest } from '@/types.js';

/**
 * Builds React Query mutation options for updating an existing user.
 *
 * @param authorization - The Authorization header value
 * @param params - The user ID and update payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationUpdateUser(
    authorization: string,
    params: UserParams & UpdateUserRequest,
    options?: Omit<UseMutationOptions<User, Error, void>, 'mutationFn'>,
): UseMutationOptions<User, Error, void> {
    return {
        mutationFn: () => putUser(authorization, params),
        ...options,
    };
}
