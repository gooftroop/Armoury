# token.ts

Utility functions for extracting bearer tokens and building Auth0 issuer URLs.

**Source:** `src/services/authorizer/src/utils/token.ts`

---

## Exports

### `extractBearerToken()`

Extracts the bearer token from an authorization header value. Trims whitespace, splits on whitespace, and validates the scheme is `'Bearer'`. Returns `null` if the input is missing, empty, has an incorrect scheme, or has no token portion.

```typescript
const extractBearerToken: (authorizationToken: string | undefined) => string | null;
```

**Parameters:**

| Parameter            | Type                  | Description                      |
| -------------------- | --------------------- | -------------------------------- |
| `authorizationToken` | `string \| undefined` | Raw `Authorization` header value |

**Returns:** `string` -- the extracted token, or `null` if extraction fails.

**Extraction logic:**

1. Returns `null` if input is `undefined` or empty after trimming.
2. Splits on whitespace to separate scheme and token.
3. Returns `null` if scheme is not exactly `'Bearer'` or token part is missing.
4. Returns the token string.

---

### `buildIssuer()`

Builds the issuer URL string from an Auth0 domain. The issuer is used when verifying JWTs to ensure the token was issued by the expected Auth0 tenant.

```typescript
const buildIssuer: (domain: string) => string;
```

**Parameters:**

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `domain`  | `string` | Auth0 tenant domain (e.g., `'myapp.auth0.com'`) |

**Returns:** `string` -- the issuer URL in the format `https://{domain}/`.

---

## Usage Example

```typescript
import { extractBearerToken, buildIssuer } from '@authorizer/src/utils/token.js';

// Extract token from Authorization header
const token = extractBearerToken('Bearer eyJhbGciOi...');
// 'eyJhbGciOi...'

const noToken = extractBearerToken('Basic dXNlcjpwYXNz');
// null (wrong scheme)

const missing = extractBearerToken(undefined);
// null

// Build issuer for JWT verification
const issuer = buildIssuer('myapp.auth0.com');
// 'https://myapp.auth0.com/'
```
