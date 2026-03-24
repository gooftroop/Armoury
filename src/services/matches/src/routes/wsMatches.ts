import type {
    DatabaseAdapter,
    Match,
    MatchSubscription,
    WebSocketResponse,
    WsConnection,
    WsRouteHandler,
} from '@matches/src/types.js';
import { createBroadcaster } from '@matches/src/utils/broadcast.js';
import { captureWsError } from '@matches/src/utils/wsErrors.js';
import {
    parseSubscribeMatchMessage,
    parseUnsubscribeMatchMessage,
    parseUpdateMatchMessage,
} from '@matches/src/utils/validation.js';

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
    const connection: WsConnection = {
        connectionId,
        userId: userContext.sub,
        connectedAt: now,
    };

    try {
        await adapter.put('wsConnection', connection);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: userContext.sub,
            operation: 'put',
            store: 'wsConnection',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    return { statusCode: 200 };
};

export const handleWsDisconnect: WsRouteHandler = async (
    event,
    adapter: DatabaseAdapter,
    _userContext,
): Promise<WebSocketResponse> => {
    const connectionId = event.requestContext.connectionId;

    try {
        const subscriptions = await adapter.getByField('matchSubscription', 'connectionId', connectionId);

        await adapter.delete('wsConnection', connectionId);

        if (subscriptions.length > 0) {
            await Promise.all(subscriptions.map((subscription) => adapter.delete('matchSubscription', subscription.id)));
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            operation: 'delete',
            store: 'wsConnection',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    return { statusCode: 200 };
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

export const handleUpdateMatch: WsRouteHandler = async (
    event,
    adapter: DatabaseAdapter,
    _userContext,
): Promise<WebSocketResponse> => {
    const parsedBody = parseMessageBody(event);

    if (parsedBody instanceof Error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'ValidationError',
                message: parsedBody.message,
            }),
        };
    }

    const request = parseUpdateMatchMessage(parsedBody);

    if (request instanceof Error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'ValidationError',
                message: request.message,
            }),
        };
    }

    const connectionId = event.requestContext.connectionId;

    let connection: WsConnection | null;

    try {
        connection = await adapter.get('wsConnection', connectionId) as WsConnection | null;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            operation: 'get',
            store: 'wsConnection',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    if (!connection) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                error: 'Unauthorized',
                message: 'Missing connection context',
            }),
        };
    }

    let match: Match | null;

    try {
        match = await adapter.get('match', request.matchId) as Match | null;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: connection.userId,
            operation: 'get',
            store: 'match',
            matchId: request.matchId,
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    if (!match) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'NotFound',
                message: 'Match not found',
            }),
        };
    }

    const existingMatch = match;
    const isPlayer = existingMatch.players.some((p) => p.playerId === connection.userId);

    if (!isPlayer) {
        return {
            statusCode: 403,
            body: JSON.stringify({
                error: 'Forbidden',
                message: 'Only match players can update',
            }),
        };
    }

    const updated: Match = {
        ...existingMatch,
        turn: request.data.turn ?? existingMatch.turn,
        score: request.data.score !== undefined ? request.data.score : existingMatch.score,
        outcome: request.data.outcome ?? existingMatch.outcome,
        matchData: request.data.matchData !== undefined ? request.data.matchData : existingMatch.matchData,
        notes: request.data.notes ?? existingMatch.notes,
        updatedAt: new Date().toISOString(),
    };

    try {
        await adapter.put('match', updated);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: connection.userId,
            operation: 'put',
            store: 'match',
            matchId: request.matchId,
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    let subscriptions: MatchSubscription[];

    try {
        subscriptions = await adapter.getByField('matchSubscription', 'matchId', request.matchId);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: connection.userId,
            operation: 'getByField',
            store: 'matchSubscription',
            matchId: request.matchId,
        });

        return { statusCode: 200 };
    }

    const connectionIds = subscriptions
        .map((subscription) => subscription.connectionId)
        .filter((id) => id !== connectionId);

    if (connectionIds.length > 0) {
        try {
            const broadcaster = createBroadcaster(event.requestContext.domainName, event.requestContext.stage);
            const goneConnections = await broadcaster.sendToMany(connectionIds, {
                action: 'matchUpdated',
                matchId: request.matchId,
                data: updated,
            });

            if (goneConnections.length > 0) {
                await cleanupGoneConnections(adapter, goneConnections);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));

            captureWsError(err, 'broadcast:send', {
                connectionId,
                routeKey: event.requestContext.routeKey,
                userId: connection.userId,
                matchId: request.matchId,
                targetCount: connectionIds.length,
            });
        }
    }

    return { statusCode: 200 };
};

