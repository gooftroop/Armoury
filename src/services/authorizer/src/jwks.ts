import { createRemoteJWKSet } from 'jose';

/**
 * Cached JWKS key set for warm Lambda invocations.
 * Keyed by domain to handle potential domain changes (defensive).
 */
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

/** Domain used to build the cached JWKS set. */
let cachedDomain: string | undefined;

/**
 * Builds or retrieves the cached JWKS key set for the given Auth0 domain.
 *
 * On the first call, creates a remote JWKS set pointing to the Auth0
 * well-known endpoint. On subsequent calls with the same domain, returns
 * the cached set. If the domain changes, rebuilds the set.
 *
 * @param domain - The Auth0 tenant domain (e.g., 'myapp.auth0.com').
 * @returns The JWKS key set for JWT verification.
 */
export const getJwks = (domain: string): ReturnType<typeof createRemoteJWKSet> => {
    if (cachedJwks && cachedDomain === domain) {
        return cachedJwks;
    }

    const jwksUrl = new URL(`https://${domain}/.well-known/jwks.json`);

    cachedJwks = createRemoteJWKSet(jwksUrl);
    cachedDomain = domain;

    return cachedJwks;
};
