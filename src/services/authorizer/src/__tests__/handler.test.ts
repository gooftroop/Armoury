import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context } from 'aws-lambda';
import { generatePolicy, extractHttpMethod } from '@/utils/policy.js';
import { handler } from '@/handler.js';
import { getJwks } from '@/jwks.js';
import { getServiceConfig } from '@/utils/secrets.js';
import type { AuthorizerEvent, AuthorizerResult, RequestAuthorizerEvent } from '@/types.js';

const joseMocks = vi.hoisted(() => {
    return {
        jwtVerifyMock: vi.fn(),
        createRemoteJWKSetMock: vi.fn(),
    };
});

vi.mock('jose', () => {
    return {
        jwtVerify: joseMocks.jwtVerifyMock,
        createRemoteJWKSet: joseMocks.createRemoteJWKSetMock,
    };
});

vi.mock('../jwks.js', () => {
    return {
        getJwks: vi.fn().mockReturnValue('mock-jwks'),
    };
});

vi.mock('../utils/secrets.js', () => {
    return {
        getServiceConfig: vi.fn().mockResolvedValue({
            auth0Domain: 'test.auth0.com',
            auth0Audience: 'https://api.armoury.com',
        }),
    };
});

const TEST_METHOD_ARN = 'arn:aws:execute-api:us-east-1:123456789012:abcdef1234/dev/GET/campaigns';
const WILDCARD_RESOURCE = 'arn:aws:execute-api:us-east-1:123456789012:abcdef1234/dev/*';

const TEST_OPTIONS_METHOD_ARN = 'arn:aws:execute-api:us-east-1:123456789012:abcdef1234/dev/OPTIONS/campaigns';

/**
 * Builds a minimal authorizer event for tests.
 *
 * @param authorizationToken - Authorization header value.
 * @returns Authorizer event.
 */
const buildEvent = (authorizationToken: string): AuthorizerEvent => {
    return {
        type: 'TOKEN',
        authorizationToken,
        methodArn: TEST_METHOD_ARN,
    };
};

const TEST_WS_METHOD_ARN = 'arn:aws:execute-api:us-east-1:123456789012:ws-api-id/production/$connect';
const WS_WILDCARD_RESOURCE = 'arn:aws:execute-api:us-east-1:123456789012:ws-api-id/production/*';

/**
 * Builds a minimal REQUEST authorizer event for WebSocket tests.
 *
 * @param token - Query string token value.
 * @returns REQUEST authorizer event.
 */
const buildRequestEvent = (token?: string): RequestAuthorizerEvent => {
    return {
        type: 'REQUEST',
        queryStringParameters: token !== undefined ? { Auth: token } : undefined,
        methodArn: TEST_WS_METHOD_ARN,
    };
};

const getJwksMock = vi.mocked(getJwks);
const getServiceConfigMock = vi.mocked(getServiceConfig);

/**
 * Resets shared mocks between tests.
 */
const resetMocks = (): void => {
    joseMocks.jwtVerifyMock.mockReset();
    joseMocks.createRemoteJWKSetMock.mockReset();

    getJwksMock.mockReset();
    joseMocks.createRemoteJWKSetMock.mockReturnValue(vi.fn());
    getJwksMock.mockReturnValue(joseMocks.createRemoteJWKSetMock());

    getServiceConfigMock.mockReset();
    getServiceConfigMock.mockResolvedValue({
        auth0Domain: 'test.auth0.com',
        auth0Audience: 'https://api.armoury.com',
    });
};

/**
 * Mock Lambda context for Sentry.wrapHandler compatibility.
 * Sentry sets `context.callbackWaitsForEmptyEventLoop = false` on invocation.
 */
const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'authorizer',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:authorizer',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/authorizer',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
};

/**
 * Invokes the Sentry-wrapped handler with mock Lambda context and narrows
 * the return type from `void | Promise<AuthorizerResult>` to `AuthorizerResult`.
 */
const invokeHandler = async (event: AuthorizerEvent): Promise<AuthorizerResult> => {
    const result = await handler(event, mockContext, () => {});

    if (!result) {
        throw new Error('Handler returned void — expected AuthorizerResult');
    }

    return result;
};

