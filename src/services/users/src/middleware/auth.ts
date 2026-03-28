import type { UserContext } from '@/types.js';

/**
 * Minimal API Gateway v2 httpApi event shape for native JWT authorizer context.
 *
 * httpApi JWT authorizers nest claims under `authorizer.jwt.claims`.
 */
interface AuthorizerEvent {
    requestContext: {
        authorizer?: {
            jwt?: {
                claims?: Record<string, unknown>;
            };
        };
    };
}

/**
 * Extracts user context from the httpApi native JWT authorizer context.
 *
 * httpApi JWT authorizers return claims nested under
 * `event.requestContext.authorizer.jwt.claims`.
 */
export function extractUserContext(event: AuthorizerEvent): UserContext {
    const claims = event.requestContext.authorizer?.jwt?.claims;

    if (!claims || typeof claims !== 'object') {
        throw new Error('Missing authorizer context');
    }

    const sub = typeof claims['sub'] === 'string' ? claims['sub'] : null;
    const email = typeof claims['email'] === 'string' ? claims['email'] : undefined;
    const name = typeof claims['name'] === 'string' ? claims['name'] : undefined;

    if (!sub) {
        throw new Error('Missing required user context fields');
    }

    return { sub, email, name };
}
