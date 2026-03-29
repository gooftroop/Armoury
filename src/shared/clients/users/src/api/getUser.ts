/**
 * Fetches a single user by ID from the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from '@/config.js';
import type { User, UserParams } from '@/types.js';

/**
 * Retrieves a single user by their unique identifier.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @returns Promise resolving to the user
 */
export async function getUser(authorization: string, params: UserParams): Promise<User> {
    return ky
        .get(`${params.userId}`, {
            prefixUrl: USERS_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<User>();
}
