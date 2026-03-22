/**
 * Authorizer service configuration read from environment variables.
 */
export interface AuthorizerServiceConfig {
    /** Auth0 tenant domain (e.g., 'myapp.auth0.com'). */
    auth0Domain: string;

    /** Auth0 API audience identifier. */
    auth0Audience: string;
}

/** Cached config for warm Lambda invocations. */
let cachedConfig: AuthorizerServiceConfig | null = null;

/**
 * Reads the authorizer service configuration from environment variables.
 *
 * On the first invocation (cold start), reads AUTH0_DOMAIN and AUTH0_AUDIENCE
 * from process.env and caches the result. On subsequent invocations, returns
 * the cached configuration.
 *
 * @returns The parsed service configuration.
 * @throws Error if AUTH0_DOMAIN or AUTH0_AUDIENCE is not set.
 */
export async function getServiceConfig(): Promise<AuthorizerServiceConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    const auth0Domain = process.env['AUTH0_DOMAIN'];
    const auth0Audience = process.env['AUTH0_AUDIENCE'];

    if (!auth0Domain || !auth0Audience) {
        throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables are required');
    }

    cachedConfig = { auth0Domain, auth0Audience };

    return cachedConfig;
}
