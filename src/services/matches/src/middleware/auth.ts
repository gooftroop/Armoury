import type { UserContext } from '@matches/src/types.js';

/**
 * Minimal API Gateway event shape for Lambda TOKEN authorizer context.
 */
interface AuthorizerEvent {
    requestContext: {
        authorizer?: Record<string, unknown>;
    };
}

/**
 * Extracts user context from the Lambda TOKEN authorizer context.
 *
 * Lambda TOKEN authorizers return context values flat on
 * `event.requestContext.authorizer` (not nested under `.claims`).
 */
export function extractUserContext(event: AuthorizerEvent): UserContext {
    const authorizer = event.requestContext.authorizer;

    if (!authorizer || typeof authorizer !== 'object') {
        throw new Error('Missing authorizer context');
    }

    const sub = typeof authorizer['sub'] === 'string' ? authorizer['sub'] : null;
    const email = typeof authorizer['email'] === 'string' ? authorizer['email'] : null;
    const name = typeof authorizer['name'] === 'string' ? authorizer['name'] : null;

    if (!sub || !email || !name) {
        throw new Error('Missing required user context fields');
    }

    return {
        sub,
        email,
        name,
    };
}
