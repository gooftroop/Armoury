import { beforeEach, describe, expect, it } from 'vitest';
import type { Account, User, UserContext } from '@/types.js';
import { router } from '@/router.js';
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

const seedAccount: Account = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'user-1',
    preferences: { theme: 'dark', language: 'en', notificationsEnabled: true },
    systems: {},
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('router', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
    });

    it('routes POST / to createUser (returns 201)', async () => {
        const response = await router(
            {
                httpMethod: 'POST',
                path: '/',
                resource: '/',
                body: JSON.stringify({ sub: 'auth0|user-1', email: 'user@test.com', name: 'Test', picture: null }),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toMatchObject({ sub: 'auth0|user-1' });
    });

    it('routes GET / to listUsers (returns 200, empty array)', async () => {
        const response = await router(
            {
                httpMethod: 'GET',
                path: '/',
                resource: '/',
                body: null,
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual([]);
    });

    it('routes GET /{id} to getUser (returns 200)', async () => {
        await adapter.put('user', seedUser);

        const response = await router(
            {
                httpMethod: 'GET',
                path: '/user-1',
                resource: '/{id}',
                body: null,
                pathParameters: { id: 'user-1' },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ id: 'user-1' });
    });

    it('routes PUT /{id} to updateUser (returns 200)', async () => {
        await adapter.put('user', seedUser);

        const response = await router(
            {
                httpMethod: 'PUT',
                path: '/user-1',
                resource: '/{id}',
                body: JSON.stringify({ email: 'updated@test.com' }),
                pathParameters: { id: 'user-1' },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ email: 'updated@test.com' });
    });

    it('routes DELETE /{id} to deleteUser (returns 204)', async () => {
        await adapter.put('user', seedUser);

        const response = await router(
            {
                httpMethod: 'DELETE',
                path: '/user-1',
                resource: '/{id}',
                body: null,
                pathParameters: { id: 'user-1' },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');
    });

    it('routes GET /{id}/account to getAccount (returns 200)', async () => {
        await adapter.put('user', seedUser);
        await adapter.put('account', seedAccount);

        const response = await router(
            {
                httpMethod: 'GET',
                path: '/user-1/account',
                resource: '/{id}/account',
                body: null,
                pathParameters: { id: 'user-1' },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ userId: 'user-1' });
    });

    it('routes POST /{id}/account to createAccount (returns 201)', async () => {
        await adapter.put('user', seedUser);

        const response = await router(
            {
                httpMethod: 'POST',
                path: '/user-1/account',
                resource: '/{id}/account',
                body: JSON.stringify({
                    preferences: { theme: 'dark', language: 'en', notificationsEnabled: true },
                }),
                pathParameters: { id: 'user-1' },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toMatchObject({ userId: 'user-1' });
    });

    it('routes PUT /{id}/account to updateAccount (returns 200)', async () => {
        await adapter.put('user', seedUser);
        await adapter.put('account', seedAccount);

        const response = await router(
            {
                httpMethod: 'PUT',
                path: '/user-1/account',
                resource: '/{id}/account',
                body: JSON.stringify({ preferences: { theme: 'light', language: 'en', notificationsEnabled: false } }),
                pathParameters: { id: 'user-1' },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ preferences: { theme: 'light' } });
    });

    it('routes DELETE /{id}/account to deleteAccount (returns 204)', async () => {
        await adapter.put('user', seedUser);
        await adapter.put('account', seedAccount);

        const response = await router(
            {
                httpMethod: 'DELETE',
                path: '/user-1/account',
                resource: '/{id}/account',
                body: null,
                pathParameters: { id: 'user-1' },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');
    });

    it('returns 404 for unknown routes', async () => {
        const response = await router(
            {
                httpMethod: 'GET',
                path: '/unknown',
                resource: '/unknown',
                body: null,
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('returns 400 for invalid JSON body', async () => {
        const response = await router(
            {
                httpMethod: 'POST',
                path: '/',
                resource: '/',
                body: '{invalid-json',
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });
});
