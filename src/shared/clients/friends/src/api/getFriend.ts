/**
 * Fetches a single friend relationship by ID.
 */

import ky from 'ky';
import { FRIENDS_BASE_URL } from '@clients-friends/config.js';
import type { Friend, FriendParams } from '@clients-friends/types.js';

/**
 * Fetches a single friend relationship.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the friend relationship ID.
 * @returns Promise resolving to the friend relationship.
 */
export async function getFriend(authorization: string, params: FriendParams): Promise<Friend> {
    return ky.get(`friends/${params.friendId}`, {
        prefixUrl: FRIENDS_BASE_URL,
        headers: { Authorization: authorization },
    }).json<Friend>();
}
