# response.ts

Utility functions for building standardized API Gateway JSON responses.

**Source:** `src/services/campaigns/src/utils/response.ts`

---

## Exports

### `jsonResponse()`

Builds a standard JSON response with a `Content-Type: application/json` header and a JSON-serialized body.

```typescript
function jsonResponse(statusCode: number, payload: unknown): ApiResponse;
```

**Parameters:**

| Parameter    | Type      | Description                                          |
| ------------ | --------- | ---------------------------------------------------- |
| `statusCode` | `number`  | HTTP status code (e.g., 200, 201, 404)               |
| `payload`    | `unknown` | Response body payload, serialized via JSON.stringify |

**Returns:** `ApiResponse` -- an object with `statusCode`, `headers`, and `body` fields ready for API Gateway.

---

### `errorResponse()`

Builds a JSON error response containing `error` and `message` fields in the body.

```typescript
function errorResponse(statusCode: number, error: string, message: string): ApiResponse;
```

**Parameters:**

| Parameter    | Type     | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `statusCode` | `number` | HTTP status code (e.g., 400, 404, 500)     |
| `error`      | `string` | Short error identifier (e.g., 'Not Found') |
| `message`    | `string` | Human-readable error description           |

**Returns:** `ApiResponse` -- an object with `statusCode`, `headers`, and a JSON body containing `{ error, message }`.

---

## Usage Example

```typescript
import { jsonResponse, errorResponse } from '@campaigns/src/utils/response.js';

// Success response with a campaign entity
const success = jsonResponse(200, { id: 'abc-123', name: 'My Campaign' });
// { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '{"id":"abc-123","name":"My Campaign"}' }

// Error response for a missing resource
const notFound = errorResponse(404, 'Not Found', 'Campaign with id abc-123 does not exist');
// { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: '{"error":"Not Found","message":"Campaign with id abc-123 does not exist"}' }
```
