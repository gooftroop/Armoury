import { randomUUID } from 'node:crypto';

import type {
    ApiResponse,
    DatabaseAdapter,
    PathParameters,
    RouteHandler,
    User,
    UserContext,
} from '@users/src/types.js';
import { errorResponse, jsonResponse } from '@users/src/utils/response.js';
import { parseCreateUser, parseUpdateUser } from '@users/src/utils/validation.js';

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
        id: randomUUID(),
        sub: request.sub,
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

    const user = await adapter.get('user', userId);

    if (!user) {
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

    const existing = await adapter.get('user', userId);

    if (!existing) {
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

    const existing = await adapter.get('user', userId);

    if (!existing) {
        return errorResponse(404, 'NotFound', 'User not found');
    }

    await adapter.delete('user', userId);

    return {
        statusCode: 204,
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    };
};
