import type { UseMutationOptions } from '@tanstack/react-query';
import { deleteMatch } from '@clients-matches/api/deleteMatch.js';
import type { MatchParams } from '@clients-matches/types.js';

/**
 * Creates a React Query mutation options object for deleting a match.
 *
 * @param authorization - The Authorization header value.
 * @param params - Parameters containing the match ID
 * @param options - Additional React Query mutation options (excluding mutationFn)
 * @returns React Query mutation options object ready for useMutation
 */
export function mutationDeleteMatch(
    authorization: string,
    params: MatchParams,
    options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>,
): UseMutationOptions<void, Error, void> {
    return {
        mutationFn: () => deleteMatch(authorization, params),
        ...options,
    };
}
