/**
 * GitHub API client types and error classes.
 */

/**
 * Metadata about a file or directory in a GitHub repository.
 *
 * Returned by listFiles() and represents a single item in a repository path.
 *
 * @property name - The file or directory name (without path)
 * @property path - The full path from the repository root
 * @property sha - The SHA-1 hash of the file content (40-character hex string). For directories, this is the tree SHA.
 * @property size - The size in bytes. For directories, this is 0.
 * @property download_url - Direct URL to download the raw file content. Null for directories.
 * @property type - Either 'file' for files or 'dir' for directories
 */
export interface GitHubFileInfo {
    name: string;
    path: string;
    sha: string;
    size: number;
    download_url: string | null;
    type: 'file' | 'dir';
}

/**
 * Interface for GitHub API client operations.
 *
 * Defines the contract for interacting with GitHub repositories to list files,
 * retrieve file metadata, download content, and check for updates.
 * All methods handle authentication, retries, rate limiting, and error handling internally.
 */
export interface IGitHubClient {
    /**
     * Lists all files and directories in a repository path.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path within the repository
     * @returns Promise resolving to array of file/directory metadata
     */
    listFiles(owner: string, repo: string, path: string): Promise<GitHubFileInfo[]>;

    /**
     * Retrieves the SHA hash of a specific file.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path to the file within the repository
     * @returns Promise resolving to the file's SHA hash
     */
    getFileSha(owner: string, repo: string, path: string): Promise<string>;

    /**
     * Downloads the raw content of a file.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path to the file within the repository
     * @returns Promise resolving to the file's raw content as a string
     */
    downloadFile(owner: string, repo: string, path: string): Promise<string>;

    /**
     * Checks if a file has been updated since the last known SHA.
     *
     * @param owner - Repository owner username or organization name
     * @param repo - Repository name
     * @param path - Path to the file within the repository
     * @param knownSha - The SHA hash of the file from the last known state
     * @returns Promise resolving to true if the file has been updated, false otherwise
     */
    checkForUpdates(owner: string, repo: string, path: string, knownSha: string): Promise<boolean>;
}

/**
 * Configuration options for GitHubClient.
 *
 * @property userAgent - Custom User-Agent header to send with requests. Defaults to DEFAULT_USER_AGENT if not provided.
 * @property token - Optional GitHub personal access token for authenticated requests. Increases API rate limits from 60 to 5000 requests per hour.
 */
export interface GitHubClientConfig {
    userAgent?: string;
    token?: string;
}

/**
 * Raw response from GitHub API contents endpoint.
 *
 * This is the internal type used by GitHubClient to parse API responses.
 * It has the same structure as GitHubFileInfo but is kept separate for API response handling.
 *
 * @property name - The file or directory name (without path)
 * @property path - The full path from the repository root
 * @property sha - The SHA-1 hash of the file content (40-character hex string)
 * @property size - The size in bytes
 * @property download_url - Direct URL to download the raw file content. Null for directories.
 * @property type - Either 'file' for files or 'dir' for directories
 */
export interface GitHubContentsResponse {
    name: string;
    path: string;
    sha: string;
    size: number;
    download_url: string | null;
    type: 'file' | 'dir';
}

/**
 * Error thrown when a GitHub API call fails.
 * Includes HTTP status code and endpoint information for debugging.
 * Thrown when fetching BattleScribe data files from GitHub repositories.
 */
export class GitHubApiError extends Error {
    /** HTTP status code returned by GitHub API (e.g., 404, 500) */
    readonly statusCode: number;
    /** GitHub API endpoint that failed (e.g., "/repos/owner/repo/contents/file.gst") */
    readonly endpoint: string;

    /**
     * Creates a new GitHubApiError.
     * @param message - Human-readable error description
     * @param statusCode - HTTP status code from the failed request
     * @param endpoint - GitHub API endpoint that was called
     */
    constructor(message: string, statusCode: number, endpoint: string) {
        super(message);
        this.name = 'GitHubApiError';
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        Object.setPrototypeOf(this, GitHubApiError.prototype);
    }
}

/**
 * Error thrown when GitHub API rate limit is exceeded.
 * Includes reset time and retry-after duration for implementing backoff strategies.
 * Thrown when too many requests are made to GitHub API within the rate limit window.
 */
export class RateLimitError extends Error {
    /** Timestamp when the rate limit will reset and requests can resume */
    readonly resetTime: Date;
    /** Seconds to wait before retrying (from GitHub's Retry-After header) */
    readonly retryAfter: number;

    /**
     * Creates a new RateLimitError.
     * @param message - Human-readable error description
     * @param resetTime - When the rate limit resets
     * @param retryAfter - Seconds to wait before retrying
     */
    constructor(message: string, resetTime: Date, retryAfter: number) {
        super(message);
        this.name = 'RateLimitError';
        this.resetTime = resetTime;
        this.retryAfter = retryAfter;
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * Error thrown when network operations fail.
 * Includes the underlying cause error for debugging connection issues.
 * Thrown when network requests fail due to connectivity problems, timeouts, etc.
 */
export class NetworkError extends Error {
    /** The underlying error that caused the network failure (if available) */
    override readonly cause: Error | undefined;

    /**
     * Creates a new NetworkError.
     * @param message - Human-readable error description
     * @param cause - Optional underlying error that caused the network failure
     */
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'NetworkError';
        this.cause = cause;
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}

/**
 * Type guard to narrow an unknown error to GitHubApiError.
 * @param error - The error to check
 * @returns True if error is a GitHubApiError instance
 */
export function isGitHubApiError(error: unknown): error is GitHubApiError {
    return error instanceof GitHubApiError;
}

/**
 * Type guard to narrow an unknown error to RateLimitError.
 * @param error - The error to check
 * @returns True if error is a RateLimitError instance
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
    return error instanceof RateLimitError;
}

/**
 * Type guard to narrow an unknown error to NetworkError.
 * @param error - The error to check
 * @returns True if error is a NetworkError instance
 */
export function isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
}
