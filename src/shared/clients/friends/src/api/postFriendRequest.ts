/**
 * Sends a new friend request.
 */

import ky from 'ky';
import { FRIENDS_BASE_URL } from '@/config.js';
import type { Friend, SendFriendRequestPayload } from '@/types.js';

/**
 * Sends a friend request.
 *
 * @param authorization - The Authorization header value.
 * @param params - The friend request payload containing receiver information.
 * @returns Promise resolving to the created friend relationship.
 */
export async function postFriendRequest(authorization: string, params: SendFriendRequestPayload): Promise<Friend> {
    return ky
        .post('friends', {
            prefixUrl: FRIENDS_BASE_URL,
            headers: { Authorization: authorization },
            json: params,
        })
        .json<Friend>();
}
