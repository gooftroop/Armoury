import { beforeEach, describe, it, expect } from 'vitest';
import { FriendDAO } from '../FriendDAO.ts';
import { MockDatabaseAdapter } from '../../__mocks__/MockDatabaseAdapter.ts';
import type { Friend } from '@armoury/models/FriendModel';

/**
 * Creates a minimal Friend fixture for testing.
 * @param overrides - Partial Friend properties to override defaults
 * @returns A complete Friend object
 */
function makeFriend(overrides: Partial<Friend> = {}): Friend {
    return {
        id: 'friend-1',
        ownerId: 'auth0|user-1',
        userId: 'auth0|user-2',
        status: 'accepted',
        canShareArmyLists: true,
        canViewMatchHistory: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('FriendDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: FriendDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new FriendDAO(adapter);
    });

    describe('listByStatus()', () => {
        it('returns only friends with status="accepted"', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f-2', status: 'pending' }));
            await adapter.put('friend', makeFriend({ id: 'f-3', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f-4', status: 'blocked' }));

            const accepted = await dao.listByStatus('accepted');

            expect(accepted).toHaveLength(2);
            expect(accepted.every((friend) => friend.status === 'accepted')).toBe(true);
            expect(accepted.map((f) => f.id).sort()).toEqual(['f-1', 'f-3']);
        });

        it('returns only friends with status="pending"', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f-2', status: 'pending' }));
            await adapter.put('friend', makeFriend({ id: 'f-3', status: 'pending' }));
            await adapter.put('friend', makeFriend({ id: 'f-4', status: 'blocked' }));

            const pending = await dao.listByStatus('pending');

            expect(pending).toHaveLength(2);
            expect(pending.every((friend) => friend.status === 'pending')).toBe(true);
            expect(pending.map((f) => f.id).sort()).toEqual(['f-2', 'f-3']);
        });

        it('returns only friends with status="blocked"', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f-2', status: 'pending' }));
            await adapter.put('friend', makeFriend({ id: 'f-3', status: 'blocked' }));

            const blocked = await dao.listByStatus('blocked');

            expect(blocked).toHaveLength(1);
            expect(blocked.every((friend) => friend.status === 'blocked')).toBe(true);
            expect(blocked[0].id).toBe('f-3');
        });

        it('returns empty array when no friends match the status', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f-2', status: 'accepted' }));

            const pending = await dao.listByStatus('pending');

            expect(pending).toEqual([]);
        });

        it('returns empty array when store is empty', async () => {
            const accepted = await dao.listByStatus('accepted');
            const pending = await dao.listByStatus('pending');
            const blocked = await dao.listByStatus('blocked');

            expect(accepted).toEqual([]);
            expect(pending).toEqual([]);
            expect(blocked).toEqual([]);
        });
    });

    describe('listByOwner()', () => {
        it('returns only friends owned by the specified user', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1', ownerId: 'auth0|user-1' }));
            await adapter.put('friend', makeFriend({ id: 'f-2', ownerId: 'auth0|user-2' }));
            await adapter.put('friend', makeFriend({ id: 'f-3', ownerId: 'auth0|user-1' }));

            const owned = await dao.listByOwner('auth0|user-1');

            expect(owned).toHaveLength(2);
            expect(owned.every((friend) => friend.ownerId === 'auth0|user-1')).toBe(true);
            expect(owned.map((f) => f.id).sort()).toEqual(['f-1', 'f-3']);
        });

        it('returns empty array when no friends are owned by the user', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1', ownerId: 'auth0|user-2' }));

            const owned = await dao.listByOwner('auth0|user-1');

            expect(owned).toEqual([]);
        });

        it('returns empty array when store is empty', async () => {
            const owned = await dao.listByOwner('auth0|user-1');

            expect(owned).toEqual([]);
        });
    });

    describe('BaseDAO CRUD operations (inherited)', () => {
        it('get() retrieves a friend by ID', async () => {
            const friend = makeFriend({ id: 'f-1' });
            await adapter.put('friend', friend);

            const retrieved = await dao.get('f-1');

            expect(retrieved).toEqual(friend);
        });

        it('get() returns null when friend does not exist', async () => {
            const retrieved = await dao.get('nonexistent');

            expect(retrieved).toBeNull();
        });

        it('save() persists a friend to the store', async () => {
            const friend = makeFriend({ id: 'f-1' });

            await dao.save(friend);

            const retrieved = await adapter.get('friend', 'f-1');
            expect(retrieved).toEqual(friend);
        });

        it('list() returns all friends', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1' }));
            await adapter.put('friend', makeFriend({ id: 'f-2' }));
            await adapter.put('friend', makeFriend({ id: 'f-3' }));

            const all = await dao.list();

            expect(all).toHaveLength(3);
        });

        it('delete() removes a friend by ID', async () => {
            const friend = makeFriend({ id: 'f-1' });
            await adapter.put('friend', friend);

            await dao.delete('f-1');

            const retrieved = await adapter.get('friend', 'f-1');
            expect(retrieved).toBeNull();
        });

        it('deleteAll() removes all friends from the store', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1' }));
            await adapter.put('friend', makeFriend({ id: 'f-2' }));
            await adapter.put('friend', makeFriend({ id: 'f-3' }));

            await dao.deleteAll();

            const all = await dao.list();
            expect(all).toEqual([]);
        });

        it('count() returns the total number of friends', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1' }));
            await adapter.put('friend', makeFriend({ id: 'f-2' }));

            const count = await dao.count();

            expect(count).toBe(2);
        });

        it('saveMany() persists multiple friends at once', async () => {
            const friends = [makeFriend({ id: 'f-1' }), makeFriend({ id: 'f-2' }), makeFriend({ id: 'f-3' })];

            await dao.saveMany(friends);

            const all = await dao.list();
            expect(all).toHaveLength(3);
        });
    });

    describe('Edge cases', () => {
        it('listByStatus() works correctly after save()', async () => {
            const friend = makeFriend({ id: 'f-1', status: 'pending' });

            await dao.save(friend);

            const pending = await dao.listByStatus('pending');
            expect(pending).toHaveLength(1);
            expect(pending[0].id).toBe('f-1');
        });

        it('listByStatus() reflects changes after status update', async () => {
            const friend = makeFriend({ id: 'f-1', status: 'pending' });
            await dao.save(friend);

            const updatedFriend = { ...friend, status: 'accepted' as const };
            await dao.save(updatedFriend);

            const pending = await dao.listByStatus('pending');
            const accepted = await dao.listByStatus('accepted');

            expect(pending).toEqual([]);
            expect(accepted).toHaveLength(1);
            expect(accepted[0].id).toBe('f-1');
        });

        it('listByStatus() returns empty after deleteAll()', async () => {
            await adapter.put('friend', makeFriend({ id: 'f-1', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f-2', status: 'pending' }));

            await dao.deleteAll();

            const accepted = await dao.listByStatus('accepted');
            const pending = await dao.listByStatus('pending');

            expect(accepted).toEqual([]);
            expect(pending).toEqual([]);
        });
    });
});
