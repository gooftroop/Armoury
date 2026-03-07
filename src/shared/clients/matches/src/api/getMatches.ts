import ky from 'ky';
import { MATCHES_BASE_URL } from '@clients-matches/config.js';
import type { Match } from '@clients-matches/types.js';

/**
 * Fetches all matches from the matches service.
 *
 * @param authorization - The Authorization header value.
 * @returns Promise resolving to an array of all matches.
 */
export async function getMatches(authorization: string): Promise<Match[]> {
    return ky.get('matches', {
        prefixUrl: MATCHES_BASE_URL,
        headers: { Authorization: authorization },
    }).json<Match[]>();
}
