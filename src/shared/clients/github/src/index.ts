/**
 * GitHub API client exports for BattleScribe data repositories.
 * Includes retry logic, caching, rate limit handling, and typed responses.
 */

export { GitHubClient, createGitHubClient } from '@/client.js';
export type { GitHubClientConfig, GitHubFileInfo, IGitHubClient } from '@/types.js';
export {
    GitHubApiError,
    RateLimitError,
    NetworkError,
    isGitHubApiError,
    isRateLimitError,
    isNetworkError,
} from '@/types.js';
export { GITHUB_API_BASE_URL, GITHUB_RAW_BASE_URL, DEFAULT_USER_AGENT, MAX_RETRIES, BASE_DELAY_MS } from '@/config.js';
export { createAuthHeaders } from '@/utils.js';
