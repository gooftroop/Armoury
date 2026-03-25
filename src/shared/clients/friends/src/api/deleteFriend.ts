/**
 * Deletes a friend relationship.
 */

import ky from 'ky';
import { FRIENDS_BASE_URL } from '@/config.js';
import type { FriendParams } from '@/types.js';

/**
 * Deletes a friend relationship.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the friend relationship ID to delete.
 * @returns Promise resolving when the friend relationship has been deleted.
 */
export async function deleteFriend(authorization: string, params: FriendParams): Promise<void> {
    await ky.delete(`${params.friendId}`, {
        prefixUrl: FRIENDS_BASE_URL,
        headers: { Authorization: authorization },
    });
}
