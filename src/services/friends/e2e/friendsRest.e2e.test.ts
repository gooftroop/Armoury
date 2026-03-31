import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Friend, SendFriendRequestPayload, UserContext } from '@/types.js';
import { router } from '@/router.js';
import { createE2EAdapter, resetDatabase } from '@/__testing__/e2eAdapter.js';
import type { LocalDatabaseAdapter } from '@/utils/localAdapter.js';

let adapter: LocalDatabaseAdapter;

const userA: UserContext = { userId: 'user-a', email: 'a@armoury.dev', name: 'Player A' };
const userB: UserContext = { userId: 'user-b', email: 'b@armoury.dev', name: 'Player B' };

const friendRequestBody: SendFriendRequestPayload = {
    userId: 'user-b',
};

function restEvent(method: string, resource: string, body?: unknown, pathParameters?: Record<string, string>) {
    return {
        httpMethod: method,
        path: resource,
        resource,
        body: body !== undefined ? JSON.stringify(body) : null,
        pathParameters: pathParameters ?? null,
    };
}

beforeAll(async () => {
    adapter = await createE2EAdapter();
});

afterAll(async () => {
    await resetDatabase(adapter);
});

describe('friends REST e2e', () => {
    beforeEach(async () => {
        await resetDatabase(adapter);
    });

    it('sends a friend request and returns 201 with pending status', async () => {
        const res = await router(restEvent('POST', '/', friendRequestBody), adapter, userA);

        expect(res.statusCode).toBe(201);
        const friend = JSON.parse(res.body) as Friend;
        expect(friend.ownerId).toBe(userA.userId);
        expect(friend.userId).toBe(userB.userId);
        expect(friend.status).toBe('pending');
        expect(friend.id).toBeTruthy();
    });

    it('lists friends filtered by user', async () => {
        await router(restEvent('POST', '/', friendRequestBody), adapter, userA);

        const resA = await router(restEvent('GET', '/'), adapter, userA);
        const friendsA = JSON.parse(resA.body) as Friend[];
        expect(friendsA).toHaveLength(1);

        const resB = await router(restEvent('GET', '/'), adapter, userB);
        const friendsB = JSON.parse(resB.body) as Friend[];
        expect(friendsB).toHaveLength(1);
    });

    it('gets a friend by id', async () => {
        const createRes = await router(restEvent('POST', '/', friendRequestBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Friend;

        const getRes = await router(restEvent('GET', '/{id}', undefined, { id: created.id }), adapter, userA);

        expect(getRes.statusCode).toBe(200);
        const fetched = JSON.parse(getRes.body) as Friend;
        expect(fetched.id).toBe(created.id);
    });

    it('accepts a pending friend request', async () => {
        const createRes = await router(restEvent('POST', '/', friendRequestBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Friend;

        const updateRes = await router(
            restEvent('PUT', '/{id}', { status: 'accepted' }, { id: created.id }),
            adapter,
            userB,
        );

        expect(updateRes.statusCode).toBe(200);
        const updated = JSON.parse(updateRes.body) as Friend;
        expect(updated.status).toBe('accepted');
    });

    it('blocks a pending friend request', async () => {
        const createRes = await router(restEvent('POST', '/', friendRequestBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Friend;

        const updateRes = await router(
            restEvent('PUT', '/{id}', { status: 'blocked' }, { id: created.id }),
            adapter,
            userB,
        );

        expect(updateRes.statusCode).toBe(200);
        const updated = JSON.parse(updateRes.body) as Friend;
        expect(updated.status).toBe('blocked');
    });

    it('rejects invalid status transition from blocked', async () => {
        const createRes = await router(restEvent('POST', '/', friendRequestBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Friend;

        await router(restEvent('PUT', '/{id}', { status: 'blocked' }, { id: created.id }), adapter, userB);

        const res = await router(restEvent('PUT', '/{id}', { status: 'accepted' }, { id: created.id }), adapter, userB);

        expect(res.statusCode).toBe(400);
    });

    it('deletes a friend relationship', async () => {
        const createRes = await router(restEvent('POST', '/', friendRequestBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Friend;

        const deleteRes = await router(restEvent('DELETE', '/{id}', undefined, { id: created.id }), adapter, userA);
        expect(deleteRes.statusCode).toBe(204);

        const getRes = await router(restEvent('GET', '/{id}', undefined, { id: created.id }), adapter, userA);
        expect(getRes.statusCode).toBe(404);
    });

    it('returns 404 for nonexistent friend', async () => {
        const res = await router(restEvent('GET', '/{id}', undefined, { id: 'nonexistent' }), adapter, userA);
        expect(res.statusCode).toBe(404);
    });
});
