/**
 * Unit tests for the friends React Query options builders and key builders.
 *
 * Tests both query builders (queryFriends, queryFriend) and their corresponding
 * key builders (buildQueryFriendsKey, buildQueryFriendKey) to verify query key
 * shapes, staleTime configuration, queryFn presence, and custom option spreading.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('ky', () => ({
    default: {
        get: vi.fn(() => ({ json: vi.fn() })),
        post: vi.fn(() => ({ json: vi.fn() })),
        put: vi.fn(() => ({ json: vi.fn() })),
        delete: vi.fn(() => Promise.resolve()),
    },
}));

import { buildQueryFriendsKey, queryFriends } from './../queries/queryFriends.ts';
import { buildQueryFriendKey, queryFriend } from './../queries/queryFriend.ts';

const authorization = 'Bearer test-token-123';

describe('buildQueryFriendsKey', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns a tuple with the query name', () => {
        const key = buildQueryFriendsKey();

        expect(key).toEqual(['queryFriends']);
    });
});

describe('queryFriends', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an object with the correct queryKey', () => {
        const result = queryFriends(authorization);

        expect(result.queryKey).toEqual(['queryFriends']);
    });

    it('returns an object with a queryFn function', () => {
        const result = queryFriends(authorization);

        expect(result.queryFn).toBeTypeOf('function');
    });

    it('returns an object with staleTime set to 3_600_000', () => {
        const result = queryFriends(authorization);

        expect(result.staleTime).toBe(3_600_000);
    });

    it('spreads custom options onto the returned object', () => {
        const result = queryFriends(authorization, { enabled: false });

        expect(result.enabled).toBe(false);
    });
});

describe('buildQueryFriendKey', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns a tuple with the query name and friendId', () => {
        const key = buildQueryFriendKey({ friendId: 'friend-42' });

        expect(key).toEqual(['queryFriend', 'friend-42']);
    });

    it('uses params.friendId directly in the key', () => {
        const key = buildQueryFriendKey({ friendId: 'abc-123' });

        expect(key[1]).toBe('abc-123');
    });
});

describe('queryFriend', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an object with the correct queryKey', () => {
        const result = queryFriend(authorization, { friendId: 'friend-42' });

        expect(result.queryKey).toEqual(['queryFriend', 'friend-42']);
    });

    it('returns an object with a queryFn function', () => {
        const result = queryFriend(authorization, { friendId: 'friend-42' });

        expect(result.queryFn).toBeTypeOf('function');
    });

    it('returns an object with staleTime set to 3_600_000', () => {
        const result = queryFriend(authorization, { friendId: 'friend-42' });

        expect(result.staleTime).toBe(3_600_000);
    });

    it('spreads custom options onto the returned object', () => {
        const result = queryFriend(authorization, { friendId: 'friend-42' }, { enabled: false });

        expect(result.enabled).toBe(false);
    });
});
