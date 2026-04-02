import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { captureWsError } from '@/utils/wsErrors.js';

const encoder = new TextEncoder();

export interface Broadcaster {
    send(connectionId: string, data: unknown): Promise<boolean>;
    sendToMany(connectionIds: string[], data: unknown): Promise<string[]>;
}

export function createBroadcaster(domainName: string, stage: string): Broadcaster {
    const endpoint = `https://${domainName}/${stage}`;
    const client = new ApiGatewayManagementApiClient({ endpoint });

    async function send(connectionId: string, data: unknown): Promise<boolean> {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);

        try {
            const command = new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: encoder.encode(payload),
            });

            await client.send(command);

            return false;
        } catch (error: unknown) {
            if (isGoneError(error)) {
                return true;
            }

            const err = error instanceof Error ? error : new Error(String(error));

            captureWsError(err, 'broadcast:send', { connectionId });

            throw error;
        }
    }

    async function sendToMany(connectionIds: string[], data: unknown): Promise<string[]> {
        const results = await Promise.allSettled(connectionIds.map((id) => send(id, data)));
        const staleConnectionIds: string[] = [];

        for (let i = 0; i < results.length; i++) {
            const result = results[i];

            if (!result) {
                continue;
            }

            if (result.status === 'fulfilled' && result.value) {
                const connectionId = connectionIds[i];

                if (connectionId) {
                    staleConnectionIds.push(connectionId);
                }
            }

            if (result.status === 'rejected') {
                const connectionId = connectionIds[i];

                console.error(
                    `[broadcast] sendToMany failed for connection ${connectionId ?? 'unknown'}`,
                    result.reason,
                );
            }
        }

        return staleConnectionIds;
    }

    return { send, sendToMany };
}

function isGoneError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    const statusCode =
        (error as Record<string, unknown>)['statusCode'] ?? (error as Record<string, unknown>)['$metadata'];

    if (typeof statusCode === 'number') {
        return statusCode === 410;
    }

    if (typeof statusCode === 'object' && statusCode !== null) {
        const httpStatusCode = (statusCode as Record<string, unknown>)['httpStatusCode'];

        return httpStatusCode === 410;
    }

    return false;
}
