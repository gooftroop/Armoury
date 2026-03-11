import type { SendFriendRequestPayload, UpdateFriendRequest } from '../types.ts';

/**
 * Type guard for records.
 *
 * @param value - Unknown value to test.
 * @returns True when the value is a record.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for strings.
 *
 * @param value - Unknown value to test.
 * @returns True when the value is a string.
 */
export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

/**
 * Type guard for booleans.
 *
 * @param value - Unknown value to test.
 * @returns True when the value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

/**
 * Validates a send friend request payload.
 *
 * @param body - Incoming request body.
 * @returns Parsed payload or error.
 */
export function parseSendFriendRequest(body: unknown | null): SendFriendRequestPayload | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const userId = body['userId'];

    if (!isString(userId)) {
        return new Error('Missing required field: userId');
    }

    return { userId };
}

/**
 * Validates an update friend request payload.
 *
 * @param body - Incoming request body.
 * @returns Parsed payload or error.
 */
export function parseUpdateFriendRequest(body: unknown | null): UpdateFriendRequest | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const status = body['status'];
    const canShareArmyLists = body['canShareArmyLists'];
    const canViewMatchHistory = body['canViewMatchHistory'];

    if (status !== undefined && !isString(status)) {
        return new Error('Invalid status value');
    }

    if (canShareArmyLists !== undefined && !isBoolean(canShareArmyLists)) {
        return new Error('Invalid canShareArmyLists value');
    }

    if (canViewMatchHistory !== undefined && !isBoolean(canViewMatchHistory)) {
        return new Error('Invalid canViewMatchHistory value');
    }

    if (status === undefined && canShareArmyLists === undefined && canViewMatchHistory === undefined) {
        return new Error('No updates provided');
    }

    return {
        status: status ?? undefined,
        canShareArmyLists: canShareArmyLists ?? undefined,
        canViewMatchHistory: canViewMatchHistory ?? undefined,
    } as UpdateFriendRequest;
}
