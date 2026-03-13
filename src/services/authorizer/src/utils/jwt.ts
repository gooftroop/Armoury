import type { JwtPayload } from '@/types.js';

/**
 * Guards payloads to the expected JWT shape for the authorizer.
 *
 * @param payload - JWT payload to validate.
 * @returns True when payload matches the expected shape.
 */
export const isJwtPayload = (payload: unknown): payload is JwtPayload => {
    if (!payload || typeof payload !== 'object') {
        return false;
    }

    if (!('sub' in payload) || typeof payload.sub !== 'string') {
        return false;
    }

    if (!('aud' in payload) || !('iss' in payload)) {
        return false;
    }

    if (typeof payload.iss !== 'string') {
        return false;
    }

    const audience = payload.aud;

    if (typeof audience !== 'string' && !Array.isArray(audience)) {
        return false;
    }

    return true;
};
