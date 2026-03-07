# errors.ts

Error type hierarchy for the Armoury data layer, providing structured error classes and type guard functions for programmatic error handling.

**Source:** `src/shared/types/errors.ts`

## Overview

This file defines a hierarchy of error classes that represent different failure modes in the data layer. All errors extend `DataLayerError`, which itself extends the native `Error` class. Each error class includes contextual properties relevant to its failure mode (e.g., HTTP status codes for API errors, position info for XML parse errors). The file also provides type guard functions for narrowing `unknown` errors in catch blocks.

---

## Types

### `DataLayerErrorCode`

Union type of string literal error codes for programmatic error handling.

```typescript
type DataLayerErrorCode =
    | 'GITHUB_API_ERROR'
    | 'RATE_LIMIT_ERROR'
    | 'NETWORK_ERROR'
    | 'XML_PARSE_ERROR'
    | 'DATABASE_ERROR'
    | 'SYNC_ERROR'
    | 'VALIDATION_ERROR';
```

| Code                 | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `'GITHUB_API_ERROR'` | A GitHub API call returned an error response           |
| `'RATE_LIMIT_ERROR'` | GitHub API rate limit was exceeded                     |
| `'NETWORK_ERROR'`    | Network request failed (connectivity, timeout, etc.)   |
| `'XML_PARSE_ERROR'`  | Game data XML file has invalid or unexpected structure |
| `'DATABASE_ERROR'`   | A database operation (SQLite, IndexedDB, etc.) failed  |
| `'SYNC_ERROR'`       | File synchronization operation failed                  |
| `'VALIDATION_ERROR'` | Data validation failed                                 |

---

## Classes

### `DataLayerError`

Base error class for all data layer errors. All other error classes in this file extend it.

```typescript
class DataLayerError extends Error {
    readonly code: DataLayerErrorCode;
    constructor(message: string, code: DataLayerErrorCode);
}
```

| Property  | Type                 | Description                                               |
| --------- | -------------------- | --------------------------------------------------------- |
| `code`    | `DataLayerErrorCode` | Machine-readable error code for programmatic handling     |
| `message` | `string`             | Human-readable error description (inherited from `Error`) |
| `name`    | `string`             | Always `'DataLayerError'`                                 |

**Parameters:**

| Parameter | Type                 | Description                      |
| --------- | -------------------- | -------------------------------- |
| `message` | `string`             | Human-readable error description |
| `code`    | `DataLayerErrorCode` | Machine-readable error code      |

```typescript
import { DataLayerError, isDataLayerError } from '@armoury/shared';

try {
    await syncData();
} catch (error) {
    if (isDataLayerError(error)) {
        console.error(`Data layer error [${error.code}]: ${error.message}`);
    }
}
```

---

### `GitHubApiError`

Error thrown when a GitHub API call fails. Includes HTTP status code and endpoint information.

```typescript
class GitHubApiError extends DataLayerError {
    readonly statusCode: number;
    readonly endpoint: string;
    constructor(message: string, statusCode: number, endpoint: string);
}
```

| Property     | Type                 | Description                                              |
| ------------ | -------------------- | -------------------------------------------------------- |
| `statusCode` | `number`             | HTTP status code returned by GitHub API (e.g., 404, 500) |
| `endpoint`   | `string`             | GitHub API endpoint that failed                          |
| `code`       | `DataLayerErrorCode` | Always `'GITHUB_API_ERROR'`                              |

**Parameters:**

| Parameter    | Type     | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `message`    | `string` | Human-readable error description         |
| `statusCode` | `number` | HTTP status code from the failed request |
| `endpoint`   | `string` | GitHub API endpoint that was called      |

```typescript
import { GitHubApiError, isGitHubApiError } from '@armoury/shared';

try {
    await fetchCatalogueFile('necrons.cat');
} catch (error) {
    if (isGitHubApiError(error)) {
        if (error.statusCode === 404) {
            console.error(`File not found at ${error.endpoint}`);
        }
    }
}
```

