import ky from 'ky';
import { MATCHES_BASE_URL } from './../config.ts';
import type { UpdateMatchRequest, Match, MatchParams } from './../types.ts';

/**
 * Updates an existing match via the matches service.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the match ID and update fields.
 * @returns Promise resolving to the updated match.
 */
export async function putMatch(authorization: string, params: MatchParams & UpdateMatchRequest): Promise<Match> {
    const { matchId, ...request } = params;

    return ky
        .put(`matches/${matchId}`, {
            prefixUrl: MATCHES_BASE_URL,
            headers: { Authorization: authorization },
            json: request,
        })
        .json<Match>();
}
