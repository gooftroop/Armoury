import * as Sentry from '@sentry/aws-serverless';
import { extractWsUserContext } from '@friends/src/middleware/wsAuth.js';
import { wsRouter } from '@friends/src/wsRouter.js';
import type { DatabaseAdapter, WebSocketEvent, WebSocketResponse } from '@friends/src/types.js';
import { getServiceConfig } from '@friends/src/utils/secrets.js';

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

const { DSQLAdapter } = await import('@armoury/data') as unknown as { DSQLAdapter: DSQLAdapterConstructor };
const { LocalDatabaseAdapter } = await import('@friends/src/utils/localAdapter.js') as unknown as {
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
                  host: process.env['LOCAL_DB_HOST'] ?? config.dsqlClusterEndpoint,
                  port: Number(process.env['LOCAL_DB_PORT'] ?? '5432'),
                  user: process.env['LOCAL_DB_USER'] ?? 'armoury',
                  password: process.env['LOCAL_DB_PASSWORD'] ?? 'armoury_local',
                  database: process.env['LOCAL_DB_NAME'] ?? 'armoury_friends',
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
        const userContext = extractWsUserContext(event);
        const response = await wsRouter(event, adapter, userContext);

        return response;
    } catch (error) {
        console.error('Friends websocket handler error', error);
        Sentry.captureException(error);

        const normalizedError = error instanceof Error ? error : new Error('Unknown error');

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'ServerError',
                message: normalizedError.message || 'Unknown error',
            }),
        };
    }
}
