/**
 * Deletes a friend relationship.
 */

import ky from 'ky';
import { FRIENDS_BASE_URL } from './../config.ts';
import type { FriendParams } from './../types.ts';

/**
 * Deletes a friend relationship.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the friend relationship ID to delete.
 * @returns Promise resolving when the friend relationship has been deleted.
 */
export async function deleteFriend(authorization: string, params: FriendParams): Promise<void> {
    await ky.delete(`friends/${params.friendId}`, {
        prefixUrl: FRIENDS_BASE_URL,
        headers: { Authorization: authorization },
    });
}
