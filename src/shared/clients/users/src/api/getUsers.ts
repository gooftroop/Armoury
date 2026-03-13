/**
 * Fetches all users from the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from '@/config.js';
import type { User } from '@/types.js';

/**
 * Retrieves the list of all users.
 *
 * @param authorization - The Authorization header value
 * @returns Promise resolving to an array of users
 */
export async function getUsers(authorization: string): Promise<User[]> {
    return ky
        .get('users', {
            prefixUrl: USERS_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<User[]>();
}
