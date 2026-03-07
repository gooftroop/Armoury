# client.ts

GitHub API client with automatic retry logic, ETag-based caching, and rate limit handling.

**Source:** `src/shared/clients/github/client.ts`

---

## Exports

### `GitHubClient`

Class implementing `IGitHubClient` for interacting with community data repositories on GitHub. Provides automatic retry with exponential backoff, ETag-based conditional requests for efficient update checks, and rate limit handling.

```typescript
class GitHubClient implements IGitHubClient {
    constructor(config?: GitHubClientConfig);
    listFiles(owner: string, repo: string, path: string): Promise<GitHubFileInfo[]>;
    getFileSha(owner: string, repo: string, path: string): Promise<string>;
    downloadFile(owner: string, repo: string, path: string): Promise<string>;
    checkForUpdates(owner: string, repo: string, path: string, knownSha: string): Promise<boolean>;
}
```

#### Internal Caches

The client maintains two internal `Map` caches:

- **etagCache** (`Map<string, string>`) -- Maps request URLs to ETags received from GitHub. Used for conditional requests via the `If-None-Match` header, enabling 304 Not Modified responses that don't count against rate limits.
- **shaCache** (`Map<string, string>`) -- Maps request URLs to file SHA hashes. Used for quick update detection when the server returns a 304 response.

#### Retry Behavior

All public methods except `checkForUpdates` use an internal `fetchWithRetry` method that:

1. Attempts the request up to `MAX_RETRIES` (3) times.
2. On HTTP 429 (rate limit), waits for the duration specified by the `Retry-After` header or `x-ratelimit-reset`.
3. On network errors, applies exponential backoff: `BASE_DELAY_MS * 2^attempt`.
4. Caches ETags from successful responses for future conditional requests.
5. Throws `GitHubApiError` for HTTP errors, `RateLimitError` for rate limit exhaustion, and `NetworkError` for network failures.

---

#### `constructor(config?)`

Creates a new `GitHubClient` instance.

| Parameter          | Type                 | Required | Description                                                                                                        |
| ------------------ | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `config`           | `GitHubClientConfig` | No       | Configuration object.                                                                                              |
| `config.userAgent` | `string`             | No       | Custom User-Agent header. Defaults to `DEFAULT_USER_AGENT`.                                                        |
| `config.token`     | `string`             | No       | GitHub personal access token for authenticated requests. Increases rate limits from 60 to 5,000 requests per hour. |

---

#### `listFiles(owner, repo, path)`

Lists all files and directories in a GitHub repository path. Makes a GET request to the GitHub API contents endpoint and returns metadata for each item.

```typescript
async listFiles(owner: string, repo: string, path: string): Promise<GitHubFileInfo[]>;
```

| Parameter | Type     | Description                                                     |
| --------- | -------- | --------------------------------------------------------------- |
| `owner`   | `string` | Repository owner username or organization name.                 |
| `repo`    | `string` | Repository name.                                                |
| `path`    | `string` | Path within the repository (e.g., `"data/catalogues"` or `""`). |

**Returns:** `Promise<GitHubFileInfo[]>` -- Array of file/directory metadata objects.

**Throws:**

- `GitHubApiError` -- If the API returns an error or the response is not an array.
- `RateLimitError` -- If the GitHub API rate limit is exceeded.
- `NetworkError` -- If the request fails after all retries.

---

#### `getFileSha(owner, repo, path)`

Retrieves the SHA hash of a specific file. The SHA is cached internally for use in subsequent `checkForUpdates` calls.

```typescript
async getFileSha(owner: string, repo: string, path: string): Promise<string>;
```

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `owner`   | `string` | Repository owner username or organization name. |
| `repo`    | `string` | Repository name.                                |
| `path`    | `string` | Path to the file within the repository.         |

**Returns:** `Promise<string>` -- The file's SHA-1 hash (40-character hex string).

**Throws:**

- `GitHubApiError` -- If the path points to a directory instead of a file, or if the API returns an error.
- `RateLimitError` -- If the GitHub API rate limit is exceeded.
- `NetworkError` -- If the request fails after all retries.

---

#### `downloadFile(owner, repo, path)`

Downloads the raw content of a file from a GitHub repository. Fetches from the `raw.githubusercontent.com` CDN (not the API) for better performance. Assumes the file is on the `main` branch.

