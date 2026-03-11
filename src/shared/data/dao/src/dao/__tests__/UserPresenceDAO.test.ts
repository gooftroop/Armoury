import { beforeEach, describe, it, expect, vi } from 'vitest';
import { UserPresenceDAO } from '../UserPresenceDAO.ts';
import { MockDatabaseAdapter } from '../../__mocks__/MockDatabaseAdapter.ts';
import type { UserPresence } from '@armoury/models/UserPresenceModel';

function makePresence(overrides: Partial<UserPresence> = {}): UserPresence {
    return {
        userId: 'user-1',
        connectionId: 'conn-1',
        status: 'online',
        lastSeen: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('UserPresenceDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: UserPresenceDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new UserPresenceDAO(adapter);
    });

    describe('constructor', () => {
        it('creates a UserPresenceDAO instance', () => {
            expect(dao).toBeInstanceOf(UserPresenceDAO);
        });
    });

    describe('getByConnectionId()', () => {
        it('returns the presence record for the connection ID', async () => {
            await adapter.put('userPresence', makePresence({ userId: 'u1', connectionId: 'conn-1' }));
            await adapter.put('userPresence', makePresence({ userId: 'u2', connectionId: 'conn-2' }));

            const result = await dao.getByConnectionId('conn-2');

            expect(result).not.toBeNull();
            expect(result!.userId).toBe('u2');
        });

        it('returns null when no presence matches the connection ID', async () => {
            await adapter.put('userPresence', makePresence({ userId: 'u1', connectionId: 'conn-1' }));

            const result = await dao.getByConnectionId('missing');

            expect(result).toBeNull();
        });
    });

    describe('BaseDAO CRUD operations (inherited)', () => {
        it('get() retrieves a presence by user ID', async () => {
            const presence = makePresence({ userId: 'u1', connectionId: 'conn-1' });
            await adapter.put('userPresence', presence);

            const retrieved = await dao.get('u1');

            expect(retrieved).toEqual(presence);
        });

        it('get() returns null when presence does not exist', async () => {
            const retrieved = await dao.get('missing');

            expect(retrieved).toBeNull();
        });

        it('save() persists a presence to the store', async () => {
            const presence = makePresence({ userId: 'u2', connectionId: 'conn-2' });

            await dao.save(presence);

            const retrieved = await adapter.get('userPresence', 'u2');
            expect(retrieved).toEqual(presence);
        });

        it('list() returns all presence records', async () => {
            await adapter.put('userPresence', makePresence({ userId: 'u1' }));
            await adapter.put('userPresence', makePresence({ userId: 'u2' }));

            const all = await dao.list();

            expect(all).toHaveLength(2);
        });

        it('delete() removes a presence by user ID', async () => {
            const presence = makePresence({ userId: 'u1' });
            await adapter.put('userPresence', presence);

            await dao.delete('u1');

            const retrieved = await adapter.get('userPresence', 'u1');
            expect(retrieved).toBeNull();
        });

        it('deleteAll() removes all presence records from the store', async () => {
            await adapter.put('userPresence', makePresence({ userId: 'u1' }));
            await adapter.put('userPresence', makePresence({ userId: 'u2' }));

            await dao.deleteAll();

            const all = await dao.list();
            expect(all).toEqual([]);
        });

        it('count() returns the total number of presence records', async () => {
            await adapter.put('userPresence', makePresence({ userId: 'u1' }));
            await adapter.put('userPresence', makePresence({ userId: 'u2' }));

            const count = await dao.count();

            expect(count).toBe(2);
        });

        it('saveMany() persists multiple presence records at once', async () => {
            const presences = [
                makePresence({ userId: 'u1' }),
                makePresence({ userId: 'u2' }),
                makePresence({ userId: 'u3' }),
            ];

            await dao.saveMany(presences);

            const all = await dao.list();
            expect(all).toHaveLength(3);
        });
    });

    describe('Edge cases', () => {
        it('getByConnectionId() returns null when store is empty', async () => {
            const result = await dao.getByConnectionId('conn-1');

            expect(result).toBeNull();
        });
    });

    describe('Error handling', () => {
        it('getByConnectionId() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'getByField').mockRejectedValueOnce(error);

            await expect(dao.getByConnectionId('conn-1')).rejects.toThrow('Adapter failure');
        });
    });
});
