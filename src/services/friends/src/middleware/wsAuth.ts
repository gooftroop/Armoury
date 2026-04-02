import type { UserContext, WebSocketEvent } from '@/types.js';

/**
 * @requirements
 * - REQ-AUTH-WS: Extract UserContext from WebSocket CONNECT event using TOKEN authorizer context.
 * - REQ-AUTH-CLAIM: Read internal_id from flat authorizer context (TOKEN authorizer puts claims flat on authorizer, not nested under jwt.claims).
 */
export function extractWsUserContext(event: WebSocketEvent): UserContext | null {
    if (event.requestContext.eventType !== 'CONNECT') {
        return null;
    }

    const authorizer = event.requestContext.authorizer;

    if (!authorizer || typeof authorizer !== 'object') {
        return null;
    }

    const userId =
        typeof authorizer['https://armoury.app/internal_id'] === 'string'
            ? authorizer['https://armoury.app/internal_id']
            : null;
    const email = typeof authorizer['email'] === 'string' ? authorizer['email'] : undefined;
    const name = typeof authorizer['name'] === 'string' ? authorizer['name'] : undefined;

    if (!userId) {
        return null;
    }

    return { userId, email, name };
}
