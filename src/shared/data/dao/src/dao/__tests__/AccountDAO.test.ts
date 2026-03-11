import { beforeEach, describe, it, expect, vi } from 'vitest';
import { AccountDAO } from '@/dao/AccountDAO.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import type { Account } from '@armoury/models/AccountModel';

function makeAccount(overrides: Partial<Account> = {}): Account {
    return {
        id: 'a1b2c3d4-0001-0000-0000-000000000001',
        userId: 'user-123',
        preferences: {
            theme: 'dark',
            language: 'en',
            notificationsEnabled: true,
        },
        systems: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('AccountDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: AccountDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new AccountDAO(adapter);
    });

    describe('constructor', () => {
        it('creates an AccountDAO instance', () => {
            expect(dao).toBeInstanceOf(AccountDAO);
        });
    });

    describe('BaseDAO CRUD operations (inherited)', () => {
        it('get() retrieves an account by ID', async () => {
            const account = makeAccount({ id: 'a1b2c3d4-0002-0000-0000-000000000002' });
            await adapter.put('account', account);

            const retrieved = await dao.get('a1b2c3d4-0002-0000-0000-000000000002');

            expect(retrieved).toEqual(account);
        });

        it('get() returns null when account does not exist', async () => {
            const retrieved = await dao.get('missing');

            expect(retrieved).toBeNull();
        });

        it('save() persists an account to the store', async () => {
            const account = makeAccount({ id: 'a1b2c3d4-0003-0000-0000-000000000003' });

            await dao.save(account);

            const retrieved = await adapter.get('account', 'a1b2c3d4-0003-0000-0000-000000000003');
            expect(retrieved).toEqual(account);
        });

        it('list() returns all accounts', async () => {
            await adapter.put('account', makeAccount({ id: 'a1b2c3d4-0001-0000-0000-000000000001' }));
            await adapter.put('account', makeAccount({ id: 'a1b2c3d4-0002-0000-0000-000000000002' }));

            const all = await dao.list();

            expect(all).toHaveLength(2);
        });

        it('delete() removes an account by ID', async () => {
            const account = makeAccount({ id: 'a1b2c3d4-0001-0000-0000-000000000001' });
            await adapter.put('account', account);

            await dao.delete('a1b2c3d4-0001-0000-0000-000000000001');

            const retrieved = await adapter.get('account', 'a1b2c3d4-0001-0000-0000-000000000001');
            expect(retrieved).toBeNull();
        });

        it('deleteAll() removes all accounts from the store', async () => {
            await adapter.put('account', makeAccount({ id: 'a1b2c3d4-0001-0000-0000-000000000001' }));
            await adapter.put('account', makeAccount({ id: 'a1b2c3d4-0002-0000-0000-000000000002' }));

            await dao.deleteAll();

            const all = await dao.list();
            expect(all).toEqual([]);
        });

        it('count() returns the total number of accounts', async () => {
            await adapter.put('account', makeAccount({ id: 'a1b2c3d4-0001-0000-0000-000000000001' }));
            await adapter.put('account', makeAccount({ id: 'a1b2c3d4-0002-0000-0000-000000000002' }));

            const count = await dao.count();

            expect(count).toBe(2);
        });

        it('saveMany() persists multiple accounts at once', async () => {
            const accounts = [
                makeAccount({ id: 'a1b2c3d4-0001-0000-0000-000000000001' }),
                makeAccount({ id: 'a1b2c3d4-0002-0000-0000-000000000002' }),
                makeAccount({ id: 'a1b2c3d4-0003-0000-0000-000000000003' }),
            ];

            await dao.saveMany(accounts);

            const all = await dao.list();
            expect(all).toHaveLength(3);
        });
    });

    describe('Edge cases', () => {
        it('list() returns empty array when store is empty', async () => {
            const all = await dao.list();

            expect(all).toEqual([]);
        });

        it('delete() resolves when account does not exist', async () => {
            await expect(dao.delete('missing')).resolves.toBeUndefined();
        });
    });

    describe('Error handling', () => {
        it('get() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'get').mockRejectedValueOnce(error);

            await expect(dao.get('a1b2c3d4-0001-0000-0000-000000000001')).rejects.toThrow('Adapter failure');
        });
    });

    describe('findByUserId()', () => {
        it('returns the account matching the userId', async () => {
            const account = makeAccount({ id: 'a1b2c3d4-0001-0000-0000-000000000001', userId: 'user-123' });
            await adapter.put('account', account);

            const found = await dao.findByUserId('user-123');

            expect(found).toEqual(account);
        });

        it('returns null when no account matches the userId', async () => {
            await adapter.put(
                'account',
                makeAccount({ id: 'a1b2c3d4-0001-0000-0000-000000000001', userId: 'user-123' }),
            );

            const found = await dao.findByUserId('user-999');

            expect(found).toBeNull();
        });

        it('returns null when store is empty', async () => {
            const found = await dao.findByUserId('user-123');

            expect(found).toBeNull();
        });
    });
});
