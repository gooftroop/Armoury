/**
 * Shared AWS SDK configuration for pointing SDK clients at LocalStack.
 *
 * @module localstackConfig
 */

/**
 * @requirements
 * - REQ-LOCALSTACK-CONFIG: Provide a reusable SDK client config for tests that instantiate AWS clients directly
 * - REQ-ENV-FALLBACK: Environment variable AWS_ENDPOINT_URL handles most cases; this is for explicit client construction
 */

/** LocalStack endpoint for all emulated AWS services. */
const LOCALSTACK_ENDPOINT = 'http://localhost:4566';

/** AWS SDK client configuration targeting the local LocalStack instance. */
export const localstackClientConfig = {
    endpoint: LOCALSTACK_ENDPOINT,
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
    },
};
