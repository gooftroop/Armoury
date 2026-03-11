import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generatePolicy } from '../utils/policy.ts';
import { handler } from '../handler.ts';
import { getJwks } from '../jwks.ts';
import { getServiceConfig } from '../utils/secrets.ts';
import type { AuthorizerEvent } from '../types.ts';

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

vi.mock('../jwks.ts', () => {
    return {
        getJwks: vi.fn().mockReturnValue('mock-jwks'),
    };
});

vi.mock('../utils/secrets.ts', () => {
    return {
        getServiceConfig: vi.fn().mockResolvedValue({
            auth0Domain: 'test.auth0.com',
            auth0Audience: 'https://api.armoury.com',
        }),
    };
});

const TEST_METHOD_ARN = 'arn:aws:execute-api:us-east-1:123456789012:abcdef1234/dev/GET/campaigns';
const WILDCARD_RESOURCE = 'arn:aws:execute-api:us-east-1:123456789012:abcdef1234/dev/*/*';

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

describe('handler', () => {
    beforeEach(() => {
        resetMocks();

        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                sub: 'auth0|user-123',
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
        const result = await handler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.context).toEqual({
            sub: 'auth0|user-123',
            email: 'user@example.com',
            name: 'Test User',
        });
    });

    it('returns Allow policy with only sub context when optional claims missing', async () => {
        joseMocks.jwtVerifyMock.mockResolvedValue({
            payload: {
                sub: 'auth0|user-123',
                aud: 'https://api.armoury.com',
                iss: 'https://test.auth0.com/',
            },
            protectedHeader: { alg: 'RS256' },
            key: {},
        });

        const result = await handler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.context).toEqual({
            sub: 'auth0|user-123',
        });
    });

    it('returns Deny when authorization token is missing', async () => {
        const result = await handler(buildEvent(''));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when token scheme is not Bearer', async () => {
        const result = await handler(buildEvent('Basic abc123'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when secrets fetch fails', async () => {
        getServiceConfigMock.mockRejectedValue(new Error('Secrets down'));

        const result = await handler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when JWT verification fails', async () => {
        joseMocks.jwtVerifyMock.mockRejectedValue(new Error('invalid token'));

        const result = await handler(buildEvent('Bearer invalid-token'));

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

        const result = await handler(buildEvent('Bearer valid-token'));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('returns Deny when Bearer token value is empty after scheme', async () => {
        const result = await handler(buildEvent('Bearer   '));

        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('passes correct audience and issuer to jwtVerify', async () => {
        await handler(buildEvent('Bearer valid-token'));

        expect(joseMocks.jwtVerifyMock).toHaveBeenCalledWith('valid-token', expect.any(Function), {
            audience: 'https://api.armoury.com',
            issuer: 'https://test.auth0.com/',
        });
    });

    it('calls getJwks with the domain from config', async () => {
        await handler(buildEvent('Bearer valid-token'));

        expect(getJwksMock).toHaveBeenCalledWith('test.auth0.com');
    });
});

describe('generatePolicy', () => {
    it('creates Allow policy with correct structure and wildcard resource', () => {
        const result = generatePolicy('user-1', 'Allow', TEST_METHOD_ARN, {
            sub: 'user-1',
        });

        expect(result).toEqual({
            principalId: 'user-1',
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
                sub: 'user-1',
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
        const result = generatePolicy('user-1', 'Allow', TEST_METHOD_ARN);

        expect(result.policyDocument.Statement[0].Resource).toBe(WILDCARD_RESOURCE);
    });
});
