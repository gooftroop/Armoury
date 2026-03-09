import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

/**
 * Service configuration retrieved from AWS SSM Parameter Store.
 */
export interface UsersServiceConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    dsqlClusterEndpoint: string;

    /** AWS region of the DSQL cluster. */
    dsqlRegion: string;
}

let cachedConfig: UsersServiceConfig | null = null;

/**
 * Retrieves the users service configuration from SSM Parameter Store.
 *
 * Fetches the DSQL cluster endpoint on first invocation and caches for warm reuse.
 * Falls back to environment variables when running offline.
 *
 * @returns Service configuration with DSQL connection details.
 */
export async function getServiceConfig(): Promise<UsersServiceConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    if (process.env['IS_OFFLINE'] === 'true') {
        const localConfig: UsersServiceConfig = {
            dsqlClusterEndpoint: process.env['LOCAL_DB_HOST'] ?? 'localhost',
            dsqlRegion: process.env['LOCAL_DB_REGION'] ?? 'us-east-1',
        };

        cachedConfig = localConfig;

        return cachedConfig;
    }

    const paramName = process.env['DSQL_ENDPOINT_PARAM'];

    if (!paramName) {
        throw new Error('DSQL_ENDPOINT_PARAM environment variable is required');
    }

    const client = new SSMClient({});
    const command = new GetParameterCommand({ Name: paramName });
    const response = await client.send(command);

    const dsqlClusterEndpoint = response.Parameter?.Value;

    if (!dsqlClusterEndpoint) {
        throw new Error(`SSM parameter ${paramName} has no value`);
    }

    const dsqlRegion = process.env['AWS_REGION'] ?? 'us-east-1';

    cachedConfig = { dsqlClusterEndpoint, dsqlRegion };

    return cachedConfig;
}
