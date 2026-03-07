# secrets.ts

Fetches and caches the authorizer service configuration from AWS Secrets Manager.

**Source:** `src/services/authorizer/src/utils/secrets.ts`

---

## Exports

### `AuthorizerServiceConfig`

Configuration interface for the authorizer service.

```typescript
interface AuthorizerServiceConfig {
    /** Auth0 tenant domain (e.g., 'myapp.auth0.com'). */
    auth0Domain: string;

    /** Auth0 API audience identifier. */
    auth0Audience: string;
}
```

---

### `getServiceConfig()`

Fetches the authorizer service configuration. On the first invocation (cold start), retrieves the secret from AWS Secrets Manager by the name specified in the `SECRET_NAME` environment variable, parses the JSON value, validates the required fields, and caches the result in module scope. On subsequent invocations, returns the cached configuration without making an API call.

When `IS_OFFLINE` is `true` (local development with serverless-offline), bypasses Secrets Manager entirely and returns a local configuration built from `LOCAL_AUTH0_DOMAIN` (defaults to `'localhost'`) and `LOCAL_AUTH0_AUDIENCE` (defaults to `'http://localhost:3000'`) environment variables.

```typescript
async function getServiceConfig(): Promise<AuthorizerServiceConfig>;
```

**Parameters:** None.

**Returns:** `AuthorizerServiceConfig` -- the parsed and validated service configuration.

**Throws:**

- `Error` if `SECRET_NAME` is not set (production/deployed only).
- `Error` if the secret value is empty.
- `Error` if the secret JSON does not contain `auth0Domain` and `auth0Audience` as strings.

**Environment Variables:**

| Variable               | Required   | Description                                                       |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| `SECRET_NAME`          | Production | AWS Secrets Manager secret name containing the service config     |
| `IS_OFFLINE`           | Local only | Set to `'true'` by serverless-offline to bypass Secrets Manager   |
| `LOCAL_AUTH0_DOMAIN`   | Local only | Auth0 domain for local dev (default: `'localhost'`)               |
| `LOCAL_AUTH0_AUDIENCE` | Local only | Auth0 audience for local dev (default: `'http://localhost:3000'`) |

**Expected Secret JSON Format:**

```json
{
    "auth0Domain": "myapp.auth0.com",
    "auth0Audience": "https://api.myapp.com"
}
```

---

## Usage Example

```typescript
import { getServiceConfig } from '@authorizer/src/utils/secrets.js';

// In the Lambda handler (called once per cold start)
const config = await getServiceConfig();

// Use config for JWT verification
const jwks = getJwks(config.auth0Domain);
const issuer = buildIssuer(config.auth0Domain);

const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: config.auth0Audience,
});
```
