// Side-effect import: initializes Sentry before any handler code runs.
import './instrument.js';
import * as Sentry from '@sentry/aws-serverless';
import { TOKENS, coreModule, createContainerWithModules, createLambdaModule } from '@armoury/di';
import { extractUserContext } from '@/middleware/auth.js';
import { formatErrorResponse } from '@/middleware/errorHandler.js';
import { router } from '@/router.js';
import type { ApiResponse, DatabaseAdapter } from '@/types.js';
import { getServiceConfig } from '@/utils/secrets.js';

/**
 * @requirements
 * - REQ-DI-060: Lambda handler resolves production DatabaseAdapter via @armoury/di container modules.
 * - REQ-DI-061: Cold start initializes adapter once; warm invocations reuse cached adapter.
 */

/**
 * HTTP API v2 event from API Gateway.
 *
 * Uses `routeKey` ("PUT /{id}") and `rawPath` instead of the
 * REST API v1 `httpMethod` / `path` / `resource` triple.
 */
interface HttpApiV2Event {
    routeKey: string;
    rawPath: string;
    body?: string | null;
    pathParameters?: Record<string, string | undefined> | null;
    requestContext: {
        authorizer?: {
            jwt?: {
                claims?: Record<string, unknown>;
            };
        };
    };
}

interface NormalizedEvent {
    httpMethod: string;
    path: string;
    resource: string;
    body: string | null;
    pathParameters?: Record<string, string | undefined> | null;
    requestContext: HttpApiV2Event['requestContext'];
}

function normalizeEvent(event: HttpApiV2Event): NormalizedEvent {
    const spaceIndex = event.routeKey.indexOf(' ');
    const httpMethod = event.routeKey.slice(0, spaceIndex);
    const resource = event.routeKey.slice(spaceIndex + 1);

    return {
        httpMethod,
        path: event.rawPath,
        resource,
        body: event.body ?? null,
        pathParameters: event.pathParameters,
        requestContext: event.requestContext,
    };
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

// Dynamic imports moved inside initializeAdapter() to avoid eager loading of
// LocalDatabaseAdapter (which depends on 'pg') when 'pg' is externalized by esbuild.

let adapterInstance: DatabaseAdapter | null = null;
let container: ReturnType<typeof createContainerWithModules> | null = null;

async function initializeAdapter(): Promise<DatabaseAdapter> {
    if (adapterInstance) {
        return adapterInstance;
    }

    const config = await getServiceConfig();

    let adapter: DatabaseAdapter & { initialize(): Promise<void> };

    if (process.env['IS_OFFLINE'] === 'true') {
        const { LocalDatabaseAdapter } = (await import('./utils/localAdapter.js')) as unknown as {
            LocalDatabaseAdapter: LocalAdapterConstructor;
        };
        adapter = new LocalDatabaseAdapter({
            host: process.env['LOCAL_DB_HOST'] ?? 'localhost',
            port: Number(process.env['LOCAL_DB_PORT'] ?? '5433'),
            user: process.env['LOCAL_DB_USER'] ?? 'armoury',
            password: process.env['LOCAL_DB_PASSWORD'] ?? 'armoury_local',
            database: process.env['LOCAL_DB_NAME'] ?? 'armoury_matches',
            ssl: process.env['LOCAL_DB_SSL'] === 'true',
        });
    } else {
        container = createContainerWithModules(
            coreModule,
            createLambdaModule({
                clusterEndpoint: config.dsqlClusterEndpoint,
                region: config.dsqlRegion,
            }),
        );
        adapter = container.get<DatabaseAdapter>(TOKENS.DatabaseAdapter) as DatabaseAdapter & {
            initialize(): Promise<void>;
        };
    }

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
export const handler = Sentry.wrapHandler(async (event: HttpApiV2Event): Promise<ApiResponse> => {
    const normalized = normalizeEvent(event);

    Sentry.logger.info('[matches] Handler invoked', {
        httpMethod: normalized.httpMethod,
        path: normalized.path,
    });

    try {
        const adapter = await initializeAdapter();
        const userContext = extractUserContext(event);
        const response = await router(normalized, adapter, userContext);

        Sentry.logger.info('[matches] Handler completed', {
            httpMethod: normalized.httpMethod,
            path: normalized.path,
            statusCode: response.statusCode,
        });

        return response;
    } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));

        console.error(
            '[matches] Handler error',
            JSON.stringify({
                httpMethod: normalized.httpMethod,
                path: normalized.path,
                pathParameters: event.pathParameters,
                errorName: normalizedError.name,
                errorMessage: normalizedError.message,
                stack: normalizedError.stack,
                body: normalized.body,
                authorizer: event.requestContext.authorizer,
            }),
        );

        Sentry.captureException(error);

        return formatErrorResponse(normalizedError);
    }
});
