/**
 * Shared test utilities for service e2e tests.
 * Provides factories for building API Gateway events and user contexts.
 */

/** Authenticated user context for testing. */
export interface TestUserContext {
    userId: string;
    email?: string;
    name?: string;
}

/** Creates a test user context with optional overrides. */
export function createTestUserContext(overrides: Partial<TestUserContext> = {}): TestUserContext {
    return {
        userId: overrides.userId ?? 'test-user-1',
        email: overrides.email ?? 'test@armoury.dev',
        name: overrides.name ?? 'Test User',
    };
}

/** Creates an API Gateway REST proxy event. */
export function createApiGatewayEvent(options: {
    httpMethod: string;
    path: string;
    resource: string;
    body?: unknown;
    pathParameters?: Record<string, string | undefined> | null;
    userContext?: TestUserContext;
}): {
    httpMethod: string;
    path: string;
    resource: string;
    body: string | null;
    pathParameters: Record<string, string | undefined> | null;
    requestContext: { authorizer?: Record<string, unknown> };
} {
    const userContext = options.userContext ?? createTestUserContext();

    return {
        httpMethod: options.httpMethod,
        path: options.path,
        resource: options.resource,
        body: options.body !== undefined ? JSON.stringify(options.body) : null,
        pathParameters: options.pathParameters ?? null,
        requestContext: {
            authorizer: {
                jwt: {
                    claims: {
                        'https://armoury.app/internal_id': userContext.userId,
                        email: userContext.email,
                        name: userContext.name,
                    },
                },
            },
        },
    };
}

/** Creates an API Gateway WebSocket event. */
export function createWebSocketEvent(options: {
    routeKey: string;
    connectionId: string;
    body?: unknown;
    userContext?: TestUserContext;
    eventType?: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
}): {
    requestContext: {
        routeKey: string;
        connectionId: string;
        domainName: string;
        stage: string;
        authorizer?: Record<string, unknown>;
        eventType: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
    };
    queryStringParameters: null;
    body: string | null;
} {
    const userContext = options.userContext;

    return {
        requestContext: {
            routeKey: options.routeKey,
            connectionId: options.connectionId,
            domainName: 'test.execute-api.us-east-1.amazonaws.com',
            stage: 'test',
            eventType: options.eventType ?? 'MESSAGE',
            ...(userContext
                ? {
                      authorizer: {
                          'https://armoury.app/internal_id': userContext.userId,
                          email: userContext.email,
                          name: userContext.name,
                      },
                  }
                : {}),
        },
        queryStringParameters: null,
        body: options.body !== undefined ? JSON.stringify(options.body) : null,
    };
}
