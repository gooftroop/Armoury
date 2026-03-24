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
        userId: userContext.sub,
        status: ONLINE_STATUS,
        connectionId,
        lastActiveAt: now,
    };

    try {
        await adapter.put('userPresence', presence);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: userContext.sub,
            operation: 'put',
            store: 'userPresence',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    let acceptedFriends: Friend[];

    try {
        acceptedFriends = await getAcceptedFriends(adapter, userContext.sub);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: userContext.sub,
            operation: 'getByField',
            store: 'friend',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    const friendUserIds = acceptedFriends.map((friend) => friend.userId);

    let connectionIds: string[];

    try {
        connectionIds = await getConnectionIds(adapter, friendUserIds);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: userContext.sub,
            operation: 'get',
            store: 'userPresence',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    const broadcaster = createBroadcaster(event);

    try {
        const goneConnections = await broadcaster.sendToMany(connectionIds, {
            action: 'friendOnline',
            userId: userContext.sub,
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
            userId: userContext.sub,
            targetCount: connectionIds.length,
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
    let presences: UserPresence[];

    try {
        presences = await adapter.getByField('userPresence', 'connectionId', connectionId);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            operation: 'getByField',
            store: 'userPresence',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

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
        lastActiveAt: now,
    };

    try {
        await adapter.put('userPresence', updatedPresence);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: presence.userId,
            operation: 'put',
            store: 'userPresence',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    let acceptedFriends: Friend[];

    try {
        acceptedFriends = await getAcceptedFriends(adapter, presence.userId);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: presence.userId,
            operation: 'getByField',
            store: 'friend',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    const friendUserIds = acceptedFriends.map((friend) => friend.userId);

    let connectionIds: string[];

    try {
        connectionIds = await getConnectionIds(adapter, friendUserIds);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: presence.userId,
            operation: 'get',
            store: 'userPresence',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    const broadcaster = createBroadcaster(event);

    try {
        await broadcaster.sendToMany(connectionIds, {
            action: 'friendOffline',
            userId: presence.userId,
        });
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'broadcast:send', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: presence.userId,
            targetCount: connectionIds.length,
        });
    }

    return {
        statusCode: 200,
    };
};

export const handleWsDefault: WsRouteHandler = async (): Promise<WebSocketResponse> => {
    return {
        statusCode: 400,
        body: JSON.stringify({
            error: 'UnknownAction',
            message: 'Unsupported action',
        }),
    };
};

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
        lastActiveAt: now,
    }));

    await Promise.all(updates.map((presence) => adapter.put('userPresence', presence)));
}
