import { beforeEach, describe, expect, it } from 'vitest';
import type { Account, User, UserContext } from '@/types.js';
import { createAccount, deleteAccount, getAccount, updateAccount } from '@/routes/accounts.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    userId: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

const seedUser: User = {
    id: 'user-1',
    sub: 'auth0|user-1',
    email: 'user@test.com',
    name: 'Test User',
    picture: null,
    accountId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
};

const validAccountPayload = {
    preferences: { theme: 'dark' as const, language: 'en', notificationsEnabled: true },
};

describe('account routes', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.put('user', seedUser);
    });

    describe('getAccount', () => {
        it('returns 200 with account', async () => {
            const createResponse = await createAccount(adapter, validAccountPayload, { id: 'user-1' }, baseUserContext);

            expect(createResponse.statusCode).toBe(201);

            const response = await getAccount(adapter, null, { id: 'user-1' }, baseUserContext);
            const payload = JSON.parse(response.body) as Account;

            expect(response.statusCode).toBe(200);
            expect(payload.userId).toBe('user-1');
            expect(payload.preferences.theme).toBe('dark');
        });

        it('returns 400 when id is missing', async () => {
            const response = await getAccount(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when user not found', async () => {
            const response = await getAccount(adapter, null, { id: 'no-user' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound', message: 'User not found' });
        });

        it('returns 404 when account not found for user', async () => {
            const response = await getAccount(adapter, null, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({
                error: 'NotFound',
                message: 'Account not found for this user',
            });
        });
    });

    describe('createAccount', () => {
        it('returns 201', async () => {
            const response = await createAccount(adapter, validAccountPayload, { id: 'user-1' }, baseUserContext);
            const payload = JSON.parse(response.body) as Account;

            expect(response.statusCode).toBe(201);
            expect(payload.userId).toBe('user-1');
            expect(payload.preferences.theme).toBe('dark');
        });

        it('returns 400 when body is null', async () => {
            const response = await createAccount(adapter, null, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 400 on invalid body', async () => {
            const response = await createAccount(adapter, {}, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when user not found', async () => {
            const response = await createAccount(adapter, validAccountPayload, { id: 'no-user' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
        });

        it('returns 409 when account already exists', async () => {
            await createAccount(adapter, validAccountPayload, { id: 'user-1' }, baseUserContext);

            const response = await createAccount(adapter, validAccountPayload, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(409);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'Conflict' });
        });
    });

    describe('updateAccount', () => {
        it('returns 200 with updated fields', async () => {
            await createAccount(adapter, validAccountPayload, { id: 'user-1' }, baseUserContext);

            const response = await updateAccount(
                adapter,
                { preferences: { theme: 'light', language: 'fr', notificationsEnabled: false } },
                { id: 'user-1' },
                baseUserContext,
            );
            const payload = JSON.parse(response.body) as Account;

            expect(response.statusCode).toBe(200);
            expect(payload.preferences.theme).toBe('light');
        });

        it('returns 400 when body is null', async () => {
            const response = await updateAccount(adapter, null, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when user not found', async () => {
            const response = await updateAccount(
                adapter,
                { preferences: { theme: 'light', language: 'en', notificationsEnabled: true } },
                { id: 'no-user' },
                baseUserContext,
            );

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound', message: 'User not found' });
        });

        it('returns 404 when account not found', async () => {
            const response = await updateAccount(
                adapter,
                { preferences: { theme: 'light', language: 'en', notificationsEnabled: true } },
                { id: 'user-1' },
                baseUserContext,
            );

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({
                error: 'NotFound',
                message: 'Account not found for this user',
            });
        });
    });

    describe('deleteAccount', () => {
        it('returns 204', async () => {
            await createAccount(adapter, validAccountPayload, { id: 'user-1' }, baseUserContext);

            const response = await deleteAccount(adapter, null, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(204);
            expect(response.body).toBe('');
        });

        it('returns 400 when id is missing', async () => {
            const response = await deleteAccount(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when account not found', async () => {
            const response = await deleteAccount(adapter, null, { id: 'user-1' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({
                error: 'NotFound',
                message: 'Account not found for this user',
            });
        });
    });
});
