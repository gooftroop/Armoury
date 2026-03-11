/**
 * GitHub API client exports for BattleScribe data repositories.
 * Includes retry logic, caching, rate limit handling, and typed responses.
 */

export { GitHubClient, createGitHubClient } from './client.ts';
export type { GitHubClientConfig, GitHubFileInfo, IGitHubClient } from './types.ts';
export { GitHubApiError, RateLimitError, NetworkError, isGitHubApiError, isRateLimitError, isNetworkError } from './types.ts';
export { GITHUB_API_BASE_URL, GITHUB_RAW_BASE_URL, DEFAULT_USER_AGENT, MAX_RETRIES, BASE_DELAY_MS } from './config.ts';
export { createAuthHeaders } from './utils.ts';
