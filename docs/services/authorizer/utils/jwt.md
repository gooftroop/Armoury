# jwt.ts

Type guard for validating JWT payloads against the authorizer's expected shape.

**Source:** `src/services/authorizer/src/utils/jwt.ts`

---

## Exports

### `isJwtPayload()`

Guards an unknown payload to the `JwtPayload` interface expected by the authorizer. Performs structural validation to ensure the payload contains the required claims with the correct types before the authorizer extracts user identity from it.

```typescript
const isJwtPayload: (payload: unknown) => payload is JwtPayload;
```

**Parameters:**

| Parameter | Type      | Description                         |
| --------- | --------- | ----------------------------------- |
| `payload` | `unknown` | The decoded JWT payload to validate |

**Returns:** `true` if the payload matches the `JwtPayload` shape.

**Validation checks (in order):**

1. Payload is not null and is an object.
2. `sub` exists and is a string.
3. `aud` exists (string or array).
4. `iss` exists and is a string.

Optional fields (`email`, `name`) are not validated -- they are only used when present.

---

## Usage Example

```typescript
import { isJwtPayload } from '@authorizer/src/utils/jwt.js';
import { jwtVerify } from 'jose';

const { payload } = await jwtVerify(token, jwks, { issuer, audience });

if (!isJwtPayload(payload)) {
    // Payload is missing required claims -- deny access
    return generatePolicy('unknown', 'Deny', event.methodArn);
}

// payload is now typed as JwtPayload
const userId = payload.sub;
const email = payload.email ?? 'unknown';
```
