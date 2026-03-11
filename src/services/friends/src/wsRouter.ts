import type { DatabaseAdapter, UserContext, WebSocketEvent, WebSocketResponse, WsRouteHandler } from './types.ts';
import { handleWsConnect, handleWsDefault, handleWsDisconnect } from './routes/wsPresence.ts';

const ROUTE_MAP: Record<string, WsRouteHandler> = {
    $connect: handleWsConnect,
    $disconnect: handleWsDisconnect,
    $default: handleWsDefault,
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
