import type { UseMutationOptions } from '@tanstack/react-query';
import { postMatch } from '@clients-matches/api/postMatch.js';
import type { CreateMatchRequest, Match } from '@clients-matches/types.js';

/**
 * Creates a React Query mutation options object for creating a match.
 *
 * @param authorization - The Authorization header value.
 * @param params - The match creation request body
 * @param options - Additional React Query mutation options (excluding mutationFn)
 * @returns React Query mutation options object ready for useMutation
 */
export function mutationCreateMatch(
    authorization: string,
    params: CreateMatchRequest,
    options?: Omit<UseMutationOptions<Match, Error, void>, 'mutationFn'>,
): UseMutationOptions<Match, Error, void> {
    return {
        mutationFn: () => postMatch(authorization, params),
        ...options,
    };
}