---

### `RateLimitError`

Error thrown when GitHub API rate limit is exceeded. Includes reset time and retry-after duration for implementing backoff strategies.

```typescript
class RateLimitError extends DataLayerError {
    readonly resetTime: Date;
    readonly retryAfter: number;
    constructor(message: string, resetTime: Date, retryAfter: number);
}
```

| Property     | Type                 | Description                              |
| ------------ | -------------------- | ---------------------------------------- |
| `resetTime`  | `Date`               | Timestamp when the rate limit will reset |
| `retryAfter` | `number`             | Seconds to wait before retrying          |
| `code`       | `DataLayerErrorCode` | Always `'RATE_LIMIT_ERROR'`              |

**Parameters:**

| Parameter    | Type     | Description                      |
| ------------ | -------- | -------------------------------- |
| `message`    | `string` | Human-readable error description |
| `resetTime`  | `Date`   | When the rate limit resets       |
| `retryAfter` | `number` | Seconds to wait before retrying  |

```typescript
import { isRateLimitError } from '@armoury/shared';

try {
    await syncFromGitHub();
} catch (error) {
    if (isRateLimitError(error)) {
        console.log(`Rate limited. Retry after ${error.retryAfter}s`);
        console.log(`Resets at: ${error.resetTime.toISOString()}`);
    }
}
```

---

### `NetworkError`

Error thrown when network operations fail due to connectivity problems, timeouts, or other transport-level issues.

```typescript
class NetworkError extends DataLayerError {
    readonly cause: Error | undefined;
    constructor(message: string, cause?: Error);
}
```

| Property | Type                 | Description                                          |
| -------- | -------------------- | ---------------------------------------------------- |
| `cause`  | `Error \| undefined` | The underlying error that caused the network failure |
| `code`   | `DataLayerErrorCode` | Always `'NETWORK_ERROR'`                             |

**Parameters:**

| Parameter | Type               | Description                              |
| --------- | ------------------ | ---------------------------------------- |
| `message` | `string`           | Human-readable error description         |
| `cause`   | `Error` (optional) | Underlying error that caused the failure |

```typescript
import { NetworkError, isNetworkError } from '@armoury/shared';

try {
    await fetchData();
} catch (error) {
    if (isNetworkError(error)) {
        console.error('Network failure:', error.message);
        if (error.cause) {
            console.error('Caused by:', error.cause.message);
        }
    }
}
```

---

### `XmlParseError`

Error thrown when parsing game data XML files fails. Includes optional position and context information.

```typescript
class XmlParseError extends DataLayerError {
    readonly position?: { line: number; column: number };
    readonly context?: string;
    constructor(message: string, position?: { line: number; column: number }, context?: string);
}
```

| Property   | Type                                          | Description                                        |
| ---------- | --------------------------------------------- | -------------------------------------------------- |
| `position` | `{ line: number; column: number }` (optional) | Line and column where the parse error occurred     |
| `context`  | `string` (optional)                           | Surrounding XML context to help identify the error |
| `code`     | `DataLayerErrorCode`                          | Always `'XML_PARSE_ERROR'`                         |

**Parameters:**

| Parameter  | Type                                          | Description                           |
| ---------- | --------------------------------------------- | ------------------------------------- |
| `message`  | `string`                                      | Human-readable error description      |
| `position` | `{ line: number; column: number }` (optional) | Location of the error in the XML file |
| `context`  | `string` (optional)                           | XML context around the error          |

```typescript
import { isXmlParseError } from '@armoury/shared';

try {
    const data = await parseCatalogue(xmlContent);
} catch (error) {
    if (isXmlParseError(error)) {
        if (error.position) {
            console.error(`Parse error at line ${error.position.line}, col ${error.position.column}`);
        }
        if (error.context) {
            console.error('Context:', error.context);
        }
    }
}
```

