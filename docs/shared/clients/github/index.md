# index.ts

Public API barrel file for the GitHub client module.

**Source:** `src/shared/clients/github/index.ts`

---

## Overview

This module provides a complete client for interacting with GitHub repositories containing community data files. It includes automatic retry logic, ETag-based caching, rate limit handling, and error management.

All exports from this module are re-exported by `@armoury/shared`, so consumers should import directly from the package root.

---

## Re-exported Members

### From `client.ts`

| Export               | Kind     | Description                                                           |
| -------------------- | -------- | --------------------------------------------------------------------- |
| `GitHubClient`       | Class    | GitHub API client with retry logic, caching, and rate limit handling. |
| `createGitHubClient` | Function | Factory function to create a configured `GitHubClient` instance.      |

### From `types.ts`

| Export               | Kind                  | Description                                                |
| -------------------- | --------------------- | ---------------------------------------------------------- |
| `GitHubClientConfig` | Interface (type-only) | Configuration options for `GitHubClient`.                  |
| `GitHubFileInfo`     | Interface (type-only) | Metadata about a file or directory in a GitHub repository. |
| `IGitHubClient`      | Interface (type-only) | Contract for GitHub API client operations.                 |

### From `config.ts`

| Export                | Kind     | Description                                                              |
| --------------------- | -------- | ------------------------------------------------------------------------ |
| `GITHUB_API_BASE_URL` | Constant | Base URL for GitHub REST API v3 (`https://api.github.com`).              |
| `GITHUB_RAW_BASE_URL` | Constant | Base URL for raw file content CDN (`https://raw.githubusercontent.com`). |
| `DEFAULT_USER_AGENT`  | Constant | Default User-Agent header (`'Armoury-DataLayer/1.0'`).                   |
| `MAX_RETRIES`         | Constant | Maximum retry attempts for failed requests (3).                          |
| `BASE_DELAY_MS`       | Constant | Base delay in milliseconds for exponential backoff (1000).               |

### From `utils.ts`

| Export              | Kind     | Description                                   |
| ------------------- | -------- | --------------------------------------------- |
| `createAuthHeaders` | Function | Creates HTTP headers for GitHub API requests. |

---

## Usage Example

```typescript
import { createGitHubClient, GITHUB_API_BASE_URL, DEFAULT_USER_AGENT } from '@armoury/shared';
import type { GitHubFileInfo, IGitHubClient } from '@armoury/shared';

// Create a client using the factory function
const client = createGitHubClient({ token: process.env.GITHUB_TOKEN });

// List catalogue files
const files: GitHubFileInfo[] = await client.listFiles('BSDataProject', 'wh40k-10e', 'data/catalogues');

// Download a specific file
const content = await client.downloadFile('BSDataProject', 'wh40k-10e', files[0].path);

// Check for updates using a known SHA
const updated = await client.checkForUpdates('BSDataProject', 'wh40k-10e', files[0].path, files[0].sha);
```
