# Campaigns Service

The campaigns service is a serverless AWS Lambda behind API Gateway that provides full CRUD operations for tabletop game campaign management. It supports both master campaigns (organizer-created containers) and participant campaigns (per-player entries).

## Architecture

The service is a single Lambda function (ARM64/Graviton2) with a monolithic handler that routes requests using an `event.resource` dispatch map. It connects to Aurora DSQL via the `DSQLAdapter` from `@armoury/shared`. Production stages authenticate requests through a separate Lambda authorizer; sandbox stages have no auth (not publicly accessible).

```
Client -> API Gateway (REST) -> [Lambda Authorizer (prod only)] -> Campaigns Lambda -> Aurora DSQL
```

- **Runtime**: Node.js 22.x (ARM64)
- **Database**: Aurora DSQL (PostgreSQL-compatible)
- **Auth**: Auth0 JWT via Lambda authorizer (production only)
- **Secrets**: AWS Secrets Manager (fetched at cold start, cached for warm invocations)
- **Bundling**: Serverless Framework v4 with esbuild
- **Deployment**: Per-PR sandbox stages, production on main

## REST API Reference

| Method | Path                             | Handler           | Description                     | Status Codes  |
| ------ | -------------------------------- | ----------------- | ------------------------------- | ------------- |
| POST   | /campaigns                       | createCampaign    | Create a master campaign        | 201, 400      |
| GET    | /campaigns                       | listCampaigns     | List all master campaigns       | 200           |
| GET    | /campaigns/:id                   | getCampaign       | Get a master campaign by ID     | 200, 400, 404 |
| PUT    | /campaigns/:id                   | updateCampaign    | Update a master campaign        | 200, 400, 404 |
| DELETE | /campaigns/:id                   | deleteCampaign    | Delete a master campaign        | 204, 400, 404 |
| POST   | /campaigns/:id/participants      | joinCampaign      | Add a participant to a campaign | 201, 400, 404 |
| GET    | /campaigns/:id/participants      | listParticipants  | List participants in a campaign | 200, 400      |
| GET    | /campaigns/:id/participants/:pid | getParticipant    | Get a participant by ID         | 200, 400, 404 |
| PUT    | /campaigns/:id/participants/:pid | updateParticipant | Update a participant            | 200, 400, 404 |
| DELETE | /campaigns/:id/participants/:pid | deleteParticipant | Remove a participant            | 204, 400, 404 |

## Configuration

| Source          | Key                   | Description                                         |
| --------------- | --------------------- | --------------------------------------------------- |
| Environment     | `SECRET_NAME`         | Secrets Manager secret name (set in serverless.yml) |
| Secrets Manager | `dsqlClusterEndpoint` | Aurora DSQL cluster endpoint hostname               |
| Secrets Manager | `dsqlRegion`          | AWS region of the DSQL cluster                      |

The `SECRET_NAME` environment variable defaults to `armoury/{stage}/campaigns` and is set in `serverless.yml`. The secret must be a JSON object in AWS Secrets Manager containing `dsqlClusterEndpoint` and `dsqlRegion` string fields. Secrets are fetched once on cold start and cached for warm invocations via `src/utils/secrets.ts`.

## Authentication

In production, all endpoints require a valid Bearer token in the `Authorization` header. The token is validated by the Lambda authorizer service, which verifies the Auth0 JWT and passes user claims (sub, email, name) to the campaigns handler via `event.requestContext.authorizer.claims`.

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

| File                            | Documentation                                               |
| ------------------------------- | ----------------------------------------------------------- |
| src/handler.ts                  | [handler.md](handler.md)                                    |
| src/router.ts                   | [router.md](router.md)                                      |
| src/types.ts                    | [types.md](types.md)                                        |
| src/routes/campaigns.ts         | [routes/campaigns.md](routes/campaigns.md)                  |
| src/routes/participants.ts      | [routes/participants.md](routes/participants.md)            |
| src/middleware/auth.ts          | [middleware/auth.md](middleware/auth.md)                    |
| src/middleware/error-handler.ts | [middleware/error-handler.md](middleware/error-handler.md)  |
| src/utils/response.ts           | HTTP response builder helpers (jsonResponse, errorResponse) |
| src/utils/validation.ts         | Type guards and request body parsers                        |
| src/utils/secrets.ts            | Secrets Manager config fetch and caching                    |
| serverless.yml                  | [deployment.md](deployment.md)                              |
