/**
 * Supported policy effects for API Gateway authorizers.
 */
export type PolicyEffect = 'Allow' | 'Deny';

/**
 * Context values returned by the authorizer.
 */
export type AuthorizerContext = Record<string, string | number | boolean>;

/**
 * Defines the shape of an API Gateway TOKEN authorizer event.
 * Used by REST API Gateway (v1) integrations.
 */
export interface TokenAuthorizerEvent {
    /**
     * The authorizer event type.
     */
    type: 'TOKEN';

    /**
     * The Authorization header value passed to the authorizer.
     */
    authorizationToken: string;

    /**
     * The API Gateway method ARN for the request.
     */
    methodArn: string;
}

/**
 * Defines the shape of an API Gateway REQUEST authorizer event.
 * Used by WebSocket API Gateway ($connect) integrations.
 */
export interface RequestAuthorizerEvent {
    /**
     * The authorizer event type.
     */
    type: 'REQUEST';

    /**
     * Query string parameters from the WebSocket connection request.
     */
    queryStringParameters?: Record<string, string | undefined>;

    /**
     * HTTP headers from the WebSocket connection request.
     */
    headers?: Record<string, string | undefined>;

    /**
     * The API Gateway method ARN for the request.
     */
    methodArn: string;
}

/**
 * Discriminated union of all supported API Gateway authorizer event types.
 */
export type AuthorizerEvent = TokenAuthorizerEvent | RequestAuthorizerEvent;

/**
 * A single statement in the IAM policy document.
 */
export interface AuthorizerPolicyStatement {
    /**
     * The IAM action the policy controls.
     */
    Action: string;

    /**
     * The policy effect, Allow or Deny.
     */
    Effect: PolicyEffect;

    /**
     * The resource ARN that the policy applies to.
     */
    Resource: string;
}

/**
 * The IAM policy document returned by the authorizer.
 */
export interface AuthorizerPolicyDocument {
    /**
     * The IAM policy language version.
     */
    Version: string;

    /**
     * The IAM policy statements.
     */
    Statement: AuthorizerPolicyStatement[];
}

/**
 * Result object returned by the Lambda authorizer.
 */
export interface AuthorizerResult {
    /**
     * The principal identifier for the authenticated user.
     */
    principalId: string;

    /**
     * The IAM policy document granting or denying access.
     */
    policyDocument: AuthorizerPolicyDocument;

    /**
     * Optional context values forwarded to the integration.
     */
    context?: AuthorizerContext;
}

/**
 * Custom claim namespace for the internal user identifier.
 *
 * Auth0 requires custom claims in access tokens to use a namespace prefix.
 * The Post-Login Action writes a stable UUID into this claim so that every
 * authentication method (Google OAuth, email/password, etc.) resolves to the
 * same application-level user ID.
 */
export const INTERNAL_ID_CLAIM = 'https://armoury.app/internal_id' as const;

/**
 * OAuth 2.0 grant type for machine-to-machine (client credentials) tokens.
 *
 * Auth0 M2M tokens include a `gty` claim with this value. The authorizer
 * uses it to distinguish M2M tokens from interactive user tokens.
 */
export const M2M_GRANT_TYPE = 'client-credentials' as const;

/**
 * Principal identifier assigned to authenticated M2M token requests.
 *
 * M2M tokens do not carry an internal user ID, so the authorizer uses
 * this fixed principal for IAM policy generation.
 */
export const M2M_PRINCIPAL_ID = 'm2m' as const;

/**
 * JWT payload fields required by the authorizer for user tokens.
 */
export interface JwtPayload {
    /**
     * The subject identifier for the token (Auth0 `sub` — kept for logging/diagnostics).
     */
    sub: string;

    /**
     * Stable internal user identifier injected by the Auth0 Post-Login Action.
     * This is the primary key used across all application services.
     */
    'https://armoury.app/internal_id': string;

    /**
     * The email address for the token subject.
     */
    email?: string;

    /**
     * The display name for the token subject.
     */
    name?: string;

    /**
     * The intended audience for the token.
     */
    aud: string | string[];

    /**
     * The issuer for the token.
     */
    iss: string;
}

/**
 * JWT payload fields present in Auth0 machine-to-machine tokens.
 *
 * M2M tokens are issued via the client_credentials grant and lack
 * user-specific claims like `internal_id`, `email`, and `name`.
 */
export interface M2mPayload {
    /**
     * The subject identifier — equals the M2M application's client_id.
     */
    sub: string;

    /**
     * The OAuth 2.0 grant type. Always `"client-credentials"` for M2M tokens.
     */
    gty: typeof M2M_GRANT_TYPE;

    /**
     * The intended audience for the token.
     */
    aud: string | string[];

    /**
     * The issuer for the token.
     */
    iss: string;
}
