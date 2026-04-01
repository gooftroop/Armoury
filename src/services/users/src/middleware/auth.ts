import type { UserContext } from '@/types.js';

const INTERNAL_ID_CLAIM = 'https://armoury.app/internal_id';
const M2M_GRANT_TYPE = 'client-credentials';

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
 *
 * M2M tokens (client_credentials grant) lack user-specific claims.
 * When an M2M token is detected, a sentinel context with `userId` set
 * to `'m2m'` is returned so callers can distinguish M2M requests.
 */
export function extractUserContext(event: AuthorizerEvent): UserContext {
    const claims = event.requestContext.authorizer?.jwt?.claims;

    if (!claims || typeof claims !== 'object') {
        throw new Error('Missing authorizer context');
    }

    if (claims['gty'] === M2M_GRANT_TYPE) {
        return { userId: 'm2m' };
    }

    const userId = typeof claims[INTERNAL_ID_CLAIM] === 'string' ? claims[INTERNAL_ID_CLAIM] : null;
    const email = typeof claims['email'] === 'string' ? claims['email'] : undefined;
    const name = typeof claims['name'] === 'string' ? claims['name'] : undefined;

    if (!userId) {
        throw new Error('Missing required user context fields');
    }

    return { userId, email, name };
}
