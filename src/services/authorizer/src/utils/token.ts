import type { AuthorizerEvent } from '@/types.js';

/**
 * Extracts a bearer token from the authorization header.
 *
 * @param authorizationToken - Authorization header value.
 * @returns The bearer token or null if missing/invalid.
 */
export const extractBearerToken = (authorizationToken: string | undefined): string | null => {
    if (!authorizationToken) {
        return null;
    }

    const trimmedToken = authorizationToken.trim();

    if (!trimmedToken) {
        return null;
    }

    const [scheme, token] = trimmedToken.split(/\s+/u);

    if (scheme !== 'Bearer' || !token) {
        return null;
    }

    return token;
};

/**
 * Extracts the raw JWT from any supported authorizer event type.
 *
 * TOKEN events use the Authorization header with Bearer scheme.
 * REQUEST events pass the token directly via query string parameters.
 *
 * @param event - API Gateway authorizer event.
 * @returns The raw JWT string or null if missing/invalid.
 */
export const extractTokenFromEvent = (event: AuthorizerEvent): string | null => {
    if (event.type === 'TOKEN') {
        return extractBearerToken(event.authorizationToken);
    }

    return event.queryStringParameters?.token ?? null;
};

/**
 * Builds the issuer string from the Auth0 domain.
 *
 * @param domain - Auth0 tenant domain.
 * @returns Issuer URL string.
 */
export const buildIssuer = (domain: string): string => {
    return `https://${domain}/`;
};
