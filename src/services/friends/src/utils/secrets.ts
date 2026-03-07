import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/**
 * Service configuration retrieved from AWS Secrets Manager.
 */
export interface FriendsServiceConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    dsqlClusterEndpoint: string;

    /** AWS region of the DSQL cluster. */
    dsqlRegion: string;
}

let cachedConfig: FriendsServiceConfig | null = null;

/**
 * Retrieves the friends service configuration from Secrets Manager.
 *
 * Fetches the secret on first invocation and caches for warm reuse.
 * Falls back to environment variables when running offline.
 *
 * @returns Service configuration with DSQL connection details.
 */
export async function getServiceConfig(): Promise<FriendsServiceConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    if (process.env['IS_OFFLINE'] === 'true') {
        const localConfig: FriendsServiceConfig = {
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
