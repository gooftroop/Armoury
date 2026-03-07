# secrets.ts

Fetches and caches the campaigns service configuration from AWS Secrets Manager.

**Source:** `src/services/campaigns/src/utils/secrets.ts`

---

## Exports

### `CampaignsServiceConfig`

Configuration interface for the campaigns service.

```typescript
interface CampaignsServiceConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    dsqlClusterEndpoint: string;

    /** AWS region of the DSQL cluster. */
    dsqlRegion: string;
}
```

---

### `getServiceConfig()`

Fetches the campaigns service configuration. On the first invocation (cold start), retrieves the secret from AWS Secrets Manager by the name specified in the `SECRET_NAME` environment variable, parses the JSON value, validates the required fields, and caches the result in module scope. On subsequent invocations, returns the cached configuration without making an API call.

When `IS_OFFLINE` is `true` (local development with serverless-offline), bypasses Secrets Manager entirely and returns a local configuration built from `LOCAL_DB_HOST` (defaults to `localhost`) and `LOCAL_DB_REGION` (defaults to `us-east-1`) environment variables.

```typescript
async function getServiceConfig(): Promise<CampaignsServiceConfig>;
```

**Parameters:** None.

**Returns:** `CampaignsServiceConfig` -- the parsed and validated service configuration.

**Throws:**

- `Error` if `SECRET_NAME` is not set (production/deployed only).
- `Error` if the secret value is empty.
- `Error` if the secret JSON does not contain `dsqlClusterEndpoint` and `dsqlRegion` as strings.

**Environment Variables:**

| Variable          | Required   | Description                                                     |
| ----------------- | ---------- | --------------------------------------------------------------- |
| `SECRET_NAME`     | Production | AWS Secrets Manager secret name containing the service config   |
| `IS_OFFLINE`      | Local only | Set to `'true'` by serverless-offline to bypass Secrets Manager |
| `LOCAL_DB_HOST`   | Local only | PostgreSQL hostname (default: `'localhost'`)                    |
| `LOCAL_DB_REGION` | Local only | AWS region placeholder (default: `'us-east-1'`)                 |

**Expected Secret JSON Format:**

```json
{
    "dsqlClusterEndpoint": "my-cluster.dsql.us-east-1.on.aws",
    "dsqlRegion": "us-east-1"
}
```

---

## Usage Example

```typescript
import { getServiceConfig } from '@campaigns/src/utils/secrets.js';

// In the Lambda handler (called once per cold start)
const config = await getServiceConfig();

// Use config to initialize the database adapter
const adapter = createDsqlAdapter({
    endpoint: config.dsqlClusterEndpoint,
    region: config.dsqlRegion,
});
```
