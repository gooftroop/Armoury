import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/**
 * Configuration for the matches service database connection.
 */
export interface MatchesServiceConfig {
    /** DSQL cluster endpoint URL. */
    dsqlClusterEndpoint: string;

    /** AWS region for the DSQL cluster. */
    dsqlRegion: string;
}

let cachedConfig: MatchesServiceConfig | null = null;

/**
 * Retrieves service configuration from AWS Secrets Manager or local environment.
 * Caches the result for subsequent calls.
 * @returns Service configuration with database connection details.
 * @throws Error if SECRET_NAME is not set or secret retrieval fails.
 */
export async function getServiceConfig(): Promise<MatchesServiceConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    if (process.env['IS_OFFLINE'] === 'true') {
        const localConfig: MatchesServiceConfig = {
            dsqlClusterEndpoint: process.env['LOCAL_DB_HOST'] ?? 'localhost',
            dsqlRegion: process.env['LOCAL_DB_REGION'] ?? 'us-east-1',
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
    const dsqlClusterEndpoint = parsed['dsqlClusterEndpoint'];
    const dsqlRegion = parsed['dsqlRegion'];

    if (typeof dsqlClusterEndpoint !== 'string' || typeof dsqlRegion !== 'string') {
        throw new Error('Secret must contain dsqlClusterEndpoint and dsqlRegion string fields');
    }

    cachedConfig = { dsqlClusterEndpoint, dsqlRegion };

    return cachedConfig;
}
