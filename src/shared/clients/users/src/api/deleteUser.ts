/**
 * Deletes a user via the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from '@/config.js';
import type { UserParams } from '@/types.js';

/**
 * Deletes a user by their unique identifier.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @returns Promise resolving when the user is deleted
 */
export async function deleteUser(authorization: string, params: UserParams): Promise<void> {
    await ky.delete(`${params.userId}`, {
        prefixUrl: USERS_BASE_URL,
        headers: { Authorization: authorization },
    });
}
