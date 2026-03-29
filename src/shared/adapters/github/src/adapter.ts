import type { QueryClient } from '@tanstack/react-query';
import type { IGitHubClient, GitHubFileInfo, GitHubClientConfig } from '@armoury/clients-github';
import {
    GitHubClient,
    queryGitHubFile,
    queryGitHubFileSha,
    queryGitHubUpdateCheck,
    queryGitHubFiles,
} from '@armoury/clients-github';

/**
 * @requirements
 * - Wrap raw GitHubClient in a non-transient adapter using React Query for caching.
 * - Implement IGitHubClient so consumers (e.g. BSDataBaseDAO) use it transparently.
 * - Deduplicate concurrent requests via QueryClient.
 */

/**
 * Non-transient adapter for GitHub API access that uses React Query for
 * request deduplication and caching.
 *
 * Wraps the raw `GitHubClient` behind the `IGitHubClient` interface so that
 * consumers (e.g. `BSDataBaseDAO`, `FactionDAO`) can use it as a drop-in
 * replacement while benefiting from QueryClient-level caching.
 */
export class GitHubAdapter implements IGitHubClient {
    private readonly queryClient: QueryClient;
    private readonly client: GitHubClient;

    /**
     * Creates a GitHubAdapter.
     *
     * @param queryClient - React Query client for request deduplication and caching.
     * @param config - Optional GitHub client configuration (userAgent, token).
     */
    constructor(queryClient: QueryClient, config?: GitHubClientConfig) {
        this.queryClient = queryClient;
        this.client = new GitHubClient(config);
    }

    /**
     * Lists all files and directories in a repository path.
     *
     * Uses React Query's `fetchQuery` for request deduplication and caching.
     */
    async listFiles(owner: string, repo: string, path: string): Promise<GitHubFileInfo[]> {
        return this.queryClient.fetchQuery(queryGitHubFiles(this.client, owner, repo, path));
    }

    /**
     * Retrieves the SHA hash of a specific file.
     *
     * Uses React Query's `fetchQuery` for request deduplication and caching.
     */
    async getFileSha(owner: string, repo: string, path: string): Promise<string> {
        return this.queryClient.fetchQuery(queryGitHubFileSha(this.client, owner, repo, path));
    }

    /**
     * Downloads the raw content of a file.
     *
     * Uses React Query's `fetchQuery` for request deduplication and caching.
     */
    async downloadFile(owner: string, repo: string, path: string): Promise<string> {
        return this.queryClient.fetchQuery(queryGitHubFile(this.client, owner, repo, path));
    }

    /**
     * Checks if a file has been updated since the last known SHA.
     *
     * Uses React Query's `fetchQuery` for request deduplication and caching.
     */
    async checkForUpdates(owner: string, repo: string, path: string, knownSha: string): Promise<boolean> {
        return this.queryClient.fetchQuery(queryGitHubUpdateCheck(this.client, owner, repo, path, knownSha));
    }
}

/**
 * Creates a GitHubAdapter backed by the given React Query client.
 *
 * @param queryClient - React Query client for request deduplication and caching.
 * @param config - Optional GitHub client configuration.
 * @returns A new GitHubAdapter instance.
 */
export function createGitHubClient(queryClient: QueryClient, config?: GitHubClientConfig): GitHubAdapter {
    return new GitHubAdapter(queryClient, config);
}
