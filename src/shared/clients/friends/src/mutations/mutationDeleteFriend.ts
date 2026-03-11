/**
 * React Query mutation options builder for deleting a friend relationship.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import { deleteFriend } from './../api/deleteFriend.ts';
import type { FriendParams } from './../types.ts';

/**
 * Builds React Query mutation options for deleting a friend relationship.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the friend relationship ID to delete.
 * @param params.friendId - The unique identifier of the friend relationship to delete.
 * @param options - Optional React Query mutation options (mutationFn is set internally).
 * @returns A complete UseMutationOptions object ready to pass to useMutation.
 */
export function mutationDeleteFriend(
    authorization: string,
    params: FriendParams,
    options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>,
): UseMutationOptions<void, Error, void> {
    return {
        mutationFn: () => deleteFriend(authorization, params),
        ...options,
    };
}
