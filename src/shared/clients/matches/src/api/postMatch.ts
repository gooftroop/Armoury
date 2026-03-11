import ky from 'ky';
import { MATCHES_BASE_URL } from './../config.ts';
import type { CreateMatchRequest, Match } from './../types.ts';

/**
 * Creates a new match via the matches service.
 *
 * @param authorization - The Authorization header value.
 * @param params - The match creation request body.
 * @returns Promise resolving to the created match.
 */
export async function postMatch(authorization: string, params: CreateMatchRequest): Promise<Match> {
    return ky
        .post('matches', {
            prefixUrl: MATCHES_BASE_URL,
            headers: { Authorization: authorization },
            json: params,
        })
        .json<Match>();
}
