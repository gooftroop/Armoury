import * as Sentry from '@sentry/aws-serverless';
import type { DatabaseAdapter, Friend, UserPresence, WebSocketResponse, WsRouteHandler } from '@/types.js';
import { createBroadcaster } from '@/utils/broadcast.js';
import { captureWsError } from '@/utils/wsErrors.js';

const ONLINE_STATUS: UserPresence['status'] = 'online';
const OFFLINE_STATUS: UserPresence['status'] = 'offline';

export const handleWsConnect: WsRouteHandler = async (
    event,
    adapter: DatabaseAdapter,
    userContext,
): Promise<WebSocketResponse> => {
    if (!userContext) {
        console.error(
            '[wsPresence:handleWsConnect] 401 Missing user context',
            JSON.stringify({
                connectionId: event.requestContext.connectionId,
                routeKey: event.requestContext.routeKey,
            }),
        );

        return {
            statusCode: 401,
            body: JSON.stringify({
                error: 'Unauthorized',
                message: 'Missing user context',
            }),
        };
    }

    const now = new Date().toISOString();
    const connectionId = event.requestContext.connectionId;
    const presence: UserPresence = {
        userId: userContext.userId,
        status: ONLINE_STATUS,
        connectionId,
        lastSeen: now,
    };

    try {
        await adapter.put('userPresence', presence);
    } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));

        captureWsError(normalizedError, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: userContext.userId,
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'ServerError',
                message: 'Failed to establish presence',
            }),
        };
    }

    Sentry.addBreadcrumb({
        category: 'websocket.connect',
        message: `WebSocket connection established for user ${userContext.userId}`,
        level: 'info',
        data: {
            connectionId,
            userId: userContext.userId,
            userName: userContext.name,
            timestamp: now,
        },
    });

    // Best-effort friend notification — failures here should not
    // prevent the $connect from succeeding since presence is already stored.
    try {
        const acceptedFriends = await getAcceptedFriends(adapter, userContext.userId);
        const friendUserIds = acceptedFriends.map((friend) => friend.userId);
        const connectionIds = await getConnectionIds(adapter, friendUserIds);
        const broadcaster = createBroadcaster(event);
        const goneConnections = await broadcaster.sendToMany(connectionIds, {
            action: 'friendOnline',
            userId: userContext.userId,
            name: userContext.name,
        });

        if (goneConnections.length > 0) {
            await markConnectionsOffline(adapter, goneConnections);
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'broadcast:send', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: userContext.userId,
        });
    }

    return {
        statusCode: 200,
    };
};

export const handleWsDisconnect: WsRouteHandler = async (
    event,
    adapter: DatabaseAdapter,
): Promise<WebSocketResponse> => {
    const connectionId = event.requestContext.connectionId;

    try {
        const presences = await adapter.getByField('userPresence', 'connectionId', connectionId);
        const presence = presences[0];

        if (!presence) {
            return {
                statusCode: 200,
            };
        }

        const now = new Date().toISOString();
        const updatedPresence: UserPresence = {
            ...presence,
            status: OFFLINE_STATUS,
            connectionId: null,
            lastSeen: now,
        };

        await adapter.put('userPresence', updatedPresence);

        Sentry.addBreadcrumb({
            category: 'websocket.disconnect',
            message: `WebSocket connection closed for user ${presence.userId}`,
            level: 'info',
            data: {
                connectionId,
                userId: presence.userId,
                timestamp: now,
            },
        });

        const acceptedFriends = await getAcceptedFriends(adapter, presence.userId);
        const friendUserIds = acceptedFriends.map((friend) => friend.userId);
        const connectionIds = await getConnectionIds(adapter, friendUserIds);
        const broadcaster = createBroadcaster(event);

        await broadcaster.sendToMany(connectionIds, {
            action: 'friendOffline',
            userId: presence.userId,
        });
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
        });
    }

    return {
        statusCode: 200,
    };
};

export const handleWsDefault: WsRouteHandler = async (event): Promise<WebSocketResponse> => {
    const body = parseBody(event);

    if (body?.action === 'ping') {
        const broadcaster = createBroadcaster(event);
        await broadcaster.send(event.requestContext.connectionId, { action: 'pong' });

        return { statusCode: 200 };
    }

    console.error(
        '[wsPresence:handleWsDefault] 400 Unsupported action',
        JSON.stringify({
            connectionId: event.requestContext.connectionId,
            routeKey: event.requestContext.routeKey,
        }),
    );

    return {
        statusCode: 400,
        body: JSON.stringify({
            error: 'UnknownAction',
            message: 'Unsupported action',
        }),
    };
};

function parseBody(event: { body?: string | null }): Record<string, unknown> | null {
    if (!event.body) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(event.body);

        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}

async function getAcceptedFriends(adapter: DatabaseAdapter, ownerId: string): Promise<Friend[]> {
    const friends = await adapter.getByField('friend', 'ownerId', ownerId);

    return friends.filter((friend) => friend.status === 'accepted');
}

async function getConnectionIds(adapter: DatabaseAdapter, userIds: string[]): Promise<string[]> {
    const presences = await Promise.all(userIds.map((id) => adapter.get('userPresence', id)));

    return presences
        .filter((presence): presence is UserPresence => Boolean(presence && presence.connectionId))
        .map((presence) => presence.connectionId as string);
}

async function markConnectionsOffline(adapter: DatabaseAdapter, connectionIds: string[]): Promise<void> {
    const presenceBatches = await Promise.all(
        connectionIds.map(async (connectionId) => adapter.getByField('userPresence', 'connectionId', connectionId)),
    );
    const presences = presenceBatches.flat();
    const now = new Date().toISOString();
    const updates = presences.map((presence) => ({
        ...presence,
        status: OFFLINE_STATUS,
        connectionId: null,
        lastSeen: now,
    }));

    await Promise.all(updates.map((presence) => adapter.put('userPresence', presence)));
}
