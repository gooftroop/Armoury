import ky from 'ky';
import { MATCHES_BASE_URL } from '@/config.js';
import type { MatchParams } from '@/types.js';

/**
 * Deletes a match by ID via the matches service.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the match ID.
 * @returns Promise resolving when the match is deleted.
 */
export async function deleteMatch(authorization: string, params: MatchParams): Promise<void> {
    await ky.delete(`${params.matchId}`, {
        prefixUrl: MATCHES_BASE_URL,
        headers: { Authorization: authorization },
    });
}
