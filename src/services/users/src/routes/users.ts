import { randomUUID } from 'node:crypto';

import type {
    Account,
    ApiResponse,
    DatabaseAdapter,
    PathParameters,
    RouteHandler,
    User,
    UserContext,
} from '@/types.js';
import { resolveUser } from '@/utils/resolveUser.js';
import { errorResponse, jsonResponse } from '@/utils/response.js';
import { parseCreateUser, parseUpdateUser, parseUpsertUser } from '@/utils/validation.js';

/** Default preferences applied when auto-creating an account on first login. */
const DEFAULT_PREFERENCES = {
    theme: 'auto' as const,
    language: 'en',
    notificationsEnabled: false,
};

/**
 * Creates a new user.
 *
 * Validates the request body via parseCreateUser and stores the
 * user entity with a generated UUID.
 *
 * @param adapter - Database adapter instance.
 * @param body - Request body containing user details.
 * @param _pathParameters - Unused path parameters.
 * @param _userContext - Unused authenticated user context.
 * @returns 201 with the created user entity.
 */
export const createUser: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const request = parseCreateUser(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const now = new Date().toISOString();

    const user: User = {
        id: request.id,
        email: request.email,
        name: request.name,
        picture: request.picture,
        accountId: null,
        createdAt: now,
        updatedAt: now,
    };

    await adapter.put('user', user);

    return jsonResponse(201, user);
};

/**
 * Lists all users.
 *
 * Returns all user entities from the database.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param _pathParameters - Unused path parameters.
 * @param _userContext - Unused authenticated user context.
 * @returns 200 with array of user entities.
 */
export const listUsers: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const users = await adapter.getAll('user');

    return jsonResponse(200, users);
};

/**
 * Retrieves a single user by ID.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param pathParameters - Path parameters containing the user ID.
 * @param _userContext - Unused authenticated user context.
 * @returns 200 with the user entity, or 404 if not found.
 */
export const getUser: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const userId = pathParameters?.id;

    if (!userId) {
        return errorResponse(400, 'ValidationError', 'Missing user id');
    }

    const user = await resolveUser(adapter, userId);

    if (!user) {
        console.error('[users:getUser] 404 User not found', JSON.stringify({ userId }));

        return errorResponse(404, 'NotFound', 'User not found');
    }

    return jsonResponse(200, user);
};

/**
 * Updates an existing user by ID.
 *
 * Validates the request body via parseUpdateUser, merges with the
 * existing user entity, and stores the updated result.
 *
 * @param adapter - Database adapter instance.
 * @param body - Request body with fields to update.
 * @param pathParameters - Path parameters containing the user ID.
 * @param _userContext - Unused authenticated user context.
 * @returns 200 with the updated user entity, or 404 if not found.
 */
export const updateUser: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const userId = pathParameters?.id;

    if (!userId) {
        return errorResponse(400, 'ValidationError', 'Missing user id');
    }

    const request = parseUpdateUser(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const existing = await resolveUser(adapter, userId);

    if (!existing) {
        console.error('[users:updateUser] 404 User not found', JSON.stringify({ userId }));

        return errorResponse(404, 'NotFound', 'User not found');
    }

    const now = new Date().toISOString();
    const updated: User = {
        ...existing,
        email: request.email ?? existing.email,
        name: request.name ?? existing.name,
        picture: request.picture !== undefined ? request.picture : existing.picture,
        updatedAt: now,
    };

    await adapter.put('user', updated);

    return jsonResponse(200, updated);
};

/**
 * Deletes a user by ID.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param pathParameters - Path parameters containing the user ID.
 * @param _userContext - Unused authenticated user context.
 * @returns 204 on success, or 404 if not found.
 */
export const deleteUser: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const userId = pathParameters?.id;

    if (!userId) {
        return errorResponse(400, 'ValidationError', 'Missing user id');
    }

    const existing = await resolveUser(adapter, userId);

    if (!existing) {
        console.error('[users:deleteUser] 404 User not found', JSON.stringify({ userId }));

        return errorResponse(404, 'NotFound', 'User not found');
    }

    await adapter.delete('user', existing.id);

    return {
        statusCode: 204,
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    };
};

/**
 * Upserts a user on login.
 *
 * Called by the Auth0 Post-Login Action via an M2M token. The user's
 * Auth0 `sub` IS their primary key (`id`). Creates a new record on first
 * login or updates profile fields on subsequent logins.
 *
 * @param adapter - Database adapter instance.
 * @param body - Request body containing user details from Auth0.
 * @param _pathParameters - Unused path parameters.
 * @param _userContext - Unused authenticated user context (M2M tokens lack user context).
 * @returns 200 with the upserted user entity.
 */
export const upsertUser: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const request = parseUpsertUser(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    // Wrap read + writes in a single transaction so concurrent first-logins
    // for the same Auth0 sub cannot produce orphan accounts or duplicate rows.
    // Re-check existence inside the transaction; PK conflict on `user` (id = sub)
    // is the ultimate guard if two transactions race past the initial check.
    //
    // Idempotency: if a concurrent request wins the PK race, the losing
    // transaction throws a unique-violation error. Catch it, re-fetch the
    // committed user, and return it so the caller sees a successful upsert
    // instead of a 5xx error.
    const runUpsert = async (): Promise<User> =>
        adapter.transaction(async (): Promise<User> => {
            const existing = await adapter.get('user', request.id);
            const now = new Date().toISOString();

            if (existing) {
                const updated: User = {
                    ...existing,
                    email: request.email,
                    name: request.name,
                    picture: request.picture,
                    updatedAt: now,
                };

                await adapter.put('user', updated);

                return updated;
            }

            const userId = request.id;
            const accountId = randomUUID();

            const account: Account = {
                id: accountId,
                userId,
                preferences: DEFAULT_PREFERENCES,
                systems: {},
                createdAt: now,
                updatedAt: now,
            };

            const user: User = {
                id: userId,
                email: request.email,
                name: request.name,
                picture: request.picture,
                accountId,
                createdAt: now,
                updatedAt: now,
            };

            await adapter.put('account', account);
            await adapter.put('user', user);

            return user;
        });

    let result: User;

    try {
        result = await runUpsert();
    } catch (error) {
        // Detect unique/PK violation from a concurrent first-login race.
        // Adapters surface this differently (Postgres SQLSTATE 23505,
        // SQLite UNIQUE constraint, generic message). We match broadly
        // and then re-fetch; if the user is now present, return it.
        const message = error instanceof Error ? error.message : String(error);
        const isConflict = /unique|duplicate|conflict|23505|constraint/i.test(message);

        if (!isConflict) {
            throw error;
        }

        const committed = await adapter.get('user', request.id);

        if (!committed) {
            throw error;
        }

        result = committed as User;
    }

    return jsonResponse(200, result);
};
