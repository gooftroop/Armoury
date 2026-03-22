import type { ApiResponse, DatabaseAdapter, PathParameters, RouteHandler, UserContext } from '@/types.js';
import { createAccount, deleteAccount, getAccount, updateAccount } from '@/routes/accounts.js';
import { createUser, deleteUser, getUser, listUsers, updateUser } from '@/routes/users.js';

/**
 * Standard CORS headers included in all API responses.
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
} as const;

/**
 * Route dispatch key for API Gateway resource and HTTP method.
 */
type RouteKey = `${string}::${string}`;

const ROUTE_MAP: Record<RouteKey, RouteHandler> = {
    '/users::POST': createUser,
    '/users::GET': listUsers,
    '/users/{id}::GET': getUser,
    '/users/{id}::PUT': updateUser,
    '/users/{id}::DELETE': deleteUser,
    '/users/{id}/account::GET': getAccount,
    '/users/{id}/account::POST': createAccount,
    '/users/{id}/account::PUT': updateAccount,
    '/users/{id}/account::DELETE': deleteAccount,
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
                ...CORS_HEADERS,
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
                ...CORS_HEADERS,
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
