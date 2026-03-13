import type { UseMutationOptions } from '@tanstack/react-query';
import { putMatch } from '@/api/putMatch.js';
import type { UpdateMatchRequest, Match, MatchParams } from '@/types.js';

/**
 * Creates a React Query mutation options object for updating a match.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the match ID and update fields
 * @param options - Additional React Query mutation options (excluding mutationFn)
 * @returns React Query mutation options object ready for useMutation
 */
export function mutationUpdateMatch(
    authorization: string,
    params: MatchParams & UpdateMatchRequest,
    options?: Omit<UseMutationOptions<Match, Error, void>, 'mutationFn'>,
): UseMutationOptions<Match, Error, void> {
    return {
        mutationFn: () => putMatch(authorization, params),
        ...options,
    };
}
