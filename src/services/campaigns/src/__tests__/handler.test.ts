import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResponse } from '@/types.js';

/**
 * @requirements
 * - REQ-DI-060: Campaigns Lambda handler resolves DatabaseAdapter from DI container.
 * - REQ-DI-061: Cold start initializes once and warm invocations reuse cached adapter.
 */

/**
 * @testplan
 * - REQ-DI-060: Verify handler builds lambda module and container, then resolves TOKENS.DatabaseAdapter.
 * - REQ-DI-061: Verify warm invocation does not recreate container or reinitialize adapter.
 * - REQ-DI-062: Verify handler forwards normalized event, adapter, and user context to router.
 * - REQ-DI-063: Verify handler logs with Sentry logger and formats errors via middleware.
 */

interface HttpApiV2Event {
    routeKey: string;
    rawPath: string;
    body?: string | null;
    pathParameters?: Record<string, string | undefined> | null;
    requestContext: {
        authorizer?: {
            jwt?: {
                claims?: Record<string, unknown>;
            };
        };
    };
}

const mocks = vi.hoisted(() => {
    const adapter = { initialize: vi.fn() };
    const createLambdaModuleResult = { moduleName: 'lambda-module' };
    const coreModule = { moduleName: 'core-module' };
    const TOKENS = { DatabaseAdapter: 'DatabaseAdapter' };
    const container = {
        get: vi.fn().mockReturnValue(adapter),
    };

    return {
        adapter,
        container,
        createLambdaModuleResult,
        coreModule,
        TOKENS,
        createContainerWithModules: vi.fn().mockReturnValue(container),
        createLambdaModule: vi.fn().mockReturnValue(createLambdaModuleResult),
        getServiceConfig: vi.fn(),
        router: vi.fn(),
        extractUserContext: vi.fn(),
        formatErrorResponse: vi.fn(),
        loggerInfo: vi.fn(),
        captureException: vi.fn(),
    };
});

vi.mock('@armoury/di', () => {
    return {
        TOKENS: mocks.TOKENS,
        coreModule: mocks.coreModule,
        createContainerWithModules: mocks.createContainerWithModules,
        createLambdaModule: mocks.createLambdaModule,
    };
});

vi.mock('@/utils/secrets.js', () => {
    return {
        getServiceConfig: mocks.getServiceConfig,
    };
});

vi.mock('@/router.js', () => {
    return {
        router: mocks.router,
    };
});

vi.mock('@/middleware/auth.js', () => {
    return {
        extractUserContext: mocks.extractUserContext,
    };
});

vi.mock('@/middleware/errorHandler.js', () => {
    return {
        formatErrorResponse: mocks.formatErrorResponse,
    };
});

vi.mock('@sentry/aws-serverless', () => {
    return {
        wrapHandler: <TArgs extends unknown[], TResult>(
            handlerFn: (...args: TArgs) => TResult,
        ): ((...args: TArgs) => TResult) => {
            return (...args: TArgs): TResult => handlerFn(...args);
        },
        logger: {
            info: mocks.loggerInfo,
        },
        captureException: mocks.captureException,
    };
});

const baseEvent: HttpApiV2Event = {
    routeKey: 'GET /campaigns',
    rawPath: '/campaigns',
    body: null,
    pathParameters: null,
    requestContext: {
        authorizer: {
            jwt: {
                claims: {
                    sub: 'auth0|user-1',
                },
            },
        },
    },
};

const routerResponse: ApiResponse = {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
};

const formattedErrorResponse: ApiResponse = {
    statusCode: 500,
    body: JSON.stringify({ message: 'formatted' }),
};

const loadHandler = async (): Promise<(event: HttpApiV2Event) => Promise<ApiResponse>> => {
    const module = await import('@/handler.js');

    return module.handler as (event: HttpApiV2Event) => Promise<ApiResponse>;
};

describe('campaigns handler', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        mocks.adapter.initialize.mockResolvedValue(undefined);
        mocks.container.get.mockReturnValue(mocks.adapter);
        mocks.createContainerWithModules.mockReturnValue(mocks.container);
        mocks.createLambdaModule.mockReturnValue(mocks.createLambdaModuleResult);
        mocks.getServiceConfig.mockResolvedValue({
            dsqlClusterEndpoint: 'cluster.example.amazonaws.com',
            dsqlRegion: 'us-east-1',
        });
        mocks.extractUserContext.mockReturnValue({ userId: 'internal-user-1' });
        mocks.router.mockResolvedValue(routerResponse);
        mocks.formatErrorResponse.mockReturnValue(formattedErrorResponse);
    });

    it('initializes DI container on cold start', async () => {
        const handler = await loadHandler();

        await handler(baseEvent);

        expect(mocks.createLambdaModule).toHaveBeenCalledWith({
            clusterEndpoint: 'cluster.example.amazonaws.com',
            region: 'us-east-1',
        });
        expect(mocks.createContainerWithModules).toHaveBeenCalledWith(mocks.coreModule, mocks.createLambdaModuleResult);
        expect(mocks.container.get).toHaveBeenCalledWith(mocks.TOKENS.DatabaseAdapter);
        expect(mocks.adapter.initialize).toHaveBeenCalledTimes(1);
    });

    it('reuses adapter on warm invocation', async () => {
        const handler = await loadHandler();

        await handler(baseEvent);
        await handler(baseEvent);

        expect(mocks.createContainerWithModules).toHaveBeenCalledTimes(1);
        expect(mocks.adapter.initialize).toHaveBeenCalledTimes(1);
        expect(mocks.getServiceConfig).toHaveBeenCalledTimes(1);
    });

    it('passes adapter and user context to router and returns router response', async () => {
        const handler = await loadHandler();

        const result = await handler(baseEvent);

        expect(mocks.extractUserContext).toHaveBeenCalledWith(baseEvent);
        expect(mocks.router).toHaveBeenCalledWith(
            {
                httpMethod: 'GET',
                path: '/campaigns',
                resource: '/campaigns',
                body: null,
                pathParameters: null,
                requestContext: baseEvent.requestContext,
            },
            mocks.adapter,
            { userId: 'internal-user-1' },
        );
        expect(result).toEqual(routerResponse);
    });

    it('catches errors and returns formatted error response', async () => {
        const handler = await loadHandler();
        const failure = new Error('router failed');
        mocks.router.mockRejectedValueOnce(failure);

        const result = await handler(baseEvent);

        expect(mocks.captureException).toHaveBeenCalledWith(failure);
        expect(mocks.formatErrorResponse).toHaveBeenCalledWith(failure);
        expect(result).toEqual(formattedErrorResponse);
    });

    it('logs invocation and completion via Sentry logger', async () => {
        const handler = await loadHandler();

        await handler(baseEvent);

        expect(mocks.loggerInfo).toHaveBeenNthCalledWith(1, '[campaigns] Handler invoked', {
            httpMethod: 'GET',
            path: '/campaigns',
        });
        expect(mocks.loggerInfo).toHaveBeenNthCalledWith(2, '[campaigns] Handler completed', {
            httpMethod: 'GET',
            path: '/campaigns',
            statusCode: 200,
        });
    });
});
