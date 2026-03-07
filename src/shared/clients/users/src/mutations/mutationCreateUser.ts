/**
 * Mutation options builder for creating a user.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { postUser } from '@clients-users/api/postUser.js';
import type { User, CreateUserRequest } from '@clients-users/types.js';

/**
 * Builds React Query mutation options for creating a new user.
 *
 * @param authorization - The Authorization header value
 * @param params - The user creation payload
 * @param options - Optional React Query mutation configuration (excluding mutationFn)
 * @returns Mutation options object ready for use with useMutation
 */
export function mutationCreateUser(
    authorization: string,
    params: CreateUserRequest,
    options?: Omit<UseMutationOptions<User, Error, void>, 'mutationFn'>,
): UseMutationOptions<User, Error, void> {
    return {
        mutationFn: () => postUser(authorization, params),
        ...options,
    };
}
