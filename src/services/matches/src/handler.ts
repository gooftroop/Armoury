import * as Sentry from '@sentry/aws-serverless';
import { extractUserContext } from '@/middleware/auth.js';
import { formatErrorResponse } from '@/middleware/errorHandler.js';
import { router } from '@/router.js';
import type { ApiResponse, DatabaseAdapter } from '@/types.js';
import { getServiceConfig } from '@/utils/secrets.js';

interface ApiGatewayEvent {
    httpMethod: string;
    path: string;
    resource: string;
    body: string | null;
    pathParameters?: Record<string, string | undefined> | null;
    requestContext: {
        authorizer?: Record<string, unknown>;
    };
}

interface DSQLAdapterConfig {
    clusterEndpoint: string;
    region: string;
}

interface DSQLAdapterConstructor {
    new (config: DSQLAdapterConfig): DatabaseAdapter & { initialize(): Promise<void> };
}

interface LocalAdapterConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean;
}

interface LocalAdapterConstructor {
    new (config: LocalAdapterConfig): DatabaseAdapter & { initialize(): Promise<void> };
}

const { DSQLAdapter } = (await import('@armoury/adapters-dsql')) as unknown as { DSQLAdapter: DSQLAdapterConstructor };
const { LocalDatabaseAdapter } = (await import('./utils/localAdapter.js')) as unknown as {
    LocalDatabaseAdapter: LocalAdapterConstructor;
};

let adapterInstance: DatabaseAdapter | null = null;

async function initializeAdapter(): Promise<DatabaseAdapter> {
    if (adapterInstance) {
        return adapterInstance;
    }

    const config = await getServiceConfig();

    const adapter =
        process.env['IS_OFFLINE'] === 'true'
            ? new LocalDatabaseAdapter({
                  host: process.env['LOCAL_DB_HOST'] ?? 'localhost',
                  port: Number(process.env['LOCAL_DB_PORT'] ?? '5433'),
                  user: process.env['LOCAL_DB_USER'] ?? 'armoury',
                  password: process.env['LOCAL_DB_PASSWORD'] ?? 'armoury_local',
                  database: process.env['LOCAL_DB_NAME'] ?? 'armoury_matches',
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
 * Lambda handler for the matches service.
 * Initializes the database adapter, extracts user context, routes the request, and handles errors.
 * @param event API Gateway Lambda proxy event.
 * @returns API Gateway Lambda proxy response.
 */
export const handler = Sentry.wrapHandler(async (event: ApiGatewayEvent): Promise<ApiResponse> => {
    Sentry.logger.info('[matches] Handler invoked', {
        httpMethod: event.httpMethod,
        path: event.path,
    });

    try {
        const adapter = await initializeAdapter();
        const userContext = extractUserContext(event);
        const response = await router(event, adapter, userContext);

        Sentry.logger.info('[matches] Handler completed', {
            httpMethod: event.httpMethod,
            path: event.path,
            statusCode: response.statusCode,
        });

        return response;
    } catch (error) {
        Sentry.logger.error('[matches] Handler error', {
            httpMethod: event.httpMethod,
            path: event.path,
            error: error instanceof Error ? error.message : String(error),
        });
        Sentry.captureException(error);

        const normalizedError = error instanceof Error ? error : new Error('Unknown error');

        return formatErrorResponse(normalizedError);
    }
});
