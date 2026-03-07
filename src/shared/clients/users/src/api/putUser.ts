/**
 * Updates an existing user via the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from '@clients-users/config.js';
import type { User, UserParams, UpdateUserRequest } from '@clients-users/types.js';

/**
 * Updates a user with the provided data.
 *
 * @param authorization - The Authorization header value
 * @param params - The user ID and update payload
 * @returns Promise resolving to the updated user
 */
export async function putUser(authorization: string, params: UserParams & UpdateUserRequest): Promise<User> {
    const { userId, ...request } = params;

    return ky
        .put(`users/${userId}`, {
            prefixUrl: USERS_BASE_URL,
            headers: { Authorization: authorization },
            json: request,
        })
        .json<User>();
}
