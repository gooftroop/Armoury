import { GitHubApiError, RateLimitError, NetworkError } from '@/types.js';
import { GITHUB_API_BASE_URL, GITHUB_RAW_BASE_URL, DEFAULT_USER_AGENT, MAX_RETRIES, BASE_DELAY_MS } from '@/config.js';
import type { GitHubClientConfig, GitHubFileInfo, GitHubContentsResponse, IGitHubClient } from '@/types.js';
import { createAuthHeaders } from '@/utils.js';

/**
 * GitHub API client for interacting with BattleScribe data repositories.
 *
 * Implements automatic retry logic with exponential backoff, ETag-based caching for efficient
 * update checks, and rate limit handling. The client maintains two caches:
 * - etagCache: Maps URLs to ETags for conditional requests (304 Not Modified)
 * - shaCache: Maps URLs to file SHAs for quick update detection without full API calls
 *
 * All public methods use fetchWithRetry internally, which:
 * 1. Attempts the request up to MAX_RETRIES times
 * 2. On 429 (rate limit), waits for Retry-After header or x-ratelimit-reset
 * 3. On network errors, applies exponential backoff: BASE_DELAY_MS * 2^attempt
 * 4. Caches ETags from successful responses for future conditional requests
 * 5. Throws GitHubApiError for HTTP errors, RateLimitError for rate limits, NetworkError for network failures
 */
export class GitHubClient implements IGitHubClient {
    private readonly userAgent: string;
    private readonly token?: string;
    /** Base URL for GitHub REST API v3 endpoints. Overridable for proxy routing. */
    private readonly apiBaseUrl: string;
    /** Base URL for raw file content CDN. Overridable for proxy routing. */
    private readonly rawBaseUrl: string;
    private readonly etagCache = new Map<string, string>();
    private readonly shaCache = new Map<string, string>();

    /**
     * Creates a new GitHubClient instance.
     *
     * @param config - Optional configuration object
     * @param config.userAgent - Custom User-Agent header (defaults to DEFAULT_USER_AGENT)
     * @param config.token - Optional GitHub personal access token for authenticated requests (increases rate limits)
     * @param config.apiBaseUrl - Override the GitHub REST API base URL (defaults to GITHUB_API_BASE_URL)
     * @param config.rawBaseUrl - Override the raw content CDN base URL (defaults to GITHUB_RAW_BASE_URL)
     */
    constructor(config?: GitHubClientConfig) {
        this.userAgent = config?.userAgent ?? DEFAULT_USER_AGENT;
        this.token = config?.token;
        this.apiBaseUrl = config?.apiBaseUrl ?? GITHUB_API_BASE_URL;
        this.rawBaseUrl = config?.rawBaseUrl ?? GITHUB_RAW_BASE_URL;
    }

    /**
     * Lists all files and directories in a GitHub repository path.
     *
     * Makes a GET request to the GitHub API contents endpoint and returns metadata for each item.
     * Uses fetchWithRetry internally, so it automatically retries on network errors and handles rate limits.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path within the repository (e.g., "data/catalogues" or "")
     * @returns Promise resolving to array of GitHubFileInfo objects with name, path, sha, size, download_url, and type
     * @throws GitHubApiError if the API returns an error or response is not an array
     * @throws RateLimitError if GitHub API rate limit is exceeded
     * @throws NetworkError if the request fails after all retries
     */
    async listFiles(owner: string, repo: string, path: string): Promise<GitHubFileInfo[]> {
        const url = `${this.apiBaseUrl}/repos/${owner}/${repo}/contents/${path}`;
        const response = await this.fetchWithRetry(url);
        const data = (await response.json()) as GitHubContentsResponse[];

        if (!Array.isArray(data)) {
            throw new GitHubApiError('Expected array of files', 200, url);
        }

        return data.map((item) => ({
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size,
            download_url: item.download_url,
            type: item.type,
        }));
    }

    /**
     * Retrieves the SHA hash of a specific file in a GitHub repository.
     *
     * Makes a GET request to the GitHub API contents endpoint for a single file.
     * The SHA is cached internally for use in update checks. Uses fetchWithRetry internally.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path to the file within the repository
     * @returns Promise resolving to the file's SHA hash (40-character hex string)
     * @throws GitHubApiError if the path points to a directory instead of a file, or if API returns an error
     * @throws RateLimitError if GitHub API rate limit is exceeded
     * @throws NetworkError if the request fails after all retries
     */
    async getFileSha(owner: string, repo: string, path: string): Promise<string> {
        const url = `${this.apiBaseUrl}/repos/${owner}/${repo}/contents/${path}`;
        const response = await this.fetchWithRetry(url);
        const data = (await response.json()) as GitHubContentsResponse;

        if (Array.isArray(data)) {
            throw new GitHubApiError('Expected file, got directory', 200, url);
        }

        this.shaCache.set(url, data.sha);

        return data.sha;
    }

    /**
     * Downloads the raw content of a file from a GitHub repository.
     *
     * Fetches the file from the raw.githubusercontent.com CDN (not the API) for better performance.
     * Assumes the file is on the 'main' branch. Uses fetchWithRetry internally with isApi=false
     * to skip API-specific headers. Returns the file content as a string.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path to the file within the repository
     * @returns Promise resolving to the file's raw content as a string
     * @throws RateLimitError if rate limit is exceeded
     * @throws NetworkError if the request fails after all retries
     */
    async downloadFile(owner: string, repo: string, path: string): Promise<string> {
        const url = `${this.rawBaseUrl}/${owner}/${repo}/main/${path}`;
        const response = await this.fetchWithRetry(url, false);

        return response.text();
    }

