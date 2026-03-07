# utils.ts

Utility functions for constructing HTTP headers for GitHub API requests.

**Source:** `src/shared/clients/github/utils.ts`

---

## Exports

### `createAuthHeaders()`

Creates HTTP headers for GitHub API requests. Constructs a `HeadersInit` object with the appropriate `User-Agent`, `Accept`, and `Authorization` headers based on the provided arguments.

```typescript
function createAuthHeaders(userAgent: string, token?: string, isApi?: boolean): HeadersInit;
```

**Parameters:**

| Parameter   | Type      | Default     | Description                                                                                                        |
| ----------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `userAgent` | `string`  | --          | The User-Agent string to send with the request (e.g., `'Armoury-DataLayer/1.0'`). Required by the GitHub API.      |
| `token`     | `string`  | `undefined` | Optional GitHub personal access token. If provided, adds a `Bearer` token `Authorization` header.                  |
| `isApi`     | `boolean` | `true`      | Whether this is an API request or a raw content request. If `true`, adds `Accept: application/vnd.github.v3+json`. |

**Returns:** `HeadersInit` -- an object ready to pass to `fetch()` options.

**Header construction logic:**

- `User-Agent` is always included.
- `Accept: application/vnd.github.v3+json` is included only when `isApi` is `true`. Omitted for raw content downloads from `raw.githubusercontent.com`.
- `Authorization: Bearer <token>` is included only when `token` is provided.

**Resulting headers by scenario:**

| Scenario                        | Headers                                 |
| ------------------------------- | --------------------------------------- |
| API request, no token           | `User-Agent`, `Accept`                  |
| API request, with token         | `User-Agent`, `Accept`, `Authorization` |
| Raw content request, no token   | `User-Agent`                            |
| Raw content request, with token | `User-Agent`, `Authorization`           |

---

## Usage Example

```typescript
import { createAuthHeaders } from '@armoury/shared';

// Headers for an authenticated API request
const apiHeaders = createAuthHeaders('MyApp/1.0', 'ghp_xxxxxxxxxxxx', true);
// Result: { 'User-Agent': 'MyApp/1.0', 'Accept': 'application/vnd.github.v3+json', 'Authorization': 'Bearer ghp_xxxxxxxxxxxx' }

// Headers for a raw file download without authentication
const rawHeaders = createAuthHeaders('MyApp/1.0', undefined, false);
// Result: { 'User-Agent': 'MyApp/1.0' }

// Use with fetch directly
const response = await fetch('https://api.github.com/repos/owner/repo/contents/path', {
    headers: createAuthHeaders('MyApp/1.0', process.env.GITHUB_TOKEN),
});
```
