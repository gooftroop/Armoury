/**
 * Lambda entry point for the users service.
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
import type { ApiResponse, DatabaseAdapter } from '@/types.js';
import { getServiceConfig } from '@/utils/secrets.js';

/**
 * Minimal API Gateway proxy event payload.
 * Defines only the fields used by the users handler to avoid
 * depending on the full @types/aws-lambda package at runtime.
 */
interface ApiGatewayEvent {
    /** HTTP method name (GET, POST, PUT, DELETE). */
    httpMethod: string;

    /** Request path (e.g., "/users/abc-123"). */
    path: string;

    /** Request resource template (e.g., "/users/{id}"). */
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

/**
 * DSQLAdapter constructor type resolved at runtime via dynamic import.
 * The adapter implements the DatabaseAdapter interface from the users types.
 */
interface DSQLAdapterConstructor {
    /** Creates a new DSQLAdapter instance with the given configuration. */
    new (config: DSQLAdapterConfig): DatabaseAdapter & { initialize(): Promise<void> };
}

/**
 * Local adapter configuration payload.
 */
interface LocalAdapterConfig {
    /** PostgreSQL hostname. */
    host: string;

    /** PostgreSQL port. */
    port: number;

    /** PostgreSQL username. */
    user: string;

    /** PostgreSQL password. */
    password: string;

    /** PostgreSQL database name. */
    database: string;

    /** Whether to enable SSL. */
    ssl: boolean;
}

/**
 * Local adapter constructor type.
 */
interface LocalAdapterConstructor {
    /** Creates a new local adapter instance. */
    new (config: LocalAdapterConfig): DatabaseAdapter & { initialize(): Promise<void> };
}

/**
 * Resolves the DSQLAdapter class from @armoury/adapters-dsql at runtime using dynamic import.
 * This avoids TypeScript rootDir conflicts while still pulling in the real adapter class.
 */
const { DSQLAdapter } = (await import('@armoury/adapters-dsql')) as unknown as { DSQLAdapter: DSQLAdapterConstructor };
const { LocalDatabaseAdapter } = (await import('./utils/localAdapter.js')) as unknown as {
    LocalDatabaseAdapter: LocalAdapterConstructor;
};

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

    const adapter =
        process.env['IS_OFFLINE'] === 'true'
            ? new LocalDatabaseAdapter({
                  host: process.env['LOCAL_DB_HOST'] ?? config.dsqlClusterEndpoint,
                  port: Number(process.env['LOCAL_DB_PORT'] ?? '5432'),
                  user: process.env['LOCAL_DB_USER'] ?? 'armoury',
                  password: process.env['LOCAL_DB_PASSWORD'] ?? 'armoury_local',
                  database: process.env['LOCAL_DB_NAME'] ?? 'armoury_users',
                  ssl: process.env['LOCAL_DB_SSL'] === 'true',
              })
            : new DSQLAdapter({
                  clusterEndpoint: config.dsqlClusterEndpoint,
                  region: config.dsqlRegion,
              });

    await adapter.initialize();

    adapterInstance = adapter;

    return adapter;
}

/**
 * Lambda handler entry point for the users service.
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
    Sentry.logger.info('[users] Handler invoked', {
        httpMethod: event.httpMethod,
        path: event.path,
    });

    try {
        const adapter = await initializeAdapter();
        const userContext = extractUserContext(event);
        const response = await router(event, adapter, userContext);

        Sentry.logger.info('[users] Handler completed', {
            httpMethod: event.httpMethod,
            path: event.path,
            statusCode: response.statusCode,
        });

        return response;
    } catch (error) {
        Sentry.logger.error('[users] Handler error', {
            httpMethod: event.httpMethod,
            path: event.path,
            error: error instanceof Error ? error.message : String(error),
        });
        Sentry.captureException(error);

        const normalizedError = error instanceof Error ? error : new Error('Unknown error');

        return formatErrorResponse(normalizedError);
    }
});
