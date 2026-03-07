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
 */
export interface AuthorizerEvent {
    /**
     * The authorizer event type (TOKEN).
     */
    type: string;

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
 * JWT payload fields required by the authorizer.
 */
export interface JwtPayload {
    /**
     * The subject identifier for the token.
     */
    sub: string;

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
