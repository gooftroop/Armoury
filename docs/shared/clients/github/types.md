# types.ts

Type definitions and interfaces for the GitHub API client.

**Source:** `src/shared/clients/github/types.ts`

---

## Exports

### `GitHubClientConfig`

Configuration options for constructing a `GitHubClient` instance.

```typescript
interface GitHubClientConfig {
    userAgent?: string;
    token?: string;
}
```

**Properties:**

| Property    | Type     | Required | Description                                                                                                            |
| ----------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `userAgent` | `string` | No       | Custom User-Agent header to send with requests. Defaults to `DEFAULT_USER_AGENT` if not provided.                      |
| `token`     | `string` | No       | GitHub personal access token for authenticated requests. Increases API rate limits from 60 to 5,000 requests per hour. |

---

### `GitHubFileInfo`

Metadata about a file or directory in a GitHub repository. Returned by `GitHubClient.listFiles()`.

```typescript
interface GitHubFileInfo {
    name: string;
    path: string;
    sha: string;
    size: number;
    download_url: string | null;
    type: 'file' | 'dir';
}
```

**Properties:**

| Property       | Type              | Description                                                                                          |
| -------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `name`         | `string`          | The file or directory name without path (e.g., `"astra-militarum.cat"`).                             |
| `path`         | `string`          | The full path from the repository root (e.g., `"data/catalogues/astra-militarum.cat"`).              |
| `sha`          | `string`          | The SHA-1 hash of the file content (40-character hex string). For directories, this is the tree SHA. |
| `size`         | `number`          | The size in bytes. For directories, this is 0.                                                       |
| `download_url` | `string \| null`  | Direct URL to download the raw file content. `null` for directories.                                 |
| `type`         | `'file' \| 'dir'` | Whether this entry is a file or directory.                                                           |

---

### `GitHubContentsResponse`

Raw response structure from the GitHub API contents endpoint. Used internally by `GitHubClient` to parse API responses.

```typescript
interface GitHubContentsResponse {
    name: string;
    path: string;
    sha: string;
    size: number;
    download_url: string | null;
    type: 'file' | 'dir';
}
```

**Properties:**

| Property       | Type              | Description                                                          |
| -------------- | ----------------- | -------------------------------------------------------------------- |
| `name`         | `string`          | The file or directory name without path.                             |
| `path`         | `string`          | The full path from the repository root.                              |
| `sha`          | `string`          | The SHA-1 hash of the file content (40-character hex string).        |
| `size`         | `number`          | The size in bytes.                                                   |
| `download_url` | `string \| null`  | Direct URL to download the raw file content. `null` for directories. |
| `type`         | `'file' \| 'dir'` | Whether this entry is a file or directory.                           |

This interface has the same shape as `GitHubFileInfo` but is kept separate to distinguish between internal API response parsing and the public-facing return type.

---

### `IGitHubClient`

Interface defining the contract for GitHub API client operations. All methods handle authentication, retries, rate limiting, and error handling internally.

```typescript
interface IGitHubClient {
    listFiles(owner: string, repo: string, path: string): Promise<GitHubFileInfo[]>;
    getFileSha(owner: string, repo: string, path: string): Promise<string>;
    downloadFile(owner: string, repo: string, path: string): Promise<string>;
    checkForUpdates(owner: string, repo: string, path: string, knownSha: string): Promise<boolean>;
}
```

**Methods:**

#### `listFiles(owner, repo, path)`

Lists all files and directories in a repository path.

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `owner`   | `string` | Repository owner username or organization name. |
| `repo`    | `string` | Repository name.                                |
| `path`    | `string` | Path within the repository.                     |

**Returns:** `Promise<GitHubFileInfo[]>`

#### `getFileSha(owner, repo, path)`

Retrieves the SHA hash of a specific file.

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `owner`   | `string` | Repository owner username or organization name. |
| `repo`    | `string` | Repository name.                                |
| `path`    | `string` | Path to the file within the repository.         |

**Returns:** `Promise<string>`

#### `downloadFile(owner, repo, path)`

Downloads the raw content of a file.

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `owner`   | `string` | Repository owner username or organization name. |
| `repo`    | `string` | Repository name.                                |
| `path`    | `string` | Path to the file within the repository.         |

**Returns:** `Promise<string>`

#### `checkForUpdates(owner, repo, path, knownSha)`

Checks if a file has been updated since the last known SHA.

| Parameter  | Type     | Description                                         |
| ---------- | -------- | --------------------------------------------------- |
| `owner`    | `string` | Repository owner username or organization name.     |
| `repo`     | `string` | Repository name.                                    |
| `path`     | `string` | Path to the file within the repository.             |
| `knownSha` | `string` | The SHA hash of the file from the last known state. |

**Returns:** `Promise<boolean>`

---

## Usage Example

```typescript
import type { GitHubClientConfig, GitHubFileInfo, IGitHubClient } from '@armoury/shared';

// Use GitHubClientConfig to type configuration objects
const config: GitHubClientConfig = {
    userAgent: 'MyApp/1.0',
    token: process.env.GITHUB_TOKEN,
};

// Use IGitHubClient as an abstraction for dependency injection
function listCatalogues(client: IGitHubClient): Promise<GitHubFileInfo[]> {
    return client.listFiles('BSDataProject', 'wh40k-10e', 'data/catalogues');
}

// Use GitHubFileInfo to type results
async function printFiles(files: GitHubFileInfo[]): Promise<void> {
    for (const file of files) {
        if (file.type === 'file') {
            console.log(`${file.name} (${file.size} bytes) - SHA: ${file.sha}`);
        }
    }
}
```