export const handleSubscribeMatch: WsRouteHandler = async (
    event,
    adapter: DatabaseAdapter,
    _userContext,
): Promise<WebSocketResponse> => {
    const parsedBody = parseMessageBody(event);

    if (parsedBody instanceof Error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'ValidationError',
                message: parsedBody.message,
            }),
        };
    }

    const request = parseSubscribeMatchMessage(parsedBody);

    if (request instanceof Error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'ValidationError',
                message: request.message,
            }),
        };
    }

    const connectionId = event.requestContext.connectionId;

    let connection: WsConnection | null;

    try {
        connection = await adapter.get('wsConnection', connectionId) as WsConnection | null;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            operation: 'get',
            store: 'wsConnection',
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    if (!connection) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                error: 'Unauthorized',
                message: 'Missing connection context',
            }),
        };
    }

    let match: Match | null;

    try {
        match = await adapter.get('match', request.matchId) as Match | null;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: connection.userId,
            operation: 'get',
            store: 'match',
            matchId: request.matchId,
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    if (!match) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'NotFound',
                message: 'Match not found',
            }),
        };
    }

    const existingMatch = match;
    const isPlayer = existingMatch.players.some((p) => p.playerId === connection.userId);

    if (!isPlayer) {
        return {
            statusCode: 403,
            body: JSON.stringify({
                error: 'Forbidden',
                message: 'Not authorized to subscribe',
            }),
        };
    }

    const subscriptionId = `${connectionId}:${request.matchId}`;
    const subscription: MatchSubscription = {
        id: subscriptionId,
        connectionId,
        matchId: request.matchId,
        userId: connection.userId,
    };

    try {
        await adapter.put('matchSubscription', subscription);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: connection.userId,
            operation: 'put',
            store: 'matchSubscription',
            matchId: request.matchId,
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    try {
        const broadcaster = createBroadcaster(event.requestContext.domainName, event.requestContext.stage);
        const shouldCleanup = await broadcaster.send(connectionId, {
            action: 'matchState',
            matchId: request.matchId,
            data: existingMatch,
        });

        if (shouldCleanup) {
            await cleanupGoneConnections(adapter, [connectionId]);
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'broadcast:send', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            userId: connection.userId,
            matchId: request.matchId,
        });
    }

    return { statusCode: 200 };
};

export const handleUnsubscribeMatch: WsRouteHandler = async (
    event,
    adapter: DatabaseAdapter,
    _userContext,
): Promise<WebSocketResponse> => {
    const parsedBody = parseMessageBody(event);

    if (parsedBody instanceof Error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'ValidationError',
                message: parsedBody.message,
            }),
        };
    }

    const request = parseUnsubscribeMatchMessage(parsedBody);

    if (request instanceof Error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'ValidationError',
                message: request.message,
            }),
        };
    }

    const connectionId = event.requestContext.connectionId;
    const subscriptionId = `${connectionId}:${request.matchId}`;

    try {
        await adapter.delete('matchSubscription', subscriptionId);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        captureWsError(err, 'db:operation', {
            connectionId,
            routeKey: event.requestContext.routeKey,
            operation: 'delete',
            store: 'matchSubscription',
            matchId: request.matchId,
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'DatabaseError',
                message: err.message,
            }),
        };
    }

    return { statusCode: 200 };
};

function parseMessageBody(event: { body: string | null }): unknown {
    if (!event.body) {
        return new Error('Missing body');
    }

    try {
        return JSON.parse(event.body);
    } catch (error) {
        return error instanceof Error ? error : new Error('Invalid JSON');
    }
}

async function cleanupGoneConnections(adapter: DatabaseAdapter, connectionIds: string[]): Promise<void> {
    const subscriptionBatches = await Promise.all(
        connectionIds.map((connectionId) => adapter.getByField('matchSubscription', 'connectionId', connectionId)),
    );
    const subscriptions = subscriptionBatches.flat();

    if (subscriptions.length > 0) {
        await Promise.all(subscriptions.map((subscription) => adapter.delete('matchSubscription', subscription.id)));
    }

    await Promise.all(connectionIds.map((connectionId) => adapter.delete('wsConnection', connectionId)));
}
