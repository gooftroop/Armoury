/**
 * Creates an account for a user via the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from '@/config.js';
import type { Account, UserParams, CreateAccountRequest } from '@/types.js';

/**
 * Creates a new account for the specified user.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param body - The account creation payload
 * @returns Promise resolving to the created account
 */
export async function postAccount(
    authorization: string,
    params: UserParams,
    body: CreateAccountRequest,
): Promise<Account> {
    return ky
        .post(`${params.userId}/account`, {
            prefixUrl: USERS_BASE_URL,
            headers: { Authorization: authorization },
            json: body,
        })
        .json<Account>();
}
