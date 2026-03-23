/**
 * Lambda entry point for the campaigns service.
 *
 * Initializes the Aurora DSQL adapter on cold start and reuses the connection
 * across warm invocations. Delegates HTTP routing to the router module and
 * catches all unhandled errors via the error handler middleware.
 *
 * Environment variables:
 * - DSQL_ENDPOINT_PARAM: SSM Parameter Store path for DSQL cluster endpoint
 */

import * as Sentry from '@sentry/aws-serverless';
import { extractUserContext } from '@/middleware/auth.js';
import { formatErrorResponse } from '@/middleware/errorHandler.js';
import { router } from '@/router.js';
import type { DatabaseAdapter } from '@armoury/data-dao';
import type { ApiResponse } from '@/types.js';
import { getServiceConfig } from '@/utils/secrets.js';

/**
 * Minimal API Gateway proxy event payload.
 * Defines only the fields used by the campaigns handler to avoid
 * depending on the full @types/aws-lambda package at runtime.
 */
interface ApiGatewayEvent {
    /** HTTP method name (GET, POST, PUT, DELETE). */
    httpMethod: string;

    /** Request path (e.g., "/campaigns/abc-123"). */
    path: string;

    /** Request resource template (e.g., "/campaigns/{id}"). */
    resource: string;

    /** Raw JSON request body string, or null for bodiless requests. */
    body: string | null;

    /** Path parameters extracted by API Gateway (e.g., { id: "abc-123" }). */
    pathParameters?: Record<string, string | undefined> | null;

    /** Request context populated by the Lambda TOKEN authorizer. */
    requestContext: {
        authorizer?: Record<string, unknown>;
    };
}

/**
 * Configuration shape for the DSQLAdapter constructor.
 */
interface DSQLAdapterConfig {
    /** Aurora DSQL cluster endpoint hostname. */
    clusterEndpoint: string;

    /** AWS region of the DSQL cluster. */
    region: string;
}

interface DSQLAdapterConstructor {
    /** Creates a new DSQLAdapter instance with the given configuration. */
    new (config: DSQLAdapterConfig): DatabaseAdapter & { initialize(): Promise<void> };
}

/**
 * Resolves the DSQLAdapter class from @armoury/data at runtime using dynamic import.
 * This avoids TypeScript rootDir conflicts while still pulling in the real adapter class.
 */
const { DSQLAdapter } = (await import('@armoury/adapters-dsql')) as unknown as { DSQLAdapter: DSQLAdapterConstructor };

/**
 * Singleton database adapter instance reused across warm Lambda invocations.
 * Initialized on first request (cold start) and kept alive for subsequent requests.
 */
let adapterInstance: DatabaseAdapter | null = null;

/**
 * Initializes the Aurora DSQL adapter on cold start.
 *
 * Reads cluster endpoint and region from SSM Parameter Store, creates the
 * DSQLAdapter instance, and calls initialize() to establish the database
 * connection. The adapter is cached in module scope for warm reuse.
 *
 * @returns The initialized database adapter ready for CRUD operations.
 * @throws Error if DSQL_ENDPOINT_PARAM is missing or SSM parameter retrieval fails.
 * @throws DatabaseError if the adapter fails to connect to Aurora DSQL.
 */
async function initializeAdapter(): Promise<DatabaseAdapter> {
    if (adapterInstance) {
        return adapterInstance;
    }

    const config = await getServiceConfig();

    const adapter = new DSQLAdapter({
        clusterEndpoint: config.dsqlClusterEndpoint,
        region: config.dsqlRegion,
    });

    await adapter.initialize();

    adapterInstance = adapter;

    return adapter;
}

/**
 * Lambda handler entry point for the campaigns service.
 *
 * Processes incoming API Gateway proxy events by:
 * 1. Initializing the database adapter (cold start only)
 * 2. Extracting authenticated user context from authorizer context
 * 3. Routing the request to the appropriate CRUD handler
 * 4. Catching and formatting any unhandled errors
 *
 * @param event - API Gateway proxy integration event with HTTP method, path, body, and authorizer context.
 * @returns API Gateway proxy response with status code, headers, and JSON body.
 */
export const handler = Sentry.wrapHandler(async (event: ApiGatewayEvent): Promise<ApiResponse> => {
    Sentry.logger.info('[campaigns] Handler invoked', {
        httpMethod: event.httpMethod,
        path: event.path,
    });

    try {
        const adapter = await initializeAdapter();
        const userContext = extractUserContext(event);
        const response = await router(event, adapter, userContext);

        Sentry.logger.info('[campaigns] Handler completed', {
            httpMethod: event.httpMethod,
            path: event.path,
            statusCode: response.statusCode,
        });

        return response;
    } catch (error) {
        Sentry.logger.error('[campaigns] Handler error', {
            httpMethod: event.httpMethod,
            path: event.path,
            error: error instanceof Error ? error.message : String(error),
        });
        Sentry.captureException(error);

        const normalizedError = error instanceof Error ? error : new Error('Unknown error');

        return formatErrorResponse(normalizedError);
    }
});
