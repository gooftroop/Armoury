/**
 * Deletes a user's account via the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from '@clients-users/config.js';
import type { UserParams } from '@clients-users/types.js';

/**
 * Deletes the account associated with a user.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @returns Promise resolving when the account is deleted
 */
export async function deleteAccount(authorization: string, params: UserParams): Promise<void> {
    await ky.delete(`users/${params.userId}/account`, {
        prefixUrl: USERS_BASE_URL,
        headers: { Authorization: authorization },
    });
}
