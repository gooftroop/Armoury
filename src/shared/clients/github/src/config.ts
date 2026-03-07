/** Base URL for GitHub REST API v3 endpoints. */
export const GITHUB_API_BASE_URL = 'https://api.github.com';

/** Base URL for raw file content from GitHub's CDN (raw.githubusercontent.com). */
export const GITHUB_RAW_BASE_URL = 'https://raw.githubusercontent.com';

/** Default User-Agent header sent with all GitHub API requests. */
export const DEFAULT_USER_AGENT = 'Armoury-DataLayer/1.0';

/** Maximum number of retry attempts for failed requests before throwing NetworkError. */
export const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff: actual delay = BASE_DELAY_MS * 2^attempt. */
export const BASE_DELAY_MS = 1000;
