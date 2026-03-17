import type { UseQueryOptions } from '@tanstack/react-query';
import type { IGitHubClient } from '@/types.js';
import { buildQueryGitHubFileShaKey } from '@/queries/buildQueryGitHubKeys.js';

/**
 * @requirements
 * 1. Must accept IGitHubClient interface (not concrete class) as first parameter.
 * 2. Must return UseQueryOptions compatible with useQuery/fetchQuery.
 * 3. Must use buildQueryGitHubFileShaKey for the query key.
 */

/**
 * Builds React Query options for getting a file SHA from a GitHub repository path.
 *
 * @param githubClient - GitHub client instance implementing IGitHubClient
 * @param owner - Repository owner username or organization
 * @param repo - Repository name
 * @param path - Path within the repository
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery or fetchQuery
 */
export function queryGitHubFileSha(
    githubClient: IGitHubClient,
    owner: string,
    repo: string,
    path: string,
    options?: Omit<UseQueryOptions<string, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<string, Error> {
    return {
        queryKey: buildQueryGitHubFileShaKey(owner, repo, path),
        queryFn: () => githubClient.getFileSha(owner, repo, path),
        staleTime: 300_000,
        ...options,
    };
}
