# middleware/auth.ts

Extracts authenticated user context from API Gateway authorizer claims. The Lambda authorizer populates `event.requestContext.authorizer.claims` with the JWT payload fields after validating the token.

## Exports

| Export               | Type       | Description                                          |
| -------------------- | ---------- | ---------------------------------------------------- |
| `extractUserContext` | `function` | Extracts sub, email, and name from authorizer claims |

## How It Works

1. Reads `event.requestContext.authorizer.claims`
2. Validates that `sub`, `email`, and `name` are present as strings
3. Returns a `UserContext` object
4. Throws an error if claims are missing or incomplete

## Usage Example

```typescript
import { extractUserContext } from '@campaigns/src/middleware/auth.js';

const userContext = extractUserContext(event);
// { sub: "auth0|abc123", email: "user@example.com", name: "John" }
```
