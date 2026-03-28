import type { UserContext, WebSocketEvent } from '@/types.js';

export function extractWsUserContext(event: WebSocketEvent): UserContext | null {
    if (event.requestContext.eventType !== 'CONNECT') {
        return null;
    }

    const authorizer = event.requestContext.authorizer;

    if (!authorizer || typeof authorizer !== 'object') {
        return null;
    }

    const sub = typeof authorizer['sub'] === 'string' ? authorizer['sub'] : null;
    const email = typeof authorizer['email'] === 'string' ? authorizer['email'] : undefined;
    const name = typeof authorizer['name'] === 'string' ? authorizer['name'] : undefined;

    if (!sub) {
        return null;
    }

    return { sub, email, name };
}
