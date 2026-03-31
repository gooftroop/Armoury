import { beforeEach, describe, expect, it } from 'vitest';
import type { Friend, UserContext } from '@/types.js';
import { deleteFriend, getFriend, listFriends, sendFriendRequest, updateFriend } from '@/routes/friends.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    userId: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

describe('friend routes', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
    });

    describe('sendFriendRequest', () => {
        it('creates a pending friend request and returns 201', async () => {
            const response = await sendFriendRequest(adapter, { userId: 'user-2' }, null, baseUserContext);

            expect(response.statusCode).toBe(201);
            const payload = JSON.parse(response.body) as Friend;

            expect(payload.id).toEqual(expect.any(String));
            expect(payload.ownerId).toBe(baseUserContext.userId);
            expect(payload.userId).toBe('user-2');
            expect(payload.status).toBe('pending');
            expect(payload.canShareArmyLists).toBe(false);
            expect(payload.canViewMatchHistory).toBe(false);
        });

        it('returns 400 when body is null', async () => {
            const response = await sendFriendRequest(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 400 when required fields are missing', async () => {
            const response = await sendFriendRequest(adapter, {}, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });
    });

    describe('listFriends', () => {
        it('returns empty array when no friends exist', async () => {
            const response = await listFriends(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual([]);
        });

        it('returns friends owned by the authenticated user', async () => {
            const friend = buildFriend('friend-1', 'user-1', 'user-2');

            await adapter.put('friend', friend);

            const response = await listFriends(adapter, null, null, baseUserContext);
            const payload = JSON.parse(response.body) as Friend[];

            expect(response.statusCode).toBe(200);
            expect(payload).toHaveLength(1);
            expect(payload[0].ownerId).toBe('user-1');
            expect(payload[0].userId).toBe('user-2');
        });

        it('does not return friends owned by other users', async () => {
            const friend = buildFriend('friend-1', 'user-2', 'user-3');

            await adapter.put('friend', friend);

            const response = await listFriends(adapter, null, null, baseUserContext);
            const payload = JSON.parse(response.body) as Friend[];

            expect(response.statusCode).toBe(200);
            expect(payload).toHaveLength(0);
        });

        it('excludes friends where user is neither owner nor friend', async () => {
            const friend = buildFriend('friend-1', 'user-3', 'user-4');

            await adapter.put('friend', friend);

            const response = await listFriends(adapter, null, null, baseUserContext);
            const payload = JSON.parse(response.body) as Friend[];

            expect(response.statusCode).toBe(200);
            expect(payload).toHaveLength(0);
        });
    });

    describe('getFriend', () => {
        it('returns 200 with friend entity', async () => {
            const friend = buildFriend('friend-1', 'user-1', 'user-2');

            await adapter.put('friend', friend);

            const response = await getFriend(adapter, null, { id: 'friend-1' }, baseUserContext);
            const payload = JSON.parse(response.body) as Friend;

            expect(response.statusCode).toBe(200);
            expect(payload.id).toBe('friend-1');
        });

        it('returns 400 when id is missing', async () => {
            const response = await getFriend(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when friend not found', async () => {
            const response = await getFriend(adapter, null, { id: 'missing' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
        });
    });

    describe('updateFriend', () => {
        it('transitions status from pending to accepted', async () => {
            const senderRecord = buildFriend('friend-1', 'user-1', 'user-2');
            const receiverRecord = buildFriend('friend-2', 'user-2', 'user-1');

            await adapter.put('friend', senderRecord);
            await adapter.put('friend', receiverRecord);

            const response = await updateFriend(adapter, { status: 'accepted' }, { id: 'friend-1' }, baseUserContext);
            const payload = JSON.parse(response.body) as Friend;

            expect(response.statusCode).toBe(200);
            expect(payload.status).toBe('accepted');
        });

        it('transitions status from pending to blocked', async () => {
            const senderRecord = buildFriend('friend-1', 'user-1', 'user-2');
            const receiverRecord = buildFriend('friend-2', 'user-2', 'user-1');

            await adapter.put('friend', senderRecord);
            await adapter.put('friend', receiverRecord);

            const response = await updateFriend(adapter, { status: 'blocked' }, { id: 'friend-1' }, baseUserContext);
            const payload = JSON.parse(response.body) as Friend;

            expect(response.statusCode).toBe(200);
            expect(payload.status).toBe('blocked');
        });

        it('returns 400 for invalid status transition', async () => {
            const friend = buildFriend('friend-1', 'user-1', 'user-2');

            friend.status = 'blocked';
            await adapter.put('friend', friend);

            const response = await updateFriend(adapter, { status: 'accepted' }, { id: 'friend-1' }, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({
                error: 'ValidationError',
                message: 'Cannot transition from blocked to accepted',
            });
        });

        it('updates sharing permissions', async () => {
            const friend = buildFriend('friend-1', 'user-1', 'user-2');

            await adapter.put('friend', friend);

            const response = await updateFriend(
                adapter,
                { canShareArmyLists: true, canViewMatchHistory: true },
                { id: 'friend-1' },
                baseUserContext,
            );
            const payload = JSON.parse(response.body) as Friend;

            expect(response.statusCode).toBe(200);
            expect(payload.canShareArmyLists).toBe(true);
            expect(payload.canViewMatchHistory).toBe(true);
        });

        it('syncs status change to mirror record', async () => {
            const senderRecord = buildFriend('friend-1', 'user-1', 'user-2');
            const receiverRecord = buildFriend('friend-2', 'user-2', 'user-1');

            await adapter.put('friend', senderRecord);
            await adapter.put('friend', receiverRecord);

            await updateFriend(adapter, { status: 'accepted' }, { id: 'friend-1' }, baseUserContext);

            const mirror = await adapter.get('friend', 'friend-2');

            expect(mirror).not.toBeNull();
            expect(mirror!.status).toBe('accepted');
        });

        it('returns 400 when id is missing', async () => {
            const response = await updateFriend(adapter, { status: 'accepted' }, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when friend not found', async () => {
            const response = await updateFriend(adapter, { status: 'accepted' }, { id: 'missing' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
        });

        it('returns 400 when body is invalid', async () => {
            const response = await updateFriend(adapter, null, { id: 'friend-1' }, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });
    });

    describe('deleteFriend', () => {
        it('deletes friend and returns 204', async () => {
            const senderRecord = buildFriend('friend-1', 'user-1', 'user-2');
            const receiverRecord = buildFriend('friend-2', 'user-2', 'user-1');

            await adapter.put('friend', senderRecord);
            await adapter.put('friend', receiverRecord);

            const response = await deleteFriend(adapter, null, { id: 'friend-1' }, baseUserContext);

            expect(response.statusCode).toBe(204);
            expect(response.body).toBe('');
            await expect(adapter.get('friend', 'friend-1')).resolves.toBeNull();
        });

        it('deletes mirror record', async () => {
            const senderRecord = buildFriend('friend-1', 'user-1', 'user-2');
            const receiverRecord = buildFriend('friend-2', 'user-2', 'user-1');

            await adapter.put('friend', senderRecord);
            await adapter.put('friend', receiverRecord);

            await deleteFriend(adapter, null, { id: 'friend-1' }, baseUserContext);

            await expect(adapter.get('friend', 'friend-2')).resolves.toBeNull();
        });

        it('returns 400 when id is missing', async () => {
            const response = await deleteFriend(adapter, null, null, baseUserContext);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 404 when friend not found', async () => {
            const response = await deleteFriend(adapter, null, { id: 'missing' }, baseUserContext);

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
        });
    });
});

function buildFriend(id: string, ownerId: string, friendUserId: string): Friend {
    return {
        id,
        ownerId,
        userId: friendUserId,
        status: 'pending',
        canShareArmyLists: false,
        canViewMatchHistory: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };
}
