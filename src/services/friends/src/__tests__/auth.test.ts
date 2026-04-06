import { describe, expect, it } from 'vitest';
import { extractUserContext } from '@/middleware/auth.js';

describe('auth middleware', () => {
    it('extracts user context from authorizer context', () => {
        const context = extractUserContext({
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            'https://armoury.app/internal_id': 'user-1',
                            'https://armoury.app/email': 'user@example.com',
                            'https://armoury.app/name': 'Test User',
                        },
                    },
                },
            },
        });

        expect(context).toEqual({
            userId: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
        });
    });

    it('extracts user context with only userId (email and name absent)', () => {
        const context = extractUserContext({
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            'https://armoury.app/internal_id': 'user-1',
                        },
                    },
                },
            },
        });

        expect(context).toEqual({
            userId: 'user-1',
            email: undefined,
            name: undefined,
        });
    });

    it('throws when authorizer context is missing', () => {
        expect(() => extractUserContext({ requestContext: {} })).toThrow('Missing authorizer context');
    });

    it('throws when internal_id claim is missing', () => {
        expect(() =>
            extractUserContext({
                requestContext: {
                    authorizer: {
                        jwt: {
                            claims: {
                                email: 'user@example.com',
                            },
                        },
                    },
                },
            }),
        ).toThrow('Missing required user context fields');
    });
});
