/**
 * Shared test utilities for service e2e tests.
 * Provides factories for building API Gateway events and user contexts.
 */
/** Authenticated user context for testing. */
export interface TestUserContext {
    sub: string;
    email: string;
    name: string;
}
/** Creates a test user context with optional overrides. */
export declare function createTestUserContext(overrides?: Partial<TestUserContext>): TestUserContext;
/** Creates an API Gateway REST proxy event. */
export declare function createApiGatewayEvent(options: {
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
    requestContext: {
        authorizer?: Record<string, unknown>;
    };
};
/** Creates an API Gateway WebSocket event. */
export declare function createWebSocketEvent(options: {
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
};
//# sourceMappingURL=helpers.d.ts.map
