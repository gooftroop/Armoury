/**
 * Fetches a user's account from the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from './../config.ts';
import type { Account, UserParams } from './../types.ts';

/**
 * Retrieves the account associated with a user.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @returns Promise resolving to the account
 */
export async function getAccount(authorization: string, params: UserParams): Promise<Account> {
    return ky
        .get(`users/${params.userId}/account`, {
            prefixUrl: USERS_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<Account>();
}
