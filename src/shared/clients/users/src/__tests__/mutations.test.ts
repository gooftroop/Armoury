/**
 * Tests for all 6 mutation options builders in the users client.
 *
 * Covers mutationCreateUser, mutationUpdateUser, mutationDeleteUser,
 * mutationCreateAccount, mutationUpdateAccount, and mutationDeleteAccount.
 *
 * Each test verifies the builder returns an object with mutationFn (function),
 * does NOT include a mutationKey, and spreads custom options correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
    UserParams,
    CreateUserRequest,
    UpdateUserRequest,
    CreateAccountRequest,
    UpdateAccountRequest,
} from '@clients-users/types.js';

vi.mock('ky', () => ({
    default: {
        get: vi.fn(() => ({ json: vi.fn() })),
        post: vi.fn(() => ({ json: vi.fn() })),
        put: vi.fn(() => ({ json: vi.fn() })),
        delete: vi.fn(() => Promise.resolve()),
    },
}));

import { mutationCreateUser } from '@clients-users/mutations/mutationCreateUser.js';
import { mutationUpdateUser } from '@clients-users/mutations/mutationUpdateUser.js';
import { mutationDeleteUser } from '@clients-users/mutations/mutationDeleteUser.js';
import { mutationCreateAccount } from '@clients-users/mutations/mutationCreateAccount.js';
import { mutationUpdateAccount } from '@clients-users/mutations/mutationUpdateAccount.js';
import { mutationDeleteAccount } from '@clients-users/mutations/mutationDeleteAccount.js';

const AUTHORIZATION = 'Bearer test-token';

describe('User mutation builders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('mutationCreateUser', () => {
        const params: CreateUserRequest = {
            sub: 'auth0|abc',
            email: 'test@example.com',
            name: 'Test User',
            picture: null,
        };

        it('returns an object with a mutationFn function', () => {
            const result = mutationCreateUser(AUTHORIZATION, params);

            expect(result.mutationFn).toBeTypeOf('function');
        });

        it('does not include a mutationKey', () => {
            const result = mutationCreateUser(AUTHORIZATION, params);

            expect(result).not.toHaveProperty('mutationKey');
        });

        it('spreads custom options into the result', () => {
            const onSuccess = vi.fn();
            const result = mutationCreateUser(AUTHORIZATION, params, { onSuccess });

            expect(result.onSuccess).toBe(onSuccess);
        });
    });

    describe('mutationUpdateUser', () => {
        const params: UserParams & UpdateUserRequest = {
            userId: 'user-123',
            email: 'updated@example.com',
            name: 'Updated User',
        };

        it('returns an object with a mutationFn function', () => {
            const result = mutationUpdateUser(AUTHORIZATION, params);

            expect(result.mutationFn).toBeTypeOf('function');
        });

        it('does not include a mutationKey', () => {
            const result = mutationUpdateUser(AUTHORIZATION, params);

            expect(result).not.toHaveProperty('mutationKey');
        });

        it('spreads custom options into the result', () => {
            const onSuccess = vi.fn();
            const result = mutationUpdateUser(AUTHORIZATION, params, { onSuccess });

            expect(result.onSuccess).toBe(onSuccess);
        });
    });

    describe('mutationDeleteUser', () => {
        const params: UserParams = { userId: 'user-123' };

        it('returns an object with a mutationFn function', () => {
            const result = mutationDeleteUser(AUTHORIZATION, params);

            expect(result.mutationFn).toBeTypeOf('function');
        });

        it('does not include a mutationKey', () => {
            const result = mutationDeleteUser(AUTHORIZATION, params);

            expect(result).not.toHaveProperty('mutationKey');
        });

        it('spreads custom options into the result', () => {
            const onSuccess = vi.fn();
            const result = mutationDeleteUser(AUTHORIZATION, params, { onSuccess });

            expect(result.onSuccess).toBe(onSuccess);
        });
    });
});

describe('Account mutation builders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('mutationCreateAccount', () => {
        const params: UserParams = { userId: 'user-456' };
        const body: CreateAccountRequest = {
            preferences: {
                theme: 'dark',
                language: 'en',
                notificationsEnabled: true,
            },
        };

        it('returns an object with a mutationFn function', () => {
            const result = mutationCreateAccount(AUTHORIZATION, params, body);

            expect(result.mutationFn).toBeTypeOf('function');
        });

        it('does not include a mutationKey', () => {
            const result = mutationCreateAccount(AUTHORIZATION, params, body);

            expect(result).not.toHaveProperty('mutationKey');
        });

        it('spreads custom options into the result', () => {
            const onSuccess = vi.fn();
            const result = mutationCreateAccount(AUTHORIZATION, params, body, { onSuccess });

            expect(result.onSuccess).toBe(onSuccess);
        });
    });

    describe('mutationUpdateAccount', () => {
        const params: UserParams = { userId: 'user-456' };
        const body: UpdateAccountRequest = {
            preferences: { theme: 'light', language: 'fr', notificationsEnabled: false },
        };

        it('returns an object with a mutationFn function', () => {
            const result = mutationUpdateAccount(AUTHORIZATION, params, body);

            expect(result.mutationFn).toBeTypeOf('function');
        });

        it('does not include a mutationKey', () => {
            const result = mutationUpdateAccount(AUTHORIZATION, params, body);

            expect(result).not.toHaveProperty('mutationKey');
        });

        it('spreads custom options into the result', () => {
            const onSuccess = vi.fn();
            const result = mutationUpdateAccount(AUTHORIZATION, params, body, { onSuccess });

            expect(result.onSuccess).toBe(onSuccess);
        });
    });

    describe('mutationDeleteAccount', () => {
        const params: UserParams = { userId: 'user-456' };

        it('returns an object with a mutationFn function', () => {
            const result = mutationDeleteAccount(AUTHORIZATION, params);

            expect(result.mutationFn).toBeTypeOf('function');
        });

        it('does not include a mutationKey', () => {
            const result = mutationDeleteAccount(AUTHORIZATION, params);

            expect(result).not.toHaveProperty('mutationKey');
        });

        it('spreads custom options into the result', () => {
            const onSuccess = vi.fn();
            const result = mutationDeleteAccount(AUTHORIZATION, params, { onSuccess });

            expect(result.onSuccess).toBe(onSuccess);
        });
    });
});