describe('handler', () => {
    beforeEach(() => {
        resetMocks();

        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                sub: 'auth0|user-123',
                'https://armoury.app/internal_id': 'internal-uuid-123',
                email: 'user@example.com',
                name: 'Test User',
                aud: 'https://api.armoury.com',
                iss: 'https://test.auth0.com/',
            },
            protectedHeader: { alg: 'RS256' },
            key: {},
        });
    });

    it('returns Allow policy with full context when token is valid', async () => {
        const result = await invokeHandler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.context).toEqual({
            'https://armoury.app/internal_id': 'internal-uuid-123',
            sub: 'auth0|user-123',
            email: 'user@example.com',
            name: 'Test User',
        });
    });

    it('returns Allow policy with only required claims when optional claims missing', async () => {
        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                sub: 'auth0|user-123',
                'https://armoury.app/internal_id': 'internal-uuid-123',
                aud: 'https://api.armoury.com',
                iss: 'https://test.auth0.com/',
            },
            protectedHeader: { alg: 'RS256' },
            key: {},
        });

        const result = await invokeHandler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.context).toEqual({
            'https://armoury.app/internal_id': 'internal-uuid-123',
            sub: 'auth0|user-123',
        });
    });

    it('returns Deny when authorization token is missing', async () => {
        const result = await invokeHandler(buildEvent(''));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when token scheme is not Bearer', async () => {
        const result = await invokeHandler(buildEvent('Basic abc123'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when config fetch fails', async () => {
        getServiceConfigMock.mockRejectedValue(new Error('Missing env vars'));

        const result = await invokeHandler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when JWT verification fails', async () => {
        joseMocks.jwtVerifyMock.mockRejectedValue(new Error('invalid token'));

        const result = await invokeHandler(buildEvent('Bearer invalid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when payload has no sub claim', async () => {
        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                aud: 'https://api.armoury.com',
                iss: 'https://test.auth0.com/',
            },
            protectedHeader: { alg: 'RS256' },
            key: {},
        });

        const result = await invokeHandler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when payload has no internal_id claim', async () => {
        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                sub: 'auth0|user-123',
                aud: 'https://api.armoury.com',
                iss: 'https://test.auth0.com/',
            },
            protectedHeader: { alg: 'RS256' },
            key: {},
        });

        const result = await invokeHandler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when Bearer token value is empty after scheme', async () => {
        const result = await invokeHandler(buildEvent('Bearer   '));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('passes correct audience and issuer to jwtVerify', async () => {
        await invokeHandler(buildEvent('Bearer valid-token'));

        expect(joseMocks.jwtVerifyMock).toHaveBeenCalledWith('valid-token', expect.any(Function), {
            audience: 'https://api.armoury.com',
            issuer: 'https://test.auth0.com/',
        });
    });

    it('calls getJwks with the domain from config', async () => {
        await invokeHandler(buildEvent('Bearer valid-token'));

        expect(getJwksMock).toHaveBeenCalledWith('test.auth0.com');
    });
});

describe('handler - REQUEST events (WebSocket)', () => {
    beforeEach(() => {
        resetMocks();

        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                sub: 'auth0|user-123',
                'https://armoury.app/internal_id': 'internal-uuid-123',
                email: 'user@example.com',
                name: 'Test User',
                aud: 'https://api.armoury.com',
                iss: 'https://test.auth0.com/',
            },
            protectedHeader: { alg: 'RS256' },
            key: {},
        });
    });

    it('returns Allow policy when token is provided in query string', async () => {
        const result = await invokeHandler(buildRequestEvent('valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.context).toEqual({
            'https://armoury.app/internal_id': 'internal-uuid-123',
            sub: 'auth0|user-123',
            email: 'user@example.com',
            name: 'Test User',
        });
    });

    it('passes raw query string token directly to jwtVerify', async () => {
        await invokeHandler(buildRequestEvent('raw-jwt-value'));

        expect(joseMocks.jwtVerifyMock).toHaveBeenCalledWith('raw-jwt-value', expect.any(Function), {
            audience: 'https://api.armoury.com',
            issuer: 'https://test.auth0.com/',
        });
    });

    it('returns Deny when token is missing from query string', async () => {
        const result = await invokeHandler(buildRequestEvent());

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when queryStringParameters is undefined', async () => {
        const event: RequestAuthorizerEvent = {
            type: 'REQUEST',
            methodArn: TEST_WS_METHOD_ARN,
        };

        const result = await invokeHandler(event);

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when token is empty string in query string', async () => {
        const result = await invokeHandler(buildRequestEvent(''));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when JWT verification fails for WebSocket token', async () => {
        joseMocks.jwtVerifyMock.mockRejectedValue(new Error('invalid token'));

        const result = await invokeHandler(buildRequestEvent('invalid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('uses WebSocket method ARN for policy resource', async () => {
        const result = await invokeHandler(buildRequestEvent('valid-token'));

        expect(result.policyDocument.Statement[0].Resource).toBe(WS_WILDCARD_RESOURCE);
    });
});

