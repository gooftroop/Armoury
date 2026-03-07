/**
 * Unit tests for the friends React Query mutation options builders.
 *
 * Tests all 3 mutation builders (mutationSendFriendRequest, mutationUpdateFriend,
 * mutationDeleteFriend) to verify mutationFn presence, absence of mutationKey,
 * and custom option spreading.
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

import { mutationSendFriendRequest } from '@clients-friends/mutations/mutationSendFriendRequest.js';
import { mutationUpdateFriend } from '@clients-friends/mutations/mutationUpdateFriend.js';
import { mutationDeleteFriend } from '@clients-friends/mutations/mutationDeleteFriend.js';

const authorization = 'Bearer test-token-123';

describe('mutationSendFriendRequest', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an object with a mutationFn function', () => {
        const result = mutationSendFriendRequest(authorization, { userId: 'user-2' });

        expect(result.mutationFn).toBeTypeOf('function');
    });

    it('does not include a mutationKey', () => {
        const result = mutationSendFriendRequest(authorization, { userId: 'user-2' });

        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options onto the returned object', () => {
        const onSuccess = vi.fn();

        const result = mutationSendFriendRequest(authorization, { userId: 'user-2' }, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
    });
});

describe('mutationUpdateFriend', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an object with a mutationFn function', () => {
        const result = mutationUpdateFriend(authorization, {
            friendId: 'friend-1',
            status: 'accepted',
        });

        expect(result.mutationFn).toBeTypeOf('function');
    });

    it('does not include a mutationKey', () => {
        const result = mutationUpdateFriend(authorization, {
            friendId: 'friend-1',
            status: 'accepted',
        });

        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options onto the returned object', () => {
        const onSuccess = vi.fn();

        const result = mutationUpdateFriend(
            authorization,
            { friendId: 'friend-1', status: 'accepted' },
            { onSuccess },
        );

        expect(result.onSuccess).toBe(onSuccess);
    });
});

describe('mutationDeleteFriend', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an object with a mutationFn function', () => {
        const result = mutationDeleteFriend(authorization, { friendId: 'friend-1' });

        expect(result.mutationFn).toBeTypeOf('function');
    });

    it('does not include a mutationKey', () => {
        const result = mutationDeleteFriend(authorization, { friendId: 'friend-1' });

        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options onto the returned object', () => {
        const onSuccess = vi.fn();

        const result = mutationDeleteFriend(authorization, { friendId: 'friend-1' }, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
    });
});
