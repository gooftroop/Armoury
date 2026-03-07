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
 * Builds the issuer string from the Auth0 domain.
 *
 * @param domain - Auth0 tenant domain.
 * @returns Issuer URL string.
 */
export const buildIssuer = (domain: string): string => {
    return `https://${domain}/`;
};