```typescript
async downloadFile(owner: string, repo: string, path: string): Promise<string>;
```

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `owner`   | `string` | Repository owner username or organization name. |
| `repo`    | `string` | Repository name.                                |
| `path`    | `string` | Path to the file within the repository.         |

**Returns:** `Promise<string>` -- The file's raw content as a string.

**Throws:**

- `RateLimitError` -- If the rate limit is exceeded.
- `NetworkError` -- If the request fails after all retries.

---

#### `checkForUpdates(owner, repo, path, knownSha)`

Checks if a file has been updated since the last known SHA. Uses ETag-based conditional requests (`If-None-Match` header) to minimize bandwidth. This method does **not** use `fetchWithRetry` to avoid retrying on 304 responses.

```typescript
async checkForUpdates(owner: string, repo: string, path: string, knownSha: string): Promise<boolean>;
```

| Parameter  | Type     | Description                                         |
| ---------- | -------- | --------------------------------------------------- |
| `owner`    | `string` | Repository owner username or organization name.     |
| `repo`     | `string` | Repository name.                                    |
| `path`     | `string` | Path to the file within the repository.             |
| `knownSha` | `string` | The SHA hash of the file from the last known state. |

**Returns:** `Promise<boolean>` -- `true` if the file has been updated (new SHA differs from `knownSha`), `false` otherwise.

**Update detection logic:**

1. If the server returns 304 Not Modified, compares the cached SHA against `knownSha`.
2. If the server returns 200 OK, extracts the new SHA from the response and compares it.
3. Caches both the ETag and SHA for future requests.

**Throws:**

- `GitHubApiError` -- If the API returns an error (other than 304).
- `RateLimitError` -- If the GitHub API rate limit is exceeded.
- `NetworkError` -- If the request fails.

---

### `createGitHubClient()`

Factory function to create a new `GitHubClient` instance. This is the recommended way to create clients instead of calling the constructor directly.

```typescript
function createGitHubClient(config?: GitHubClientConfig): GitHubClient;
```

| Parameter          | Type                 | Required | Description                                                 |
| ------------------ | -------------------- | -------- | ----------------------------------------------------------- |
| `config`           | `GitHubClientConfig` | No       | Configuration object.                                       |
| `config.userAgent` | `string`             | No       | Custom User-Agent header. Defaults to `DEFAULT_USER_AGENT`. |
| `config.token`     | `string`             | No       | GitHub personal access token for authenticated requests.    |

**Returns:** `GitHubClient` -- A new configured client instance.

---

## Usage Examples

### Basic usage with the factory function

```typescript
import { createGitHubClient } from '@armoury/shared';

const client = createGitHubClient();

// List all catalogue files in a community data repository
const files = await client.listFiles('BSDataProject', 'wh40k-10e', 'data/catalogues');

for (const file of files) {
    console.log(`${file.name} (${file.size} bytes)`);
}
```

### Authenticated client with token

```typescript
import { createGitHubClient } from '@armoury/shared';

const client = createGitHubClient({
    token: process.env.GITHUB_TOKEN,
});

// Download a catalogue file
const content = await client.downloadFile('BSDataProject', 'wh40k-10e', 'data/catalogues/astra-militarum.cat');
```

### Checking for updates with SHA comparison

```typescript
import { createGitHubClient } from '@armoury/shared';

const client = createGitHubClient({ token: process.env.GITHUB_TOKEN });

// Get the current SHA of a file
const sha = await client.getFileSha('BSDataProject', 'wh40k-10e', 'data/catalogues/astra-militarum.cat');

// Later, check if the file has changed
const hasUpdates = await client.checkForUpdates(
    'BSDataProject',
    'wh40k-10e',
    'data/catalogues/astra-militarum.cat',
    sha,
);

if (hasUpdates) {
    console.log('File has been updated, re-downloading...');
}
```

### Using the class directly with dependency injection

```typescript
import { GitHubClient } from '@armoury/shared';
import type { IGitHubClient } from '@armoury/shared';

function createService(client: IGitHubClient) {
    return {
        async getCatalogues() {
            return client.listFiles('BSDataProject', 'wh40k-10e', 'data/catalogues');
        },
    };
}

const client = new GitHubClient({ userAgent: 'MyApp/2.0' });
const service = createService(client);
```
