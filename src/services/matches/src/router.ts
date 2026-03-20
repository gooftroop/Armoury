import type { ApiResponse, DatabaseAdapter, PathParameters, RouteHandler, UserContext } from '@/types.js';
import { createMatch, deleteMatch, getMatch, listMatches, updateMatch } from '@/routes/matches.js';

/**
 * Standard CORS headers included in all API responses.
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
} as const;

type RouteKey = `${string}::${string}`;

const ROUTE_MAP: Record<RouteKey, RouteHandler> = {
    '/matches::POST': createMatch,
    '/matches::GET': listMatches,
    '/matches/{id}::GET': getMatch,
    '/matches/{id}::PUT': updateMatch,
    '/matches/{id}::DELETE': deleteMatch,
};

/**
 * Routes API Gateway events to the appropriate handler based on HTTP method and resource.
 * @param event API Gateway event with HTTP method, path, and body.
 * @param adapter Database adapter for persistence.
 * @param userContext Authenticated user context.
 * @returns API response from the matched route handler or 404 if no route matches.
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
