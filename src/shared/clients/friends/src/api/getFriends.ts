/**
 * Fetches all friend relationships for the authenticated user.
 */

import ky from 'ky';
import { FRIENDS_BASE_URL } from '@clients-friends/config.js';
import type { Friend } from '@clients-friends/types.js';

/**
 * Fetches all friend relationships.
 *
 * @param authorization - The Authorization header value.
 * @returns Promise resolving to an array of friend relationships.
 */
export async function getFriends(authorization: string): Promise<Friend[]> {
    return ky
        .get('friends', {
            prefixUrl: FRIENDS_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<Friend[]>();
}
