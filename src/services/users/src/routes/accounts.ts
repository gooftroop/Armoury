import { randomUUID } from 'node:crypto';

import type { Account, ApiResponse, DatabaseAdapter, PathParameters, RouteHandler, UserContext } from '@/types.js';
import { resolveUser } from '@/utils/resolveUser.js';
import { errorResponse, jsonResponse } from '@/utils/response.js';
import { parseCreateAccount, parseUpdateAccount } from '@/utils/validation.js';

/**
 * Retrieves the account for a user.
 *
 * Looks up the account by the user ID from path parameters.
 * A user can have at most one account.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param pathParameters - Path parameters containing the user ID.
 * @param _userContext - Unused authenticated user context.
 * @returns 200 with the account entity, or 404 if not found.
 */
export const getAccount: RouteHandler = async (
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
        console.error('[accounts:getAccount] 404 User not found', JSON.stringify({ userId }));

        return errorResponse(404, 'NotFound', 'User not found');
    }

    const accounts = await adapter.getByField('account', 'userId', user.id);
    const account = accounts[0];

    if (!account) {
        console.error(
            '[accounts:getAccount] 404 Account not found',
            JSON.stringify({ userId, resolvedUserId: user.id }),
        );

        return errorResponse(404, 'NotFound', 'Account not found for this user');
    }

    return jsonResponse(200, account);
};

/**
 * Creates an account for a user.
 *
 * Validates the request body via parseCreateAccount, verifies the user exists,
 * checks that no account already exists for the user, and stores the new account.
 *
 * @param adapter - Database adapter instance.
 * @param body - Request body containing account details.
 * @param pathParameters - Path parameters containing the user ID.
 * @param _userContext - Unused authenticated user context.
 * @returns 201 with the created account entity, or 409 if an account already exists.
 */
export const createAccount: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const userId = pathParameters?.id;

    if (!userId) {
        return errorResponse(400, 'ValidationError', 'Missing user id');
    }

    const request = parseCreateAccount(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const user = await resolveUser(adapter, userId);

    if (!user) {
        console.error('[accounts:createAccount] 404 User not found', JSON.stringify({ userId }));

        return errorResponse(404, 'NotFound', 'User not found');
    }

    const existingAccounts = await adapter.getByField('account', 'userId', user.id);

    if (existingAccounts.length > 0) {
        return errorResponse(409, 'Conflict', 'Account already exists for this user');
    }

    const now = new Date().toISOString();

    const account: Account = {
        id: randomUUID(),
        userId: user.id,
        preferences: request.preferences,
        systems: {},
        createdAt: now,
        updatedAt: now,
    };

    await adapter.put('account', account);

    return jsonResponse(201, account);
};

/**
 * Updates the account for a user.
 *
 * Validates the request body via parseUpdateAccount, verifies the user and
 * account exist, merges with the existing entity, and stores the update.
 *
 * @param adapter - Database adapter instance.
 * @param body - Request body with fields to update.
 * @param pathParameters - Path parameters containing the user ID.
 * @param _userContext - Unused authenticated user context.
 * @returns 200 with the updated account entity, or 404 if not found.
 */
export const updateAccount: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    _userContext: UserContext,
): Promise<ApiResponse> => {
    const userId = pathParameters?.id;

    if (!userId) {
        return errorResponse(400, 'ValidationError', 'Missing user id');
    }

    const request = parseUpdateAccount(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const user = await resolveUser(adapter, userId);

    if (!user) {
        console.error('[accounts:updateAccount] 404 User not found', JSON.stringify({ userId }));

        return errorResponse(404, 'NotFound', 'User not found');
    }

    const accounts = await adapter.getByField('account', 'userId', user.id);
    const existing = accounts[0];

    if (!existing) {
        console.error(
            '[accounts:updateAccount] 404 Account not found',
            JSON.stringify({ userId, resolvedUserId: user.id }),
        );

        return errorResponse(404, 'NotFound', 'Account not found for this user');
    }

    const now = new Date().toISOString();
    const updated: Account = {
        ...existing,
        preferences: request.preferences ?? existing.preferences,
        systems: request.systems ? { ...existing.systems, ...request.systems } : existing.systems,
        updatedAt: now,
    };

    await adapter.put('account', updated);

    return jsonResponse(200, updated);
};

/**
 * Deletes the account for a user.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param pathParameters - Path parameters containing the user ID.
 * @param _userContext - Unused authenticated user context.
 * @returns 204 on success, or 404 if not found.
 */
export const deleteAccount: RouteHandler = async (
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
        console.error('[accounts:deleteAccount] 404 User not found', JSON.stringify({ userId }));

        return errorResponse(404, 'NotFound', 'User not found');
    }

    const accounts = await adapter.getByField('account', 'userId', user.id);
    const existing = accounts[0];

    if (!existing) {
        console.error(
            '[accounts:deleteAccount] 404 Account not found',
            JSON.stringify({ userId, resolvedUserId: user.id }),
        );

        return errorResponse(404, 'NotFound', 'Account not found for this user');
    }

    await adapter.delete('account', existing.id);

    return {
        statusCode: 204,
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    };
};
