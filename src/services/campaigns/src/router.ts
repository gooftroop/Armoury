import type { DatabaseAdapter } from '@armoury/data-dao';
import type { ApiResponse, PathParameters, RouteHandler, UserContext } from '@/types.js';
import { createCampaign, deleteCampaign, getCampaign, listCampaigns, updateCampaign } from '@/routes/campaigns.js';
import {
    deleteParticipant,
    getParticipant,
    joinCampaign,
    listParticipants,
    updateParticipant,
} from '@/routes/participants.js';

/**
 * Standard CORS headers included in all API responses.
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': process.env['ALLOWED_ORIGIN'] ?? '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
} as const;

/**
 * Route dispatch key for API Gateway resource and HTTP method.
 */
type RouteKey = `${string}::${string}`;

const ROUTE_MAP: Record<RouteKey, RouteHandler> = {
    '/::POST': createCampaign,
    '/::GET': listCampaigns,
    '/{id}::GET': getCampaign,
    '/{id}::PUT': updateCampaign,
    '/{id}::DELETE': deleteCampaign,
    '/{id}/participants::POST': joinCampaign,
    '/{id}/participants::GET': listParticipants,
    '/{id}/participants/{pid}::GET': getParticipant,
    '/{id}/participants/{pid}::PUT': updateParticipant,
    '/{id}/participants/{pid}::DELETE': deleteParticipant,
};

/**
 * Routes an API Gateway event to the correct handler.
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
              pid: event.pathParameters['pid'],
          }
        : null;

    return routeHandler(adapter, parsedBody, routeParams, userContext);
}

/**
 * Parses JSON request body if provided.
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
