import { describe, expect, it } from 'vitest';
import { extractUserContext } from '@/middleware/auth.js';

describe('auth middleware', () => {
    it('extracts user context from authorizer context', () => {
        const context = extractUserContext({
            requestContext: {
                authorizer: {
                    sub: 'user-1',
                    email: 'user@example.com',
                    name: 'Test User',
                },
            },
        });

        expect(context).toEqual({
            sub: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
        });
    });

    it('extracts user context with only sub (email and name absent)', () => {
        const context = extractUserContext({
            requestContext: {
                authorizer: {
                    sub: 'user-1',
                },
            },
        });

        expect(context).toEqual({
            sub: 'user-1',
            email: undefined,
            name: undefined,
        });
    });

    it('throws when authorizer context is missing', () => {
        expect(() => extractUserContext({ requestContext: {} })).toThrow('Missing authorizer context');
    });

    it('throws when sub is missing', () => {
        expect(() =>
            extractUserContext({
                requestContext: {
                    authorizer: {
                        email: 'user@example.com',
                    },
                },
            }),
        ).toThrow('Missing required user context fields');
    });
});
