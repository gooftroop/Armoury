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

const { DSQLAdapter } = (await import('@armoury/adapters-dsql')) as unknown as { DSQLAdapter: DSQLAdapterConstructor };
const { LocalDatabaseAdapter } = (await import('@/utils/localAdapter.js')) as unknown as {
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

export async function handler(event: WebSocketEvent): Promise<WebSocketResponse> {
    try {
        const adapter = await initializeAdapter();
        const userContext = event.requestContext.routeKey === '$connect' ? extractWsUserContext(event) : null;
        const response = await wsRouter(event, adapter, userContext);

        return response;
    } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));

        captureWsError(normalizedError, 'adapter:init', {
            connectionId: event.requestContext.connectionId,
            routeKey: event.requestContext.routeKey,
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'ServerError',
                message: normalizedError.message || 'Unknown error',
            }),
        };
    }
}
