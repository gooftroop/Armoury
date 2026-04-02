/**
 * Unit tests for the friends REST API client functions.
 *
 * Tests all 5 API functions (getFriends, getFriend, postFriendRequest,
 * putFriend, deleteFriend) to verify correct ky method usage, URL paths,
 * authorization headers, and request body handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockJson, mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => {
    const mockJson = vi.fn();

    return {
        mockJson,
        mockGet: vi.fn(() => ({ json: mockJson })),
        mockPost: vi.fn(() => ({ json: mockJson })),
        mockPut: vi.fn(() => ({ json: mockJson })),
        mockDelete: vi.fn(() => Promise.resolve()),
    };
});

vi.mock('ky', () => ({
    default: {
        get: mockGet,
        post: mockPost,
        put: mockPut,
        delete: mockDelete,
    },
}));

import { getFriends } from '@/api/getFriends.js';
import { getFriend } from '@/api/getFriend.js';
import { postFriendRequest } from '@/api/postFriendRequest.js';
import { putFriend } from '@/api/putFriend.js';
import { deleteFriend } from '@/api/deleteFriend.js';
import type { Friend } from '@/types.js';

const mockFriend: Friend = {
    id: 'friend-1',
    ownerId: 'owner-1',
    userId: 'user-2',
    status: 'accepted',
    canShareArmyLists: true,
    canViewMatchHistory: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
};

const authorization = 'Bearer test-token-123';

describe('getFriends', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls ky.get with the correct URL path', async () => {
        mockJson.mockResolvedValueOnce([mockFriend]);

        await getFriends(authorization);

        expect(mockGet).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('sets prefixUrl from FRIENDS_BASE_URL', async () => {
        mockJson.mockResolvedValueOnce([mockFriend]);

        await getFriends(authorization);

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;

        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce([mockFriend]);

        await getFriends(authorization);

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        const headers = options.headers as Record<string, string>;

        expect(headers.Authorization).toBe(authorization);
    });

    it('returns the JSON response as Friend[]', async () => {
        mockJson.mockResolvedValueOnce([mockFriend]);

        const result = await getFriends(authorization);

        expect(result).toEqual([mockFriend]);
    });
});

describe('getFriend', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls ky.get with the correct URL path including friendId', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await getFriend(authorization, { friendId: 'friend-1' });

        expect(mockGet).toHaveBeenCalledWith('friend-1', expect.any(Object));
    });

    it('sets prefixUrl from FRIENDS_BASE_URL', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await getFriend(authorization, { friendId: 'friend-1' });

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;

        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await getFriend(authorization, { friendId: 'friend-1' });

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        const headers = options.headers as Record<string, string>;

        expect(headers.Authorization).toBe(authorization);
    });

    it('returns the JSON response as Friend', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        const result = await getFriend(authorization, { friendId: 'friend-1' });

        expect(result).toEqual(mockFriend);
    });
});

describe('postFriendRequest', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls ky.post with the correct URL path', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await postFriendRequest(authorization, { userId: 'user-2' });

        expect(mockPost).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('sets prefixUrl from FRIENDS_BASE_URL', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await postFriendRequest(authorization, { userId: 'user-2' });

        const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;

        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await postFriendRequest(authorization, { userId: 'user-2' });

        const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        const headers = options.headers as Record<string, string>;

        expect(headers.Authorization).toBe(authorization);
    });

    it('passes the params as JSON body', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await postFriendRequest(authorization, { userId: 'user-2' });

        const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;

        expect(options.json).toEqual({ userId: 'user-2' });
    });

    it('returns the JSON response as Friend', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        const result = await postFriendRequest(authorization, { userId: 'user-2' });

        expect(result).toEqual(mockFriend);
    });
});

describe('putFriend', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls ky.put with the correct URL path including friendId', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await putFriend(authorization, { friendId: 'friend-1', status: 'accepted' });

        expect(mockPut).toHaveBeenCalledWith('friend-1', expect.any(Object));
    });

    it('sets prefixUrl from FRIENDS_BASE_URL', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await putFriend(authorization, { friendId: 'friend-1', status: 'accepted' });

        const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;

        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await putFriend(authorization, { friendId: 'friend-1', status: 'accepted' });

        const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        const headers = options.headers as Record<string, string>;

        expect(headers.Authorization).toBe(authorization);
    });

    it('passes update fields as JSON body without friendId', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        await putFriend(authorization, {
            friendId: 'friend-1',
            status: 'accepted',
            canShareArmyLists: true,
        });

        const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        const json = options.json as Record<string, unknown>;

        expect(json).toEqual({ status: 'accepted', canShareArmyLists: true });
        expect(json).not.toHaveProperty('friendId');
    });

    it('returns the JSON response as Friend', async () => {
        mockJson.mockResolvedValueOnce(mockFriend);

        const result = await putFriend(authorization, { friendId: 'friend-1', status: 'accepted' });

        expect(result).toEqual(mockFriend);
    });
});

describe('deleteFriend', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls ky.delete with the correct URL path including friendId', async () => {
        await deleteFriend(authorization, { friendId: 'friend-1' });

        expect(mockDelete).toHaveBeenCalledWith('friend-1', expect.any(Object));
    });

    it('sets prefixUrl from FRIENDS_BASE_URL', async () => {
        await deleteFriend(authorization, { friendId: 'friend-1' });

        const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;

        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        await deleteFriend(authorization, { friendId: 'friend-1' });

        const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        const headers = options.headers as Record<string, string>;

        expect(headers.Authorization).toBe(authorization);
    });

    it('returns void', async () => {
        const result = await deleteFriend(authorization, { friendId: 'friend-1' });

        expect(result).toBeUndefined();
    });
});
