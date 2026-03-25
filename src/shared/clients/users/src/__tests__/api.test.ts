/**
 * Tests for all 9 API functions in the users client.
 *
 * Covers the 5 user endpoints (getUsers, getUser, postUser, putUser, deleteUser)
 * and the 4 account endpoints (getAccount, postAccount, putAccount, deleteAccount).
 *
 * Each test verifies the correct ky HTTP method is called with the expected URL,
 * prefixUrl, Authorization header, and JSON body where applicable.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
    CreateUserRequest,
    UpdateUserRequest,
    UserParams,
    CreateAccountRequest,
    UpdateAccountRequest,
} from '@/types.js';

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

import { getUsers } from '@/api/getUsers.js';
import { getUser } from '@/api/getUser.js';
import { postUser } from '@/api/postUser.js';
import { putUser } from '@/api/putUser.js';
import { deleteUser } from '@/api/deleteUser.js';
import { getAccount } from '@/api/getAccount.js';
import { postAccount } from '@/api/postAccount.js';
import { putAccount } from '@/api/putAccount.js';
import { deleteAccount } from '@/api/deleteAccount.js';

const AUTHORIZATION = 'Bearer test-token';

describe('User API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUsers', () => {
        it('calls ky.get with the correct URL', async () => {
            mockJson.mockResolvedValueOnce([]);

            await getUsers(AUTHORIZATION);

            expect(mockGet).toHaveBeenCalledWith('', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            mockJson.mockResolvedValueOnce([]);

            await getUsers(AUTHORIZATION);

            const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            mockJson.mockResolvedValueOnce([]);

            await getUsers(AUTHORIZATION);

            const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });
    });

    describe('getUser', () => {
        const params: UserParams = { userId: 'user-123' };

        it('calls ky.get with the correct URL including userId', async () => {
            mockJson.mockResolvedValueOnce({});

            await getUser(AUTHORIZATION, params);

            expect(mockGet).toHaveBeenCalledWith('user-123', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            mockJson.mockResolvedValueOnce({});

            await getUser(AUTHORIZATION, params);

            const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            mockJson.mockResolvedValueOnce({});

            await getUser(AUTHORIZATION, params);

            const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });
    });

    describe('postUser', () => {
        const params: CreateUserRequest = {
            sub: 'auth0|abc',
            email: 'test@example.com',
            name: 'Test User',
            picture: null,
        };

        it('calls ky.post with the correct URL', async () => {
            mockJson.mockResolvedValueOnce({});

            await postUser(AUTHORIZATION, params);

            expect(mockPost).toHaveBeenCalledWith('', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            mockJson.mockResolvedValueOnce({});

            await postUser(AUTHORIZATION, params);

            const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            mockJson.mockResolvedValueOnce({});

            await postUser(AUTHORIZATION, params);

            const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });

        it('passes the json body correctly', async () => {
            mockJson.mockResolvedValueOnce({});

            await postUser(AUTHORIZATION, params);

            const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.json).toEqual(params);
        });
    });

    describe('putUser', () => {
        const params: UserParams & UpdateUserRequest = {
            userId: 'user-123',
            email: 'updated@example.com',
            name: 'Updated User',
        };

        it('calls ky.put with the correct URL including userId', async () => {
            mockJson.mockResolvedValueOnce({});

            await putUser(AUTHORIZATION, params);

            expect(mockPut).toHaveBeenCalledWith('user-123', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            mockJson.mockResolvedValueOnce({});

            await putUser(AUTHORIZATION, params);

            const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            mockJson.mockResolvedValueOnce({});

            await putUser(AUTHORIZATION, params);

            const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });

        it('passes the json body without userId', async () => {
            mockJson.mockResolvedValueOnce({});

            await putUser(AUTHORIZATION, params);

            const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.json).toEqual({
                email: 'updated@example.com',
                name: 'Updated User',
            });
            expect(options.json).not.toHaveProperty('userId');
        });
    });

    describe('deleteUser', () => {
        const params: UserParams = { userId: 'user-123' };

        it('calls ky.delete with the correct URL including userId', async () => {
            await deleteUser(AUTHORIZATION, params);

            expect(mockDelete).toHaveBeenCalledWith('user-123', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            await deleteUser(AUTHORIZATION, params);

            const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            await deleteUser(AUTHORIZATION, params);

            const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });
    });
});

describe('Account API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAccount', () => {
        const params: UserParams = { userId: 'user-456' };

        it('calls ky.get with the correct nested URL', async () => {
            mockJson.mockResolvedValueOnce({});

            await getAccount(AUTHORIZATION, params);

            expect(mockGet).toHaveBeenCalledWith('user-456/account', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            mockJson.mockResolvedValueOnce({});

            await getAccount(AUTHORIZATION, params);

            const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            mockJson.mockResolvedValueOnce({});

            await getAccount(AUTHORIZATION, params);

            const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });
    });

    describe('postAccount', () => {
        const params: UserParams = { userId: 'user-456' };
        const body: CreateAccountRequest = {
            preferences: {
                theme: 'dark',
                language: 'en',
                notificationsEnabled: true,
            },
        };

        it('calls ky.post with the correct nested URL', async () => {
            mockJson.mockResolvedValueOnce({});

            await postAccount(AUTHORIZATION, params, body);

            expect(mockPost).toHaveBeenCalledWith('user-456/account', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            mockJson.mockResolvedValueOnce({});

            await postAccount(AUTHORIZATION, params, body);

            const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            mockJson.mockResolvedValueOnce({});

            await postAccount(AUTHORIZATION, params, body);

            const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });

        it('passes the json body correctly', async () => {
            mockJson.mockResolvedValueOnce({});

            await postAccount(AUTHORIZATION, params, body);

            const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.json).toEqual(body);
        });
    });

    describe('putAccount', () => {
        const params: UserParams = { userId: 'user-456' };
        const body: UpdateAccountRequest = {
            preferences: { theme: 'light', language: 'fr', notificationsEnabled: false },
        };

        it('calls ky.put with the correct nested URL', async () => {
            mockJson.mockResolvedValueOnce({});

            await putAccount(AUTHORIZATION, params, body);

            expect(mockPut).toHaveBeenCalledWith('user-456/account', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            mockJson.mockResolvedValueOnce({});

            await putAccount(AUTHORIZATION, params, body);

            const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            mockJson.mockResolvedValueOnce({});

            await putAccount(AUTHORIZATION, params, body);

            const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });

        it('passes the json body correctly', async () => {
            mockJson.mockResolvedValueOnce({});

            await putAccount(AUTHORIZATION, params, body);

            const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.json).toEqual(body);
        });
    });

    describe('deleteAccount', () => {
        const params: UserParams = { userId: 'user-456' };

        it('calls ky.delete with the correct nested URL', async () => {
            await deleteAccount(AUTHORIZATION, params);

            expect(mockDelete).toHaveBeenCalledWith('user-456/account', expect.any(Object));
        });

        it('passes prefixUrl in the options', async () => {
            await deleteAccount(AUTHORIZATION, params);

            const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.prefixUrl).toBeTruthy();
        });

        it('passes the Authorization header', async () => {
            await deleteAccount(AUTHORIZATION, params);

            const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
            expect(options.headers).toEqual({ Authorization: AUTHORIZATION });
        });
    });
});
