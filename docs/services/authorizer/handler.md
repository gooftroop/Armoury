# handler.ts

Lambda authorizer entry point. Validates Auth0 JWT tokens and returns IAM policy documents for API Gateway authorization decisions.

## Exports

| Export    | Type             | Description               |
| --------- | ---------------- | ------------------------- |
| `handler` | `async function` | Lambda authorizer handler |

## How It Works

1. Extracts the Bearer token from `event.authorizationToken` via `extractBearerToken` (from `utils/token.ts`)
2. Fetches Auth0 domain and audience from AWS Secrets Manager via `getServiceConfig` (from `utils/secrets.ts`)
3. Builds the issuer URL via `buildIssuer` (from `utils/token.ts`)
4. Calls `getJwks(domain)` to get the cached JWKS key set (from `jwks.ts`)
5. Verifies the JWT using `jose.jwtVerify` with audience and issuer checks
6. Validates the payload with `isJwtPayload` type guard (from `utils/jwt.ts`)
7. On success: calls `generatePolicy` (from `utils/policy.ts`) with Allow effect and user claims as context
8. On failure (any error): calls `generatePolicy` with Deny effect

## Policy Generation

The `generatePolicy` helper (in `utils/policy.ts`) creates an IAM policy document:

- **principalId**: The JWT `sub` claim (user ID)
- **Effect**: `Allow` or `Deny`
- **Resource**: Wildcard ARN covering all API Gateway routes
- **Context**: User claims (sub, email, name) passed to downstream Lambdas

## Cross-Service Reference

The authorizer Lambda ARN is exported to SSM Parameter Store at `/armoury/{stage}/authorizer-arn` for cross-service reference by the campaigns service.

## Usage

The handler is invoked automatically by API Gateway. It is not called directly.
