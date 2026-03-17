import type { UseQueryOptions } from '@tanstack/react-query';
import type { IGitHubClient } from '@/types.js';
import { buildQueryGitHubUpdateCheckKey } from '@/queries/buildQueryGitHubKeys.js';

/**
 * @requirements
 * 1. Must accept IGitHubClient interface (not concrete class) as first parameter.
 * 2. Must return UseQueryOptions compatible with useQuery/fetchQuery.
 * 3. Must use buildQueryGitHubUpdateCheckKey for the query key.
 */

/**
 * Builds React Query options for checking whether a GitHub file has updates.
 *
 * @param githubClient - GitHub client instance implementing IGitHubClient
 * @param owner - Repository owner username or organization
 * @param repo - Repository name
 * @param path - Path within the repository
 * @param knownSha - Last known file SHA to compare against latest
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery or fetchQuery
 */
export function queryGitHubUpdateCheck(
    githubClient: IGitHubClient,
    owner: string,
    repo: string,
    path: string,
    knownSha: string,
    options?: Omit<UseQueryOptions<boolean, Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<boolean, Error> {
    return {
        queryKey: buildQueryGitHubUpdateCheckKey(owner, repo, path, knownSha),
        queryFn: () => githubClient.checkForUpdates(owner, repo, path, knownSha),
        staleTime: 60_000,
        ...options,
    };
}
