import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Authorizer service configuration fetched from AWS Secrets Manager.
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
 * Fetches the authorizer service configuration from AWS Secrets Manager.
 *
 * On the first invocation (cold start), retrieves the secret by name from
 * Secrets Manager and parses the JSON value. On subsequent invocations,
 * returns the cached configuration.
 *
 * The secret name is read from the SECRET_NAME environment variable.
 *
 * @returns The parsed service configuration.
 * @throws Error if SECRET_NAME is not set or the secret cannot be retrieved.
 */
export async function getServiceConfig(): Promise<AuthorizerServiceConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    if (process.env['IS_OFFLINE'] === 'true') {
        const localConfig: AuthorizerServiceConfig = {
            auth0Domain: process.env['LOCAL_AUTH0_DOMAIN'] ?? 'localhost',
            auth0Audience: process.env['LOCAL_AUTH0_AUDIENCE'] ?? 'http://localhost:3000',
        };

        cachedConfig = localConfig;

        return cachedConfig;
    }

    const secretName = process.env['SECRET_NAME'];

    if (!secretName) {
        throw new Error('SECRET_NAME environment variable is required');
    }

    const client = new SecretsManagerClient({});
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    if (!response.SecretString) {
        throw new Error('Secret value is empty');
    }

    const parsed = JSON.parse(response.SecretString) as Record<string, unknown>;
    const auth0Domain = parsed['auth0Domain'];
    const auth0Audience = parsed['auth0Audience'];

    if (typeof auth0Domain !== 'string' || typeof auth0Audience !== 'string') {
        throw new Error('Secret must contain auth0Domain and auth0Audience string fields');
    }

    cachedConfig = { auth0Domain, auth0Audience };

    return cachedConfig;
}
