# jwks.ts

Builds and caches the remote JWKS (JSON Web Key Set) for Auth0 JWT verification.

**Source:** `src/services/authorizer/src/jwks.ts`

---

## Exports

### `getJwks()`

Builds or retrieves the cached JWKS key set for the given Auth0 domain. On the first call, creates a remote JWKS set pointing to the Auth0 well-known endpoint (`https://{domain}/.well-known/jwks.json`) using the `jose` library's `createRemoteJWKSet`. On subsequent calls with the same domain, returns the cached set. If the domain changes between calls, the cache is rebuilt.

```typescript
const getJwks: (domain: string) => ReturnType<typeof createRemoteJWKSet>;
```

**Parameters:**

| Parameter | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `domain`  | `string` | Auth0 tenant domain (e.g., `'myapp.auth0.com'`) |

**Returns:** A JWKS key set function compatible with `jose.jwtVerify`.

---

## Usage Example

```typescript
import { getJwks } from '@authorizer/src/jwks.js';
import { jwtVerify } from 'jose';

const domain = 'myapp.auth0.com';
const jwks = getJwks(domain);

// Use the JWKS set to verify a JWT
const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://${domain}/`,
    audience: 'https://api.myapp.com',
});
```
