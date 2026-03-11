/**
 * Updates a user's account via the API.
 */

import ky from 'ky';
import { USERS_BASE_URL } from './../config.ts';
import type { Account, UserParams, UpdateAccountRequest } from './../types.ts';

/**
 * Updates the account associated with a user.
 *
 * @param authorization - The Authorization header value
 * @param params - Parameters containing the user ID
 * @param body - The account update payload
 * @returns Promise resolving to the updated account
 */
export async function putAccount(
    authorization: string,
    params: UserParams,
    body: UpdateAccountRequest,
): Promise<Account> {
    return ky
        .put(`users/${params.userId}/account`, {
            prefixUrl: USERS_BASE_URL,
            headers: { Authorization: authorization },
            json: body,
        })
        .json<Account>();
}
