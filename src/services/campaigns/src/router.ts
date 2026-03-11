import type { DatabaseAdapter } from '@armoury/data-dao/types';
import type { ApiResponse, PathParameters, RouteHandler, UserContext } from './types.ts';
import { createCampaign, deleteCampaign, getCampaign, listCampaigns, updateCampaign } from './routes/campaigns.ts';
import {
    deleteParticipant,
    getParticipant,
    joinCampaign,
    listParticipants,
    updateParticipant,
} from './routes/participants.ts';

/**
 * Route dispatch key for API Gateway resource and HTTP method.
 */
type RouteKey = `${string}::${string}`;

const ROUTE_MAP: Record<RouteKey, RouteHandler> = {
    '/campaigns::POST': createCampaign,
    '/campaigns::GET': listCampaigns,
    '/campaigns/{id}::GET': getCampaign,
    '/campaigns/{id}::PUT': updateCampaign,
    '/campaigns/{id}::DELETE': deleteCampaign,
    '/campaigns/{id}/participants::POST': joinCampaign,
    '/campaigns/{id}/participants::GET': listParticipants,
    '/campaigns/{id}/participants/{pid}::GET': getParticipant,
    '/campaigns/{id}/participants/{pid}::PUT': updateParticipant,
    '/campaigns/{id}/participants/{pid}::DELETE': deleteParticipant,
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
