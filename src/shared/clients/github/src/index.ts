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

// === Query Key Builders ===
export {
    buildQueryGitHubFilesKey,
    buildQueryGitHubFileShaKey,
    buildQueryGitHubFileKey,
    buildQueryGitHubUpdateCheckKey,
    buildQueryGitHubFileLastCommitDateKey,
} from '@/queries/buildQueryGitHubKeys.js';

// === Query Options Builders ===
export { queryGitHubFiles } from '@/queries/queryGitHubFiles.js';
export { queryGitHubFileSha } from '@/queries/queryGitHubFileSha.js';
export { queryGitHubFile } from '@/queries/queryGitHubFile.js';
export { queryGitHubUpdateCheck } from '@/queries/queryGitHubUpdateCheck.js';
export { queryGitHubFileLastCommitDate } from '@/queries/queryGitHubFileLastCommitDate.js';
