# middleware/error-handler.ts

Formats caught errors into standardized API Gateway proxy responses with appropriate HTTP status codes and JSON error bodies.

## Exports

| Export                | Type       | Description                                                          |
| --------------------- | ---------- | -------------------------------------------------------------------- |
| `formatErrorResponse` | `function` | Converts an Error into an ApiResponse with status code and JSON body |

## Error Mapping

| Error Name        | HTTP Status | Response Error Type |
| ----------------- | ----------- | ------------------- |
| `ValidationError` | 400         | `ValidationError`   |
| `DatabaseError`   | 500         | `DatabaseError`     |
| Any other error   | 500         | `ServerError`       |

## Response Format

```json
{
    "error": "ServerError",
    "message": "Something went wrong"
}
```

## Usage Example

```typescript
import { formatErrorResponse } from '@campaigns/src/middleware/error-handler.js';

try {
    // handler logic
} catch (error) {
    return formatErrorResponse(error instanceof Error ? error : new Error('Unknown'));
}
```
