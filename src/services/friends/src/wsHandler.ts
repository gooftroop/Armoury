// Side-effect import: initializes Sentry before any handler code runs.
import './instrument.js';
import * as Sentry from '@sentry/aws-serverless';
import { captureWsError } from '@/utils/wsErrors.js';
import { extractWsUserContext } from '@/middleware/wsAuth.js';
import { wsRouter } from '@/wsRouter.js';
import type { DatabaseAdapter, WebSocketEvent, WebSocketResponse } from '@/types.js';
import { getServiceConfig } from '@/utils/secrets.js';

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

// Dynamic imports moved inside initializeAdapter() to avoid eager loading of
// LocalDatabaseAdapter (which depends on 'pg') when 'pg' is externalized by esbuild.

let adapterInstance: DatabaseAdapter | null = null;

async function initializeAdapter(): Promise<DatabaseAdapter> {
    if (adapterInstance) {
        return adapterInstance;
    }

    const config = await getServiceConfig();

    let adapter: DatabaseAdapter & { initialize(): Promise<void> };

    if (process.env['IS_OFFLINE'] === 'true') {
        const { LocalDatabaseAdapter } = (await import('@/utils/localAdapter.js')) as unknown as {
            LocalDatabaseAdapter: LocalAdapterConstructor;
        };
        adapter = new LocalDatabaseAdapter({
            host: process.env['LOCAL_DB_HOST'] ?? config.dsqlClusterEndpoint,
            port: Number(process.env['LOCAL_DB_PORT'] ?? '5432'),
            user: process.env['LOCAL_DB_USER'] ?? 'armoury',
            password: process.env['LOCAL_DB_PASSWORD'] ?? 'armoury_local',
            database: process.env['LOCAL_DB_NAME'] ?? 'armoury_friends',
            ssl: process.env['LOCAL_DB_SSL'] === 'true',
        });
    } else {
        const { DSQLAdapter } = (await import('@armoury/adapters-dsql')) as unknown as {
            DSQLAdapter: DSQLAdapterConstructor;
        };
        adapter = new DSQLAdapter({
            clusterEndpoint: config.dsqlClusterEndpoint,
            region: config.dsqlRegion,
        });
    }

    await adapter.initialize();

    adapterInstance = adapter;

    return adapter;
}

export const handler = Sentry.wrapHandler(async (event: WebSocketEvent): Promise<WebSocketResponse> => {
    try {
        Sentry.logger.info('[friends:ws] Handler invoked', {
            routeKey: event.requestContext.routeKey,
            connectionId: event.requestContext.connectionId,
        });

        const adapter = await initializeAdapter();
        const userContext = extractWsUserContext(event);
        const response = await wsRouter(event, adapter, userContext);

        return response;
    } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        const routeKey = event.requestContext.routeKey;
        const connectionId = event.requestContext.connectionId;

        captureWsError(normalizedError, 'adapter:init', {
            connectionId,
            routeKey,
        });

        // For non-$connect routes the WebSocket connection is already
        // established, so we can push a structured error frame to the
        // client before returning the failure status code.
        if (routeKey !== '$connect') {
            try {
                const { createBroadcaster } = await import('@/utils/broadcast.js');
                const broadcaster = createBroadcaster(event);

                await broadcaster.send(connectionId, {
                    action: 'error',
                    error: 'ServerError',
                    message: normalizedError.message || 'Unknown error',
                });
            } catch {
                // Best-effort — if the broadcast itself fails we still
                // return the 500 and let Sentry capture the original error.
            }
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'ServerError',
                message: normalizedError.message || 'Unknown error',
            }),
        };
    }
});
