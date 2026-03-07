import { describe, expect, it } from 'vitest';
import { extractUserContext } from '@users/src/middleware/auth.js';

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

    it('throws when authorizer context is missing', () => {
        expect(() => extractUserContext({ requestContext: {} })).toThrow('Missing authorizer context');
    });

    it('throws when required fields are missing', () => {
        expect(() =>
            extractUserContext({
                requestContext: {
                    authorizer: {
                        sub: 'user-1',
                    },
                },
            }),
        ).toThrow('Missing required user context fields');
    });
});
