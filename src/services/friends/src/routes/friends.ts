import { randomUUID } from 'node:crypto';

import type {
    ApiResponse,
    DatabaseAdapter,
    Friend,
    FriendStatus,
    PathParameters,
    RouteHandler,
    UserContext,
} from '@friends/src/types.js';
import { errorResponse, jsonResponse } from '@friends/src/utils/response.js';
import { parseSendFriendRequest, parseUpdateFriendRequest } from '@friends/src/utils/validation.js';

/**
 * Valid status transitions for friend relationships.
 * Key is the current status, value is the set of allowed next statuses.
 */
const VALID_TRANSITIONS: Record<FriendStatus, Set<FriendStatus>> = {
    pending: new Set(['accepted', 'blocked']),
    accepted: new Set(['blocked']),
    blocked: new Set([]),
};

/**
 * Creates a pending friend request.
 *
 * Creates two friend records — one for each user in the relationship.
 * The sender's record has userId = receiver, and vice versa.
 *
 * @param adapter - Database adapter instance.
 * @param body - Request body containing the target userId.
 * @param _pathParameters - Unused path parameters.
 * @param userContext - Authenticated user context.
 * @returns 201 with the sender's friend record.
 */
export const sendFriendRequest: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const request = parseSendFriendRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const now = new Date().toISOString();

    const senderRecord: Friend = {
        id: randomUUID(),
        ownerId: userContext.sub,
        userId: request.userId,
        status: 'pending',
        canShareArmyLists: false,
        canViewMatchHistory: false,
        createdAt: now,
        updatedAt: now,
    };

    const receiverRecord: Friend = {
        id: randomUUID(),
        ownerId: request.userId,
        userId: userContext.sub,
        status: 'pending',
        canShareArmyLists: false,
        canViewMatchHistory: false,
        createdAt: now,
        updatedAt: now,
    };

    await adapter.transaction(async () => {
        await adapter.put('friend', senderRecord);
        await adapter.put('friend', receiverRecord);
    });

    return jsonResponse(201, senderRecord);
};

/**
 * Lists friend relationships for the authenticated user.
 *
 * Returns all relationships owned by the current user.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param _pathParameters - Unused path parameters.
 * @param userContext - Authenticated user context.
 * @returns 200 with array of friend entities.
 */
export const listFriends: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const friends = await adapter.getByField('friend', 'ownerId', userContext.sub);

    return jsonResponse(200, friends);
};

/**
 * Retrieves a single friend relationship by ID.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param pathParameters - Path parameters containing the friend ID.
 * @returns 200 with the friend entity, or 404 if not found.
 */
export const getFriend: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const friendId = pathParameters?.id;

    if (!friendId) {
        return errorResponse(400, 'ValidationError', 'Missing friend id');
    }

    const friend = await adapter.get('friend', friendId);

    if (!friend) {
        return errorResponse(404, 'NotFound', 'Friend not found');
    }

    return jsonResponse(200, friend);
};

/**
 * Updates a friend relationship status or sharing permissions.
 *
 * Validates status transitions: pending to accepted or blocked, accepted to blocked.
 * Blocked relationships cannot be transitioned further.
 * When status changes, the mirrored record for the other user is also updated.
 *
 * @param adapter - Database adapter instance.
 * @param body - Request body with fields to update.
 * @param pathParameters - Path parameters containing the friend ID.
 * @param userContext - Authenticated user context.
 * @returns 200 with the updated friend entity, or 400/404 on error.
 */
export const updateFriend: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const friendId = pathParameters?.id;

    if (!friendId) {
        return errorResponse(400, 'ValidationError', 'Missing friend id');
    }

    const request = parseUpdateFriendRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const existing = await adapter.get('friend', friendId);

    if (!existing) {
        return errorResponse(404, 'NotFound', 'Friend not found');
    }

    if (request.status !== undefined) {
        const allowed = VALID_TRANSITIONS[existing.status];

        if (!allowed.has(request.status)) {
            return errorResponse(
                400,
                'ValidationError',
                `Cannot transition from ${existing.status} to ${request.status}`,
            );
        }
    }

    const now = new Date().toISOString();
    const updated: Friend = {
        ...existing,
        status: request.status ?? existing.status,
        canShareArmyLists: request.canShareArmyLists ?? existing.canShareArmyLists,
        canViewMatchHistory: request.canViewMatchHistory ?? existing.canViewMatchHistory,
        updatedAt: now,
    };

    await adapter.put('friend', updated);

    if (request.status !== undefined) {
        const mirrorRecords = await adapter.getByField('friend', 'ownerId', existing.userId);
        const mirror = mirrorRecords.find((r) => r.userId === userContext.sub);

        if (mirror) {
            const updatedMirror: Friend = {
                ...mirror,
                status: request.status,
                updatedAt: now,
            };

            await adapter.put('friend', updatedMirror);
        }
    }

    return jsonResponse(200, updated);
};

/**
 * Deletes a friend relationship by ID.
 *
 * Also removes the mirrored record for the other user.
 *
 * @param adapter - Database adapter instance.
 * @param _body - Unused request body.
 * @param pathParameters - Path parameters containing the friend ID.
 * @param userContext - Authenticated user context.
 * @returns 204 on success, or 400/404 on error.
 */
export const deleteFriend: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const friendId = pathParameters?.id;

    if (!friendId) {
        return errorResponse(400, 'ValidationError', 'Missing friend id');
    }

    const existing = await adapter.get('friend', friendId);

    if (!existing) {
        return errorResponse(404, 'NotFound', 'Friend not found');
    }

    await adapter.delete('friend', friendId);

    const mirrorRecords = await adapter.getByField('friend', 'ownerId', existing.userId);
    const mirror = mirrorRecords.find((r) => r.userId === userContext.sub);

    if (mirror) {
        await adapter.delete('friend', mirror.id);
    }

    return {
        statusCode: 204,
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    };
};
