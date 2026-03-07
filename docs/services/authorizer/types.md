# types.ts

Type definitions for the Lambda authorizer service. Defines the event shape, IAM policy structures, and JWT payload interface.

**Source:** `src/services/authorizer/src/types.ts`

---

## Exports

### `PolicyEffect`

Union type for IAM policy effects.

```typescript
type PolicyEffect = 'Allow' | 'Deny';
```

---

### `AuthorizerContext`

Context values returned by the authorizer and forwarded to downstream Lambda integrations via API Gateway.

```typescript
type AuthorizerContext = Record<string, string | number | boolean>;
```

---

### `AuthorizerEvent`

Defines the shape of an API Gateway TOKEN authorizer event.

```typescript
interface AuthorizerEvent {
    /** The authorizer event type (TOKEN). */
    type: string;

    /** The Authorization header value passed to the authorizer. */
    authorizationToken: string;

    /** The API Gateway method ARN for the request. */
    methodArn: string;
}
```

| Field                | Type     | Description                                  |
| -------------------- | -------- | -------------------------------------------- |
| `type`               | `string` | Always `'TOKEN'` for token-based authorizers |
| `authorizationToken` | `string` | The raw `Authorization` header value         |
| `methodArn`          | `string` | The API Gateway method ARN being invoked     |

---

### `AuthorizerPolicyStatement`

A single statement in the IAM policy document returned by the authorizer.

```typescript
interface AuthorizerPolicyStatement {
    Action: string;
    Effect: PolicyEffect;
    Resource: string;
}
```

| Field      | Type           | Description                                  |
| ---------- | -------------- | -------------------------------------------- |
| `Action`   | `string`       | IAM action, typically `'execute-api:Invoke'` |
| `Effect`   | `PolicyEffect` | `'Allow'` or `'Deny'`                        |
| `Resource` | `string`       | The API Gateway resource ARN                 |

---

### `AuthorizerPolicyDocument`

The IAM policy document wrapping one or more policy statements.

```typescript
interface AuthorizerPolicyDocument {
    Version: string;
    Statement: AuthorizerPolicyStatement[];
}
```

| Field       | Type                          | Description                         |
| ----------- | ----------------------------- | ----------------------------------- |
| `Version`   | `string`                      | IAM policy version (`'2012-10-17'`) |
| `Statement` | `AuthorizerPolicyStatement[]` | Array of policy statements          |

---

### `AuthorizerResult`

The complete result object returned by the Lambda authorizer to API Gateway.

```typescript
interface AuthorizerResult {
    principalId: string;
    policyDocument: AuthorizerPolicyDocument;
    context?: AuthorizerContext;
}
```

| Field            | Type                           | Description                                      |
| ---------------- | ------------------------------ | ------------------------------------------------ |
| `principalId`    | `string`                       | Principal identifier (JWT `sub` claim)           |
| `policyDocument` | `AuthorizerPolicyDocument`     | IAM policy granting or denying access            |
| `context`        | `AuthorizerContext` (optional) | User claims forwarded to downstream integrations |

---

### `JwtPayload`

JWT payload fields required by the authorizer for identity extraction and validation.

```typescript
interface JwtPayload {
    sub: string;
    email?: string;
    name?: string;
    aud: string | string[];
    iss: string;
}
```

| Field   | Type                 | Required | Description                  |
| ------- | -------------------- | -------- | ---------------------------- |
| `sub`   | `string`             | Yes      | Subject identifier (user ID) |
| `email` | `string`             | No       | User email address           |
| `name`  | `string`             | No       | User display name            |
| `aud`   | `string \| string[]` | Yes      | Token audience               |
| `iss`   | `string`             | Yes      | Token issuer                 |

---

## Usage Example

```typescript
import type { AuthorizerEvent, AuthorizerResult, JwtPayload } from '@authorizer/src/types.js';

// Type an incoming event
const event: AuthorizerEvent = {
    type: 'TOKEN',
    authorizationToken: 'Bearer eyJhbGciOi...',
    methodArn: 'arn:aws:execute-api:us-east-1:123456789:api-id/stage/GET/resource',
};

// Type a JWT payload after verification
const payload: JwtPayload = {
    sub: 'auth0|abc123',
    email: 'user@example.com',
    aud: 'https://api.myapp.com',
    iss: 'https://myapp.auth0.com/',
};
```
