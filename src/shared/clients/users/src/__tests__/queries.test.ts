/**
 * Tests for the 3 query options builders and their associated key builders.
 *
 * Covers queryUsers, queryUser, and queryAccount — verifying query key shape,
 * queryFn presence, staleTime of 3_600_000, and custom option spreading.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserParams } from '@/types.js';

vi.mock('ky', () => ({
    default: {
        get: vi.fn(() => ({ json: vi.fn() })),
        post: vi.fn(() => ({ json: vi.fn() })),
        put: vi.fn(() => ({ json: vi.fn() })),
        delete: vi.fn(() => Promise.resolve()),
    },
}));

import { buildQueryUsersKey, queryUsers } from '@/queries/queryUsers.js';
import { buildQueryUserKey, queryUser } from '@/queries/queryUser.js';
import { buildQueryAccountKey, queryAccount } from '@/queries/queryAccount.js';

const AUTHORIZATION = 'Bearer test-token';

describe('queryUsers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('buildQueryUsersKey', () => {
        it('returns an array with "queryUsers" as the first element', () => {
            const key = buildQueryUsersKey();

            expect(key).toEqual(['queryUsers']);
        });

        it('returns a tuple with exactly one element', () => {
            const key = buildQueryUsersKey();

            expect(key).toHaveLength(1);
        });
    });

    describe('queryUsers()', () => {
        it('returns an object with queryKey matching the key builder', () => {
            const result = queryUsers(AUTHORIZATION);

            expect(result.queryKey).toEqual(buildQueryUsersKey());
        });

        it('returns an object with a queryFn function', () => {
            const result = queryUsers(AUTHORIZATION);

            expect(result.queryFn).toBeTypeOf('function');
        });

        it('returns an object with staleTime of 3_600_000', () => {
            const result = queryUsers(AUTHORIZATION);

            expect(result.staleTime).toBe(3_600_000);
        });

        it('spreads custom options into the result', () => {
            const result = queryUsers(AUTHORIZATION, { enabled: false });

            expect(result.enabled).toBe(false);
        });
    });
});

describe('queryUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const params: UserParams = { userId: 'user-123' };

    describe('buildQueryUserKey', () => {
        it('returns an array with "queryUser" and params', () => {
            const key = buildQueryUserKey(params);

            expect(key).toEqual(['queryUser', params]);
        });

        it('returns a tuple with exactly two elements', () => {
            const key = buildQueryUserKey(params);

            expect(key).toHaveLength(2);
        });

        it('includes the params object as the second element', () => {
            const key = buildQueryUserKey(params);

            expect(key[1]).toEqual({ userId: 'user-123' });
        });
    });

    describe('queryUser()', () => {
        it('returns an object with queryKey matching the key builder', () => {
            const result = queryUser(AUTHORIZATION, params);

            expect(result.queryKey).toEqual(buildQueryUserKey(params));
        });

        it('returns an object with a queryFn function', () => {
            const result = queryUser(AUTHORIZATION, params);

            expect(result.queryFn).toBeTypeOf('function');
        });

        it('returns an object with staleTime of 3_600_000', () => {
            const result = queryUser(AUTHORIZATION, params);

            expect(result.staleTime).toBe(3_600_000);
        });

        it('spreads custom options into the result', () => {
            const result = queryUser(AUTHORIZATION, params, { enabled: false });

            expect(result.enabled).toBe(false);
        });
    });
});

describe('queryAccount', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const params: UserParams = { userId: 'user-456' };

    describe('buildQueryAccountKey', () => {
        it('returns an array with "queryAccount" and params', () => {
            const key = buildQueryAccountKey(params);

            expect(key).toEqual(['queryAccount', params]);
        });

        it('returns a tuple with exactly two elements', () => {
            const key = buildQueryAccountKey(params);

            expect(key).toHaveLength(2);
        });

        it('includes the params object as the second element', () => {
            const key = buildQueryAccountKey(params);

            expect(key[1]).toEqual({ userId: 'user-456' });
        });
    });

    describe('queryAccount()', () => {
        it('returns an object with queryKey matching the key builder', () => {
            const result = queryAccount(AUTHORIZATION, params);

            expect(result.queryKey).toEqual(buildQueryAccountKey(params));
        });

        it('returns an object with a queryFn function', () => {
            const result = queryAccount(AUTHORIZATION, params);

            expect(result.queryFn).toBeTypeOf('function');
        });

        it('returns an object with staleTime of 3_600_000', () => {
            const result = queryAccount(AUTHORIZATION, params);

            expect(result.staleTime).toBe(3_600_000);
        });

        it('spreads custom options into the result', () => {
            const result = queryAccount(AUTHORIZATION, params, { enabled: false });

            expect(result.enabled).toBe(false);
        });
    });
});
