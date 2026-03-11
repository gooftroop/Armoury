/**
 * Creates a new user via the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from './../config.ts';
import type { User, CreateUserRequest } from './../types.ts';

/**
 * Creates a new user with the provided data.
 *
 * @param authorization - The Authorization header value
 * @param params - The user creation payload
 * @returns Promise resolving to the created user
 */
export async function postUser(authorization: string, params: CreateUserRequest): Promise<User> {
    return ky
        .post('users', {
            prefixUrl: USERS_BASE_URL,
            headers: { Authorization: authorization },
            json: params,
        })
        .json<User>();
}
