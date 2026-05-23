import type { UserContext, WebSocketEvent } from '@/types.js';

/**
 * @requirements
 * - REQ-AUTH-WS: Extract UserContext from WebSocket CONNECT event using TOKEN authorizer context.
 * - REQ-AUTH-CLAIM: Read userId from `sub` claim (Auth0 subject identifier). TOKEN authorizer puts claims flat on authorizer object.
 */
export function extractWsUserContext(event: WebSocketEvent): UserContext | null {
    if (event.requestContext.eventType !== 'CONNECT') {
        return null;
    }

    const authorizer = event.requestContext.authorizer;

    if (!authorizer || typeof authorizer !== 'object') {
        return null;
    }

    const userId = typeof authorizer['sub'] === 'string' ? authorizer['sub'] : null;
    const email = typeof authorizer['email'] === 'string' ? authorizer['email'] : undefined;
    const name = typeof authorizer['name'] === 'string' ? authorizer['name'] : undefined;

    if (!userId) {
        return null;
    }

    return { userId, email, name };
}
