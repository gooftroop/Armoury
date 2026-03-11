import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

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
 * Retrieves service configuration from AWS SSM Parameter Store or local environment.
 * Caches the result for subsequent calls.
 * @returns Service configuration with database connection details.
 * @throws Error if DSQL_ENDPOINT_PARAM is not set or parameter retrieval fails.
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
