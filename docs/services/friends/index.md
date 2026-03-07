# Friends Service

The friends service is a serverless AWS Lambda behind API Gateway that manages social relationships between users. It handles friend requests, status transitions (pending, accepted, blocked), and sharing permissions for army lists and match history.

## Architecture

The service is a single Lambda function (ARM64/Graviton2) with a monolithic handler that routes requests using an `event.resource` dispatch map. It connects to Aurora DSQL via the `DSQLAdapter` from `@armoury/shared`. Production stages authenticate requests through a separate Lambda authorizer; sandbox stages have no auth (not publicly accessible).

```
Client -> API Gateway (REST) -> [Lambda Authorizer (prod only)] -> Friends Lambda -> Aurora DSQL
```

- **Runtime**: Node.js 22.x (ARM64)
- **Database**: Aurora DSQL (PostgreSQL-compatible)
- **Auth**: Auth0 JWT via Lambda authorizer (production only)
- **Secrets**: AWS Secrets Manager (fetched at cold start, cached for warm invocations)
- **Bundling**: Serverless Framework v4 with esbuild
- **Deployment**: Per-PR sandbox stages, production on main

## REST API Reference

| Method | Path           | Handler            | Description                            | Status Codes  |
| ------ | -------------- | ------------------ | -------------------------------------- | ------------- |
| POST   | /friends       | sendFriendRequest  | Send a pending friend request          | 201, 400      |
| GET    | /friends       | listFriends        | List friend relationships for the user | 200           |
| GET    | /friends/{id}  | getFriend          | Get a friend relationship by ID        | 200, 400, 404 |
| PUT    | /friends/{id}  | updateFriend       | Update status or sharing permissions   | 200, 400, 404 |
| DELETE | /friends/{id}  | deleteFriend       | Delete a friend relationship           | 204, 400, 404 |

### Status Transitions

Friend relationships follow a strict state machine:

| Current Status | Allowed Transitions    |
| -------------- | ---------------------- |
| pending        | accepted, blocked      |
| accepted       | blocked                |
| blocked        | (terminal, no further) |

### Sharing Permissions

Each friend relationship has two boolean permission flags:

- `canShareArmyLists` — Whether the friend can view shared army lists.
- `canViewMatchHistory` — Whether the friend can view match history.

Both default to `false` on creation and can be toggled via the update endpoint.

## Configuration

| Source          | Key                   | Description                                         |
| --------------- | --------------------- | --------------------------------------------------- |
| Environment     | `SECRET_NAME`         | Secrets Manager secret name (set in serverless.yml) |
| Secrets Manager | `dsqlClusterEndpoint` | Aurora DSQL cluster endpoint hostname               |
| Secrets Manager | `dsqlRegion`          | AWS region of the DSQL cluster                      |

The `SECRET_NAME` environment variable defaults to `armoury/{stage}/friends` and is set in `serverless.yml`. The secret must be a JSON object in AWS Secrets Manager containing `dsqlClusterEndpoint` and `dsqlRegion` string fields. Secrets are fetched once on cold start and cached for warm invocations via `src/utils/secrets.ts`.

## Authentication

In production, all endpoints require a valid Bearer token in the `Authorization` header. The token is validated by the Lambda authorizer service, which verifies the Auth0 JWT and passes user context (sub, email, name) to the friends handler flat on `event.requestContext.authorizer`.

Sandbox stages (PR deployments) have no authorizer configured and are not publicly accessible.

## Error Response Format

All error responses follow this JSON structure:

```json
{
    "error": "ErrorType",
    "message": "Human-readable error description"
}
```

Error types: `ValidationError` (400), `NotFound` (404), `DatabaseError` (500), `ServerError` (500).

## File Structure

| File                            | Description                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| src/handler.ts                  | Lambda entry point, adapter initialization, error boundary  |
| src/router.ts                   | Route dispatch map (resource + method to handler)           |
| src/types.ts                    | Local type definitions (no shared imports)                  |
| src/routes/friends.ts           | Route handlers (send, list, get, update, delete)            |
| src/middleware/auth.ts          | Extracts user context from Lambda authorizer                |
| src/middleware/error-handler.ts | Formats errors into API Gateway proxy responses             |
| src/utils/response.ts           | HTTP response builder helpers (jsonResponse, errorResponse) |
| src/utils/validation.ts         | Type guards and request body parsers                        |
| src/utils/secrets.ts            | Secrets Manager config fetch and caching                    |
| src/utils/local-adapter.ts      | PostgreSQL adapter for local development                    |
| serverless.yml                  | Serverless Framework service configuration                  |
