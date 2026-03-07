# config.ts

Configuration constants for the GitHub API client.

**Source:** `src/shared/clients/github/config.ts`

---

## Exports

### `GITHUB_API_BASE_URL`

Base URL for GitHub REST API v3 endpoints.

```typescript
const GITHUB_API_BASE_URL: string = 'https://api.github.com';
```

Used by `GitHubClient` to construct API request URLs for repository contents, file metadata, and update checks.

---

### `GITHUB_RAW_BASE_URL`

Base URL for raw file content from GitHub's CDN.

```typescript
const GITHUB_RAW_BASE_URL: string = 'https://raw.githubusercontent.com';
```

Used by `GitHubClient.downloadFile()` to fetch raw file content directly, bypassing the API for better performance.

---

### `DEFAULT_USER_AGENT`

Default User-Agent header sent with all GitHub API requests.

```typescript
const DEFAULT_USER_AGENT: string = 'Armoury-DataLayer/1.0';
```

Applied automatically when no custom `userAgent` is provided in `GitHubClientConfig`. GitHub requires a User-Agent header on all API requests.

---

### `MAX_RETRIES`

Maximum number of retry attempts for failed requests before throwing a `NetworkError`.

```typescript
const MAX_RETRIES: number = 3;
```

Used by the internal `fetchWithRetry` method. After exhausting all retry attempts, the client throws a `NetworkError` with the last encountered error as the cause.

---

### `BASE_DELAY_MS`

Base delay in milliseconds for exponential backoff between retry attempts.

```typescript
const BASE_DELAY_MS: number = 1000;
```

The actual delay for each retry is calculated as `BASE_DELAY_MS * 2^attempt`:

- Attempt 0 failure: 1000ms delay
- Attempt 1 failure: 2000ms delay
- Attempt 2: final attempt, no further retries

---

## Usage Example

```typescript
import {
    GITHUB_API_BASE_URL,
    GITHUB_RAW_BASE_URL,
    DEFAULT_USER_AGENT,
    MAX_RETRIES,
    BASE_DELAY_MS,
} from '@armoury/shared';

// Construct a GitHub API URL manually
const url = `${GITHUB_API_BASE_URL}/repos/BSDataProject/wh40k-10e/contents/data`;

// Construct a raw content URL
const rawUrl = `${GITHUB_RAW_BASE_URL}/BSDataProject/wh40k-10e/main/data/file.cat`;

// Reference retry configuration
console.log(`Retries: ${MAX_RETRIES}, Base delay: ${BASE_DELAY_MS}ms`);
console.log(`User-Agent: ${DEFAULT_USER_AGENT}`);
```
