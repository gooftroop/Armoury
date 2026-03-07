import type { ApiResponse, DatabaseAdapter, PathParameters, RouteHandler, UserContext } from '@friends/src/types.js';
import { deleteFriend, getFriend, listFriends, sendFriendRequest, updateFriend } from '@friends/src/routes/friends.js';

/**
 * Route dispatch key for API Gateway resource and HTTP method.
 */
type RouteKey = `${string}::${string}`;

const ROUTE_MAP: Record<RouteKey, RouteHandler> = {
    '/friends::POST': sendFriendRequest,
    '/friends::GET': listFriends,
    '/friends/{id}::GET': getFriend,
    '/friends/{id}::PUT': updateFriend,
    '/friends/{id}::DELETE': deleteFriend,
};

/**
 * Routes an API Gateway event to the correct handler.
 *
 * @param event - API Gateway event with routing metadata.
 * @param adapter - Database adapter instance.
 * @param userContext - Authenticated user context.
 * @returns API response from the matched route handler.
 */
export async function router(
    event: {
        httpMethod: string;
        path: string;
        resource: string;
        body: string | null;
        pathParameters?: Record<string, string | undefined> | null;
    },
    adapter: DatabaseAdapter,
    userContext: UserContext,
): Promise<ApiResponse> {
    const method = event.httpMethod.toUpperCase();
    const routeKey: RouteKey = `${event.resource}::${method}`;
    const routeHandler = ROUTE_MAP[routeKey];
    const parsedBody = parseBody(event.body);

    if (parsedBody instanceof Error) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'ValidationError',
                message: 'Invalid JSON body',
            }),
        };
    }

    if (!routeHandler) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'NotFound',
                message: 'Route not found',
            }),
        };
    }

    const routeParams: PathParameters | null = event.pathParameters
        ? {
              id: event.pathParameters['id'],
          }
        : null;

    return routeHandler(adapter, parsedBody, routeParams, userContext);
}

/**
 * Parses JSON request body if provided.
 *
 * @param body - Raw JSON body or null.
 * @returns Parsed JSON value or null if empty.
 */
function parseBody(body: string | null): unknown | null | Error {
    if (!body) {
        return null;
    }

    try {
        return JSON.parse(body);
    } catch (error) {
        return error instanceof Error ? error : new Error('Invalid JSON');
    }
}