    /**
     * Checks if a file has been updated since the last known SHA.
     *
     * Uses ETag-based conditional requests (If-None-Match header) to minimize bandwidth.
     * If the server returns 304 Not Modified, compares the cached SHA against knownSha.
     * If the server returns 200 OK, fetches the new SHA and compares it.
     * Caches both the ETag and SHA for future requests.
     *
     * This method does NOT use fetchWithRetry to avoid retrying on 304 responses.
     * It handles rate limits directly and throws on errors.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path to the file within the repository
     * @param knownSha - The SHA hash of the file from the last known state
     * @returns Promise resolving to true if the file has been updated (new SHA differs from knownSha), false otherwise
     * @throws GitHubApiError if the API returns an error (other than 304)
     * @throws RateLimitError if GitHub API rate limit is exceeded
     * @throws NetworkError if the request fails
     */
    async checkForUpdates(owner: string, repo: string, path: string, knownSha: string): Promise<boolean> {
        const url = `${this.apiBaseUrl}/repos/${owner}/${repo}/contents/${path}`;
        const cachedEtag = this.etagCache.get(url);

        const headers = createAuthHeaders(this.userAgent, this.token, true);

        if (cachedEtag) {
            (headers as Record<string, string>)['If-None-Match'] = cachedEtag;
        }

        try {
            const response = await fetch(url, { headers });

            if (response.status === 304) {
                const cachedSha = this.shaCache.get(url);

                if (cachedSha) {
                    return cachedSha !== knownSha;
                }

                return false;
            }

            await this.handleRateLimit(response);

            if (!response.ok) {
                throw new GitHubApiError(`GitHub API error: ${response.statusText}`, response.status, url);
            }

            const etag = response.headers.get('etag');

            if (etag) {
                this.etagCache.set(url, etag);
            }

            const data = (await response.json()) as GitHubContentsResponse;
            this.shaCache.set(url, data.sha);

            return data.sha !== knownSha;
        } catch (error) {
            if (error instanceof GitHubApiError || error instanceof RateLimitError) {
                throw error;
            }

            throw new NetworkError('Failed to check for updates', error instanceof Error ? error : undefined);
        }
    }

    /**
     * Retrieves the date of the most recent commit that modified a file.
     * Uses the GitHub Commits API with path filter to get only commits affecting the specified file.
     * Returns the committer date of the most recent commit as an ISO 8601 string.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path to the file within the repository
     * @returns Promise resolving to the ISO 8601 date string of the last commit that modified this file
     * @throws GitHubApiError if the API returns an error or no commits are found for the path
     * @throws RateLimitError if GitHub API rate limit is exceeded
     * @throws NetworkError if the request fails after all retries
     */
    async getFileLastCommitDate(owner: string, repo: string, path: string): Promise<string> {
        const url = `${this.apiBaseUrl}/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`;
        const response = await this.fetchWithRetry(url);
        const data = (await response.json()) as Array<{ commit: { committer: { date: string } } }>;

        if (!Array.isArray(data) || data.length === 0) {
            throw new GitHubApiError('No commits found for path', 200, url);
        }

        return data[0].commit.committer.date;
    }

    private async fetchWithRetry(url: string, isApi = true): Promise<Response> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const headers = createAuthHeaders(this.userAgent, this.token, isApi);
                const response = await fetch(url, { headers });

                if (response.status === 429) {
                    const retryAfter = this.getRetryAfter(response);

                    if (attempt < MAX_RETRIES - 1) {
                        await this.delay(retryAfter * 1000);
                        continue;
                    }

                    throw this.createRateLimitError(response);
                }

                await this.handleRateLimit(response);

                if (!response.ok) {
                    throw new GitHubApiError(`GitHub API error: ${response.statusText}`, response.status, url);
                }

                const etag = response.headers.get('etag');

                if (etag) {
                    this.etagCache.set(url, etag);
                }

                return response;
            } catch (error) {
                if (error instanceof GitHubApiError || error instanceof RateLimitError) {
                    throw error;
                }

                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < MAX_RETRIES - 1) {
                    const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt);
                    await this.delay(backoffMs);
                }
            }
        }

        throw new NetworkError('Request failed after retries', lastError);
    }

    private async handleRateLimit(response: Response): Promise<void> {
        const remaining = response.headers.get('x-ratelimit-remaining');

        if (remaining === '0') {
            throw this.createRateLimitError(response);
        }
    }

    private createRateLimitError(response: Response): RateLimitError {
        const resetTimestamp = response.headers.get('x-ratelimit-reset');
        const retryAfter = this.getRetryAfter(response);

        const resetTime = resetTimestamp
            ? new Date(parseInt(resetTimestamp, 10) * 1000)
            : new Date(Date.now() + retryAfter * 1000);

        return new RateLimitError('GitHub API rate limit exceeded', resetTime, retryAfter);
    }

    private getRetryAfter(response: Response): number {
        const retryAfter = response.headers.get('retry-after');

        if (retryAfter) {
            return parseInt(retryAfter, 10);
        }

        const resetTimestamp = response.headers.get('x-ratelimit-reset');

        if (resetTimestamp) {
            const resetTime = parseInt(resetTimestamp, 10) * 1000;

            return Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
        }

        return 60;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Factory function to create a new GitHubClient instance.
 *
 * Provides a convenient way to instantiate a GitHubClient with optional configuration.
 * This is the recommended way to create clients instead of calling the constructor directly.
 *
 * @param config - Optional configuration object
 * @param config.userAgent - Custom User-Agent header (defaults to DEFAULT_USER_AGENT)
 * @param config.token - Optional GitHub personal access token for authenticated requests
 * @returns A new GitHubClient instance configured with the provided options
 */
export function createGitHubClient(config?: GitHubClientConfig): GitHubClient {
    return new GitHubClient(config);
}
