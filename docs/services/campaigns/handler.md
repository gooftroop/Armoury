# handler.ts

Lambda entry point for the campaigns service. Initializes the Aurora DSQL adapter on cold start, reuses the connection across warm invocations, and delegates routing to the router module.

## Exports

| Export    | Type             | Description                                            |
| --------- | ---------------- | ------------------------------------------------------ |
| `handler` | `async function` | Lambda handler that processes API Gateway proxy events |

## How It Works

1. On cold start, calls `getServiceConfig()` from `src/utils/secrets.ts` to fetch DSQL configuration from AWS Secrets Manager
2. Creates a `DSQLAdapter` instance via `createRequire` (avoids TypeScript rootDir conflicts) using the cluster endpoint and region from the secret
3. Calls `adapter.initialize()` to establish the database connection
4. Caches the adapter in module scope for warm Lambda reuse
5. Extracts user context from authorizer claims via `extractUserContext`
6. Passes the event to the `router` function (uses `event.resource` for dispatch)
7. Catches all errors and formats them via `formatErrorResponse`

## Usage Example

The handler is invoked by API Gateway via the Serverless Framework configuration. It is not called directly in application code.

```yaml
# serverless.yml
functions:
    campaigns:
        handler: src/handler.handler
```

```typescript
// The handler signature
export async function handler(event: ApiGatewayEvent): Promise<ApiResponse>;
```
