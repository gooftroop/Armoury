import ky from 'ky';
import { MATCHES_BASE_URL } from '@clients-matches/config.js';
import type { Match, MatchParams } from '@clients-matches/types.js';

/**
 * Fetches a single match by ID from the matches service.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the match ID.
 * @returns Promise resolving to the match.
 */
export async function getMatch(authorization: string, params: MatchParams): Promise<Match> {
    return ky
        .get(`matches/${params.matchId}`, {
            prefixUrl: MATCHES_BASE_URL,
            headers: { Authorization: authorization },
        })
        .json<Match>();
}