---

### `DatabaseError`

Error thrown when database operations fail (SQLite, IndexedDB, or other backends).

```typescript
class DatabaseError extends DataLayerError {
    readonly operation: string;
    constructor(message: string, operation: string);
}
```

| Property    | Type                 | Description                                                                           |
| ----------- | -------------------- | ------------------------------------------------------------------------------------- |
| `operation` | `string`             | Name of the database operation that failed (e.g., `"INSERT"`, `"SELECT"`, `"UPDATE"`) |
| `code`      | `DataLayerErrorCode` | Always `'DATABASE_ERROR'`                                                             |

**Parameters:**

| Parameter   | Type     | Description                                |
| ----------- | -------- | ------------------------------------------ |
| `message`   | `string` | Human-readable error description           |
| `operation` | `string` | Name of the database operation that failed |

```typescript
import { isDatabaseError } from '@armoury/shared';

try {
    await adapter.saveUnit(unit);
} catch (error) {
    if (isDatabaseError(error)) {
        console.error(`Database ${error.operation} failed: ${error.message}`);
    }
}
```

---

## Type Guard Functions

All type guard functions accept an `unknown` value and return a boolean type predicate, making them safe to use in catch blocks.

### `isDataLayerError`

Narrows an unknown error to `DataLayerError`.

```typescript
function isDataLayerError(error: unknown): error is DataLayerError;
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `error`   | `unknown` | The error to check |

**Returns:** `true` if `error` is an instance of `DataLayerError`.

---

### `isGitHubApiError`

Narrows an unknown error to `GitHubApiError`.

```typescript
function isGitHubApiError(error: unknown): error is GitHubApiError;
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `error`   | `unknown` | The error to check |

**Returns:** `true` if `error` is an instance of `GitHubApiError`.

---

### `isRateLimitError`

Narrows an unknown error to `RateLimitError`.

```typescript
function isRateLimitError(error: unknown): error is RateLimitError;
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `error`   | `unknown` | The error to check |

**Returns:** `true` if `error` is an instance of `RateLimitError`.

---

### `isNetworkError`

Narrows an unknown error to `NetworkError`.

```typescript
function isNetworkError(error: unknown): error is NetworkError;
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `error`   | `unknown` | The error to check |

**Returns:** `true` if `error` is an instance of `NetworkError`.

---

### `isXmlParseError`

Narrows an unknown error to `XmlParseError`.

```typescript
function isXmlParseError(error: unknown): error is XmlParseError;
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `error`   | `unknown` | The error to check |

**Returns:** `true` if `error` is an instance of `XmlParseError`.

---

### `isDatabaseError`

Narrows an unknown error to `DatabaseError`.

```typescript
function isDatabaseError(error: unknown): error is DatabaseError;
```

| Parameter | Type      | Description        |
| --------- | --------- | ------------------ |
| `error`   | `unknown` | The error to check |

**Returns:** `true` if `error` is an instance of `DatabaseError`.

---

## Usage Example: Error Handling Pattern

A common pattern for handling data layer errors with cascading type guards:

```typescript
import {
    isRateLimitError,
    isGitHubApiError,
    isNetworkError,
    isXmlParseError,
    isDatabaseError,
    isDataLayerError,
} from '@armoury/shared';

try {
    await syncAllData();
} catch (error) {
    if (isRateLimitError(error)) {
        scheduleRetry(error.retryAfter);
    } else if (isGitHubApiError(error)) {
        logApiFailure(error.statusCode, error.endpoint);
    } else if (isNetworkError(error)) {
        showOfflineMessage();
    } else if (isXmlParseError(error)) {
        reportCorruptFile(error.position, error.context);
    } else if (isDatabaseError(error)) {
        handleDbFailure(error.operation);
    } else if (isDataLayerError(error)) {
        logGenericDataError(error.code, error.message);
    } else {
        throw error;
    }
}
```
