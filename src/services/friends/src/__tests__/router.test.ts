import { beforeEach, describe, expect, it } from 'vitest';
import type { Friend, UserContext } from '@/types.js';
import { router } from '@/router.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

describe('router', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
    });

    it('routes POST / to sendFriendRequest', async () => {
        const response = await router(
            {
                httpMethod: 'POST',
                path: '/',
                resource: '/',
                body: JSON.stringify({ userId: 'user-2' }),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toMatchObject({ userId: 'user-2' });
    });

    it('routes GET / to listFriends', async () => {
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

    it('routes GET /{id} to getFriend', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/',
                resource: '/',
                body: JSON.stringify({ userId: 'user-2' }),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as Friend;

        const response = await router(
            {
                httpMethod: 'GET',
                path: `/${created.id}`,
                resource: '/{id}',
                body: null,
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ id: created.id });
    });

    it('routes PUT /{id} to updateFriend', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/',
                resource: '/',
                body: JSON.stringify({ userId: 'user-2' }),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as Friend;

        const response = await router(
            {
                httpMethod: 'PUT',
                path: `/${created.id}`,
                resource: '/{id}',
                body: JSON.stringify({ status: 'accepted' }),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ status: 'accepted' });
    });

    it('routes DELETE /{id} to deleteFriend', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/',
                resource: '/',
                body: JSON.stringify({ userId: 'user-2' }),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as Friend;

        const response = await router(
            {
                httpMethod: 'DELETE',
                path: `/${created.id}`,
                resource: '/{id}',
                body: null,
                pathParameters: { id: created.id },
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
