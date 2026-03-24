import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import type { WebSocketEvent } from '@friends/src/types.js';
import { captureWsError } from '@friends/src/utils/wsErrors.js';

const encoder = new TextEncoder();

type Broadcaster = {
    send: (connectionId: string, payload: unknown) => Promise<void>;
    sendToMany: (connectionIds: string[], payload: unknown) => Promise<string[]>;
};

export function createBroadcaster(event: WebSocketEvent): Broadcaster {
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const client = new ApiGatewayManagementApiClient({ endpoint });

    const send = async (connectionId: string, payload: unknown): Promise<void> => {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const command = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: encoder.encode(data),
        });

        await client.send(command);
    };

    const sendToMany = async (connectionIds: string[], payload: unknown): Promise<string[]> => {
        const goneConnections: string[] = [];

        await Promise.all(
            connectionIds.map(async (connectionId) => {
                try {
                    await send(connectionId, payload);
                } catch (error) {
                    if (isGoneError(error)) {
                        goneConnections.push(connectionId);

                        return;
                    }

                    const err = error instanceof Error ? error : new Error(String(error));

                    captureWsError(err, 'broadcast:send', { connectionId });

                    throw error;
                }
            }),
        );

        return goneConnections;
    };

    return { send, sendToMany };
}

export function isGoneError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;

    return metadata?.httpStatusCode === 410;
}
