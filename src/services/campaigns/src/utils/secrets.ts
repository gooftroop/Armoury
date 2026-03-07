import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/**
 * Campaigns service configuration fetched from AWS Secrets Manager.
 */
export interface CampaignsServiceConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    dsqlClusterEndpoint: string;

    /** AWS region of the DSQL cluster. */
    dsqlRegion: string;
}

/** Cached config for warm Lambda invocations. */
let cachedConfig: CampaignsServiceConfig | null = null;

/**
 * Fetches the campaigns service configuration from AWS Secrets Manager.
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
export async function getServiceConfig(): Promise<CampaignsServiceConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    if (process.env['IS_OFFLINE'] === 'true') {
        const localConfig: CampaignsServiceConfig = {
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
