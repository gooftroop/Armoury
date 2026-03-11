/**
 * React Query mutation options builder for sending a friend request.
 */

import type { UseMutationOptions } from '@tanstack/react-query';
import type { Friend, SendFriendRequestPayload } from './../types.ts';
import { postFriendRequest } from './../api/postFriendRequest.ts';

/**
 * Builds React Query mutation options for sending a friend request.
 *
 * @param authorization - The Authorization header value.
 * @param params - The friend request payload containing receiver information.
 * @param options - Optional React Query mutation options (mutationFn is set internally).
 * @returns A complete UseMutationOptions object ready to pass to useMutation.
 */
export function mutationSendFriendRequest(
    authorization: string,
    params: SendFriendRequestPayload,
    options?: Omit<UseMutationOptions<Friend, Error, void>, 'mutationFn'>,
): UseMutationOptions<Friend, Error, void> {
    return {
        mutationFn: () => postFriendRequest(authorization, params),
        ...options,
    };
}
