import { INTERNAL_ID_CLAIM, M2M_GRANT_TYPE } from '@/types.js';
import type { JwtPayload, M2mPayload } from '@/types.js';

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

    if (
        !(INTERNAL_ID_CLAIM in payload) ||
        typeof (payload as Record<string, unknown>)[INTERNAL_ID_CLAIM] !== 'string'
    ) {
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

/**
 * Guards payloads to the expected M2M token shape.
 *
 * M2M tokens issued via the client_credentials grant include a `gty`
 * claim but lack user-specific claims like `internal_id`.
 *
 * @param payload - JWT payload to validate.
 * @returns True when payload matches the M2M token shape.
 */
export const isM2mPayload = (payload: unknown): payload is M2mPayload => {
    if (!payload || typeof payload !== 'object') {
        return false;
    }

    const p = payload as Record<string, unknown>;

    if (p['gty'] !== M2M_GRANT_TYPE) {
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
