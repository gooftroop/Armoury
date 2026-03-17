import type { UseQueryOptions } from '@tanstack/react-query';
import type { IGitHubClient, GitHubFileInfo } from '@/types.js';
import { buildQueryGitHubFilesKey } from '@/queries/buildQueryGitHubKeys.js';

/**
 * @requirements
 * 1. Must accept IGitHubClient interface (not concrete class) as first parameter.
 * 2. Must return UseQueryOptions compatible with useQuery/fetchQuery.
 * 3. Must use buildQueryGitHubFilesKey for the query key.
 */

/**
 * Builds React Query options for listing files in a GitHub repository path.
 *
 * @param githubClient - GitHub client instance implementing IGitHubClient
 * @param owner - Repository owner username or organization
 * @param repo - Repository name
 * @param path - Path within the repository
 * @param options - Optional React Query configuration (excluding queryKey and queryFn)
 * @returns Query options object ready for use with useQuery or fetchQuery
 */
export function queryGitHubFiles(
    githubClient: IGitHubClient,
    owner: string,
    repo: string,
    path: string,
    options?: Omit<UseQueryOptions<GitHubFileInfo[], Error>, 'queryKey' | 'queryFn'>,
): UseQueryOptions<GitHubFileInfo[], Error> {
    return {
        queryKey: buildQueryGitHubFilesKey(owner, repo, path),
        queryFn: () => githubClient.listFiles(owner, repo, path),
        staleTime: 300_000,
        ...options,
    };
}
