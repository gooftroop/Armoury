import type { DatabaseAdapter, UserContext, WebSocketEvent, WebSocketResponse, WsRouteHandler } from './types.ts';
import {
    handleSubscribeMatch,
    handleUnsubscribeMatch,
    handleUpdateMatch,
    handleWsConnect,
    handleWsDefault,
    handleWsDisconnect,
} from './routes/wsMatches.ts';

const ROUTE_MAP: Record<string, WsRouteHandler> = {
    $connect: handleWsConnect,
    $disconnect: handleWsDisconnect,
    $default: handleWsDefault,
    updateMatch: handleUpdateMatch,
    subscribeMatch: handleSubscribeMatch,
    unsubscribeMatch: handleUnsubscribeMatch,
};

export async function wsRouter(
    event: WebSocketEvent,
    adapter: DatabaseAdapter,
    userContext: UserContext | null,
): Promise<WebSocketResponse> {
    const routeHandler = ROUTE_MAP[event.requestContext.routeKey];

    if (!routeHandler) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'NotFound',
                message: 'Route not found',
            }),
        };
    }

    return routeHandler(event, adapter, userContext);
}
