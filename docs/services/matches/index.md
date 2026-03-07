# Matches Service

The matches service is a serverless AWS Lambda behind API Gateway that provides full CRUD operations for tabletop game match history. It tracks game results, scoring, army compositions, and optionally links to opponent match records and campaign participation.

## Architecture

The service is a single Lambda function (ARM64/Graviton2) with a monolithic handler that routes requests using an `event.resource` dispatch map. It connects to Aurora DSQL via the `DSQLAdapter` from `@armoury/shared`. Production stages authenticate requests through a separate Lambda authorizer; sandbox stages have no auth (not publicly accessible).

```
Client -> API Gateway (REST) -> [Lambda Authorizer (prod only)] -> Matches Lambda -> Aurora DSQL
```

- **Runtime**: Node.js 22.x (ARM64)
- **Database**: Aurora DSQL (PostgreSQL-compatible)
- **Auth**: Auth0 JWT via Lambda authorizer (production only)
- **Secrets**: AWS Secrets Manager (fetched at cold start, cached for warm invocations)
- **Bundling**: Serverless Framework v4 with esbuild
- **Deployment**: Per-PR sandbox stages, production on main

## REST API Reference

| Method | Path                  | Handler            | Description                        | Status Codes  |
| ------ | --------------------- | ------------------ | ---------------------------------- | ------------- |
| POST   | /matches              | createMatch        | Create a match record              | 201, 400      |
| GET    | /matches              | listMatches        | List matches for authenticated user| 200           |
| GET    | /matches/{id}         | getMatch           | Get a match record by ID           | 200, 400, 404 |
| PUT    | /matches/{id}         | updateMatch        | Update a match record              | 200, 400, 404 |
| DELETE | /matches/{id}         | deleteMatch        | Delete a match record              | 204, 400, 404 |
| POST   | /matches/{id}/link    | linkOpponentMatch  | Link to opponent's match record    | 200, 400, 404 |

## Configuration

| Source          | Key                   | Description                                         |
| --------------- | --------------------- | --------------------------------------------------- |
| Environment     | `SECRET_NAME`         | Secrets Manager secret name (set in serverless.yml) |
| Secrets Manager | `dsqlClusterEndpoint` | Aurora DSQL cluster endpoint hostname               |
| Secrets Manager | `dsqlRegion`          | AWS region of the DSQL cluster                      |

The `SECRET_NAME` environment variable defaults to `armoury/{stage}/matches` and is set in `serverless.yml`. The secret must be a JSON object in AWS Secrets Manager containing `dsqlClusterEndpoint` and `dsqlRegion` string fields. Secrets are fetched once on cold start and cached for warm invocations via `src/utils/secrets.ts`.

## Authentication

In production, all endpoints require a valid Bearer token in the `Authorization` header. The token is validated by the Lambda authorizer service, which verifies the Auth0 JWT and passes user context (sub, email, name) to the matches handler flat on `event.requestContext.authorizer`.

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
| src/routes/matches.ts           | Route handlers (create, list, get, update, delete, link)    |
| src/middleware/auth.ts          | Extracts user context from Lambda authorizer                |
| src/middleware/error-handler.ts | Formats errors into API Gateway proxy responses             |
| src/utils/response.ts           | HTTP response builder helpers (jsonResponse, errorResponse) |
| src/utils/validation.ts         | Type guards and request body parsers                        |
| src/utils/secrets.ts            | Secrets Manager config fetch and caching                    |
| src/utils/local-adapter.ts      | PostgreSQL adapter for local development                    |
| serverless.yml                  | Serverless Framework service configuration                  |
