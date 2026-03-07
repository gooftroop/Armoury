# Authorizer Service

The authorizer service is a Lambda authorizer for API Gateway that validates Auth0 JWT tokens. It verifies the token signature using Auth0's JWKS endpoint, checks the audience and issuer claims, and returns an IAM policy document that API Gateway uses to allow or deny the request.

## How It Works

1. API Gateway receives a request with an `Authorization: Bearer <token>` header
2. API Gateway invokes the authorizer Lambda with the token and method ARN
3. The authorizer fetches Auth0's JWKS (cached across warm invocations)
4. Verifies the JWT signature, expiration, audience, and issuer
5. On success: returns an Allow policy with user claims (sub, email, name) in the context
6. On failure: returns a Deny policy or throws "Unauthorized"
7. API Gateway caches the policy for 300 seconds (configurable)

## Auth0 Integration

The service uses the `jose` library to verify JWTs against Auth0's JWKS endpoint at `https://<domain>/.well-known/jwks.json`. The Auth0 domain and audience are fetched from AWS Secrets Manager on cold start and cached. The JWKS set is created via `getJwks(domain)` (which accepts the domain as a parameter) and cached across warm invocations.

## Configuration

| Source          | Key             | Description                                                 |
| --------------- | --------------- | ----------------------------------------------------------- |
| Environment     | `SECRET_NAME`   | Secrets Manager secret name (set in serverless.yml)         |
| Secrets Manager | `auth0Domain`   | Auth0 tenant domain (e.g., `myapp.auth0.com`)               |
| Secrets Manager | `auth0Audience` | Expected JWT audience claim (e.g., `https://api.myapp.com`) |

The `SECRET_NAME` environment variable defaults to `armoury/{stage}/authorizer` and is set in `serverless.yml`. The secret must be a JSON object in AWS Secrets Manager containing `auth0Domain` and `auth0Audience` string fields.

## File Structure

| File                 | Documentation                              |
| -------------------- | ------------------------------------------ |
| src/handler.ts       | [handler.md](handler.md)                   |
| src/jwks.ts          | JWKS fetching and caching (accepts domain) |
| src/types.ts         | Authorizer event and result types          |
| src/utils/token.ts   | Bearer token extraction, issuer building   |
| src/utils/policy.ts  | IAM policy generation                      |
| src/utils/jwt.ts     | JWT payload type guard                     |
| src/utils/secrets.ts | Secrets Manager config fetch and caching   |
| serverless.yml       | [deployment.md](deployment.md)             |
