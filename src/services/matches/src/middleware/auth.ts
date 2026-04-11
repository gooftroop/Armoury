import type { UserContext } from '@/types.js';

const INTERNAL_ID_CLAIM = 'https://armoury.app/internal_id';
const EMAIL_CLAIM = 'https://armoury.app/email';
const NAME_CLAIM = 'https://armoury.app/name';

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

    const userId = typeof claims[INTERNAL_ID_CLAIM] === 'string' ? claims[INTERNAL_ID_CLAIM] : null;
    const email = typeof claims[EMAIL_CLAIM] === 'string' ? claims[EMAIL_CLAIM] : undefined;
    const name = typeof claims[NAME_CLAIM] === 'string' ? claims[NAME_CLAIM] : undefined;

    if (!userId) {
        throw new Error('Missing required user context fields');
    }

    return { userId, email, name };
}