describe('handler - OPTIONS preflight bypass', () => {
    beforeEach(() => {
        resetMocks();

        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                sub: 'auth0|user-123',
                'https://armoury.app/internal_id': 'internal-uuid-123',
                email: 'user@example.com',
                name: 'Test User',
                aud: 'https://api.armoury.com',
                iss: 'https://test.auth0.com/',
            },
            protectedHeader: { alg: 'RS256' },
            key: {},
        });
    });

    it('returns Allow policy for OPTIONS request without requiring a token', async () => {
        const event: AuthorizerEvent = {
            type: 'TOKEN',
            authorizationToken: '',
            methodArn: TEST_OPTIONS_METHOD_ARN,
        };

        const result = await invokeHandler(event);

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.principalId).toBe('preflight');
        expect(joseMocks.jwtVerifyMock).not.toHaveBeenCalled();
    });

    it('does not fetch service config for OPTIONS requests', async () => {
        const event: AuthorizerEvent = {
            type: 'TOKEN',
            authorizationToken: '',
            methodArn: TEST_OPTIONS_METHOD_ARN,
        };

        await invokeHandler(event);

        expect(getServiceConfigMock).not.toHaveBeenCalled();
    });
});

describe('generatePolicy', () => {
    it('creates Allow policy with correct structure and wildcard resource', () => {
        const result = generatePolicy('internal-uuid-1', 'Allow', TEST_METHOD_ARN, {
            'https://armoury.app/internal_id': 'internal-uuid-1',
            sub: 'auth0|user-1',
        });

        expect(result).toEqual({
            principalId: 'internal-uuid-1',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: WILDCARD_RESOURCE,
                    },
                ],
            },
            context: {
                'https://armoury.app/internal_id': 'internal-uuid-1',
                sub: 'auth0|user-1',
            },
        });
    });

    it('creates Deny policy without context', () => {
        const result = generatePolicy('unknown', 'Deny', TEST_METHOD_ARN);

        expect(result).toEqual({
            principalId: 'unknown',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: WILDCARD_RESOURCE,
                    },
                ],
            },
            context: undefined,
        });
    });

    it('converts specific method ARN to wildcard resource', () => {
        const result = generatePolicy('internal-uuid-1', 'Allow', TEST_METHOD_ARN);

        expect(result.policyDocument.Statement[0].Resource).toBe(WILDCARD_RESOURCE);
    });
});

describe('extractHttpMethod', () => {
    it('extracts GET from a REST API method ARN', () => {
        expect(extractHttpMethod(TEST_METHOD_ARN)).toBe('GET');
    });

    it('extracts OPTIONS from a preflight method ARN', () => {
        expect(extractHttpMethod(TEST_OPTIONS_METHOD_ARN)).toBe('OPTIONS');
    });

    it('extracts $connect from a WebSocket method ARN', () => {
        expect(extractHttpMethod(TEST_WS_METHOD_ARN)).toBe('$connect');
    });

    it('returns null for a malformed ARN with fewer than 3 slash segments', () => {
        expect(extractHttpMethod('arn:aws:execute-api:us-east-1/dev')).toBeNull();
    });
});
