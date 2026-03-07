import ky from 'ky';
import { MATCHES_BASE_URL } from '@clients-matches/config.js';
import type { MatchParams } from '@clients-matches/types.js';

/**
 * Deletes a match by ID via the matches service.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the match ID.
 * @returns Promise resolving when the match is deleted.
 */
export async function deleteMatch(
    authorization: string,
    params: MatchParams,
): Promise<void> {
    await ky.delete(`matches/${params.matchId}`, {
        prefixUrl: MATCHES_BASE_URL,
        headers: { Authorization: authorization },
    });
}
