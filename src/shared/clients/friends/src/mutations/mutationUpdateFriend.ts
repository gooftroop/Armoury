/**
 * React Query mutation options builder for updating a friend relationship.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import type { Friend, FriendParams, UpdateFriendRequest } from '@/types.js';
import { putFriend } from '@/api/putFriend.js';

/**
 * Builds React Query mutation options for updating a friend relationship.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the friend ID and fields to update.
 * @param options - Optional React Query mutation options (mutationFn is set internally).
 * @returns A complete UseMutationOptions object ready to pass to useMutation.
 */
export function mutationUpdateFriend(
    authorization: string,
    params: FriendParams & UpdateFriendRequest,
    options?: Omit<UseMutationOptions<Friend, Error, void>, 'mutationFn'>,
): UseMutationOptions<Friend, Error, void> {
    return {
        mutationFn: () => putFriend(authorization, params),
        ...options,
    };
}
