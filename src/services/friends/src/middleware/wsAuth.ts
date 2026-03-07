import type { UserContext, WebSocketEvent } from '@friends/src/types.js';

export function extractWsUserContext(event: WebSocketEvent): UserContext | null {
    if (event.requestContext.eventType !== 'CONNECT') {
        return null;
    }

    const authorizer = event.requestContext.authorizer;

    if (!authorizer || typeof authorizer !== 'object') {
        return null;
    }

    const sub = typeof authorizer['sub'] === 'string' ? authorizer['sub'] : null;
    const email = typeof authorizer['email'] === 'string' ? authorizer['email'] : null;
    const name = typeof authorizer['name'] === 'string' ? authorizer['name'] : null;

    if (!sub || !email || !name) {
        return null;
    }

    return { sub, email, name };
}
