import type {
    CreateAccountPayload,
    CreateUserPayload,
    SystemPreferences,
    UpdateAccountPayload,
    UpdateUserPayload,
    UpsertUserPayload,
    UserPreferences,
} from '@/types.js';

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
 * Validates a create user request payload.
 *
 * @param body - Incoming request body.
 * @returns Parsed payload or error.
 */
export function parseCreateUser(body: unknown | null): CreateUserPayload | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const sub = body['sub'];
    const email = body['email'];
    const name = body['name'];
    const picture = body['picture'];

    if (!isString(sub)) {
        return new Error('Missing required field: sub');
    }

    if (!isString(email)) {
        return new Error('Missing required field: email');
    }

    if (!isString(name)) {
        return new Error('Missing required field: name');
    }

    if (picture !== null && picture !== undefined && !isString(picture)) {
        return new Error('Invalid picture value');
    }

    return {
        sub,
        email,
        name,
        picture: isString(picture) ? picture : null,
    };
}

/**
 * Validates an upsert user request payload from the Auth0 Post-Login Action.
 *
 * @param body - Incoming request body.
 * @returns Parsed payload or error.
 */
export function parseUpsertUser(body: unknown | null): UpsertUserPayload | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const sub = body['sub'];
    const email = body['email'];
    const name = body['name'];
    const picture = body['picture'];

    if (!isString(sub)) {
        return new Error('Missing required field: sub');
    }

    if (!isString(email)) {
        return new Error('Missing required field: email');
    }

    if (!isString(name)) {
        return new Error('Missing required field: name');
    }

    if (picture !== null && picture !== undefined && !isString(picture)) {
        return new Error('Invalid picture value');
    }

    return {
        sub,
        email,
        name,
        picture: isString(picture) ? picture : null,
    };
}

/**
 * Validates an update user request payload.
 *
 * @param body - Incoming request body.
 * @returns Parsed payload or error.
 */
export function parseUpdateUser(body: unknown | null): UpdateUserPayload | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const email = body['email'];
    const name = body['name'];
    const picture = body['picture'];

    if (email !== undefined && !isString(email)) {
        return new Error('Invalid email value');
    }

    if (name !== undefined && !isString(name)) {
        return new Error('Invalid name value');
    }

    if (picture !== undefined && picture !== null && !isString(picture)) {
        return new Error('Invalid picture value');
    }

    if (email === undefined && name === undefined && picture === undefined) {
        return new Error('No updates provided');
    }

    return {
        email: email ?? undefined,
        name: name ?? undefined,
        picture: picture === undefined ? undefined : isString(picture) ? picture : null,
    } as UpdateUserPayload;
}

/**
 * Type guard for UserPreferences objects.
 *
 * @param value - Unknown value to test.
 * @returns True when the value conforms to UserPreferences shape.
 */
export function isUserPreferences(value: unknown): value is UserPreferences {
    if (!isRecord(value)) {
        return false;
    }

    const theme = value['theme'];
    const language = value['language'];
    const notificationsEnabled = value['notificationsEnabled'];

    return (
        (theme === 'light' || theme === 'dark' || theme === 'auto') &&
        isString(language) &&
        isBoolean(notificationsEnabled)
    );
}

/**
 * Type guard for SystemPreferences objects.
 *
 * @param value - Unknown value to test.
 * @returns True when the value conforms to SystemPreferences shape.
 */
export function isSystemPreferences(value: unknown): value is SystemPreferences {
    if (!isRecord(value)) {
        return false;
    }

    const enabled = value['enabled'];
    const lastSyncedAt = value['lastSyncedAt'];

    return isBoolean(enabled) && (lastSyncedAt === null || isString(lastSyncedAt));
}

/**
 * Type guard for a Record of SystemPreferences.
 *
 * @param value - Unknown value to test.
 * @returns True when every value in the record is a valid SystemPreferences.
 */
export function isSystemPreferencesMap(value: unknown): value is Record<string, SystemPreferences> {
    if (!isRecord(value)) {
        return false;
    }

    return Object.values(value).every(isSystemPreferences);
}

/**
 * Validates a create account request payload.
 *
 * @param body - Incoming request body.
 * @returns Parsed payload or error.
 */
export function parseCreateAccount(body: unknown | null): CreateAccountPayload | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const preferences = body['preferences'];

    if (!isUserPreferences(preferences)) {
        return new Error('Missing or invalid required field: preferences');
    }

    return {
        preferences,
    };
}

/**
 * Validates an update account request payload.
 *
 * @param body - Incoming request body.
 * @returns Parsed payload or error.
 */
export function parseUpdateAccount(body: unknown | null): UpdateAccountPayload | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const preferences = body['preferences'];
    const systems = body['systems'];

    if (preferences !== undefined && !isUserPreferences(preferences)) {
        return new Error('Invalid preferences value');
    }

    if (systems !== undefined && !isSystemPreferencesMap(systems)) {
        return new Error('Invalid systems value');
    }

    if (preferences === undefined && systems === undefined) {
        return new Error('No updates provided');
    }

    return {
        preferences: isUserPreferences(preferences) ? preferences : undefined,
        systems: isSystemPreferencesMap(systems) ? systems : undefined,
    };
}
