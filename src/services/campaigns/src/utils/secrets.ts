import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

/**
 * Campaigns service configuration fetched from AWS SSM Parameter Store.
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
 * Fetches the campaigns service configuration from AWS SSM Parameter Store.
 *
 * On the first invocation (cold start), retrieves the DSQL cluster endpoint
 * from SSM and reads the AWS region from the Lambda runtime environment.
 * On subsequent invocations, returns the cached configuration.
 *
 * The SSM parameter name is read from the DSQL_ENDPOINT_PARAM environment variable.
 *
 * @returns The parsed service configuration.
 * @throws Error if DSQL_ENDPOINT_PARAM is not set or the parameter cannot be retrieved.
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
