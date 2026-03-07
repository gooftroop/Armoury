/**
 * Updates an existing friend relationship.
 */

import ky from 'ky';
import { FRIENDS_BASE_URL } from '@clients-friends/config.js';
import type { Friend, FriendParams, UpdateFriendRequest } from '@clients-friends/types.js';

/**
 * Updates a friend relationship.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the friend ID and fields to update.
 * @returns Promise resolving to the updated friend relationship.
 */
export async function putFriend(
    authorization: string,
    params: FriendParams & UpdateFriendRequest,
): Promise<Friend> {
    const { friendId, ...updateFields } = params;

    return ky.put(`friends/${friendId}`, {
        prefixUrl: FRIENDS_BASE_URL,
        headers: { Authorization: authorization },
        json: updateFields,
    }).json<Friend>();
}
