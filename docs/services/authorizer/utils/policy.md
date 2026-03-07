# policy.ts

Utility functions for generating IAM policy responses for the API Gateway Lambda authorizer.

**Source:** `src/services/authorizer/src/utils/policy.ts`

---

## Exports

### `generatePolicy()`

Creates an IAM policy result for the authorizer response. Builds a wildcard resource ARN from the incoming method ARN so the policy applies to all routes under the API Gateway stage, not just the specific route that triggered the authorizer. This allows API Gateway to cache the authorizer response and reuse it for subsequent requests.

```typescript
const generatePolicy: (
    principalId: string,
    effect: PolicyEffect,
    resource: string,
    context?: AuthorizerContext,
) => AuthorizerResult;
```

**Parameters:**

| Parameter     | Type                | Default     | Description                                             |
| ------------- | ------------------- | ----------- | ------------------------------------------------------- |
| `principalId` | `string`            | --          | Principal identifier (typically the JWT `sub` claim)    |
| `effect`      | `PolicyEffect`      | --          | `'Allow'` or `'Deny'`                                   |
| `resource`    | `string`            | --          | API Gateway method ARN from the event                   |
| `context`     | `AuthorizerContext` | `undefined` | Optional context values forwarded to downstream Lambdas |

**Returns:** `AuthorizerResult` -- a complete authorizer response containing the principal, IAM policy document, and optional context.

**Policy structure:**

- Version: `'2012-10-17'`
- Action: `'execute-api:Invoke'`
- Resource: Wildcard ARN derived from the input (`{arn-prefix}/{stage}/*/*`)

---

## Internal Helpers

### `buildWildcardResource()`

Converts a specific method ARN into a wildcard ARN covering all routes and methods. Splits the ARN on `/`, keeps the first two segments (ARN prefix and stage), and appends `/*/*` to match any method on any resource.

Falls back to the original ARN if it contains fewer than 2 path segments.

---

## Usage Example

```typescript
import { generatePolicy } from '@authorizer/src/utils/policy.js';

// Allow access for an authenticated user
const allow = generatePolicy(
    'auth0|abc123',
    'Allow',
    'arn:aws:execute-api:us-east-1:123456789:api-id/prod/GET/campaigns',
    { sub: 'auth0|abc123', email: 'user@example.com' },
);
// {
//     principalId: 'auth0|abc123',
//     policyDocument: {
//         Version: '2012-10-17',
//         Statement: [{
//             Action: 'execute-api:Invoke',
//             Effect: 'Allow',
//             Resource: 'arn:aws:execute-api:us-east-1:123456789:api-id/prod/*/*'
//         }]
//     },
//     context: { sub: 'auth0|abc123', email: 'user@example.com' }
// }

// Deny access for an invalid token
const deny = generatePolicy('unknown', 'Deny', event.methodArn);
```
