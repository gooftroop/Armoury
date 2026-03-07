import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DSQLAdapter } from '@armoury/adapters-dsql';
import {
    getDSQLTestConfig,
    setupDSQLTestDatabase,
    truncateDSQLTestDatabase,
} from '../helpers/dsqlTestDb.ts';
import {
    makeAccount,
    makeCampaignParticipant,
    makeCoreCampaign,
    makeCoreMatch,
    makeFriend,
    makeUserPresence,
} from '../__fixtures__/index.ts';
import { DatabaseError } from '@data/types.js';

describe('DSQLAdapter E2E', () => {
    let adapter: DSQLAdapter;

    beforeAll(async () => {
        await setupDSQLTestDatabase();
    });

    beforeEach(async () => {
        await truncateDSQLTestDatabase();
        adapter = new DSQLAdapter(getDSQLTestConfig());
        await adapter.initialize();
    });

    afterEach(async () => {
        await adapter.close();
    });

    afterAll(async () => {
        await truncateDSQLTestDatabase();
    });

    describe('account CRUD', () => {
        it('puts and gets an account', async () => {
            const account = makeAccount();
            await adapter.put('account', account);

            const result = await adapter.get('account', account.id);
            expect(result).not.toBeNull();
            expect(result!.id).toBe(account.id);
            expect(result!.displayName).toBe(account.displayName);
        });

        it('returns null for non-existent account', async () => {
            const result = await adapter.get('account', 'non-existent');
            expect(result).toBeNull();
        });

        it('gets all accounts', async () => {
            await adapter.put('account', makeAccount({ id: 'user-1' }));
            await adapter.put('account', makeAccount({ id: 'user-2' }));

            const results = await adapter.getAll('account');
            expect(results).toHaveLength(2);
        });

        it('upserts on conflict', async () => {
            const account = makeAccount();
            await adapter.put('account', account);
            await adapter.put('account', { ...account, displayName: 'Updated Name' });

            const result = await adapter.get('account', account.id);
            expect(result!.displayName).toBe('Updated Name');
        });

        it('deletes an account', async () => {
            const account = makeAccount();
            await adapter.put('account', account);
            await adapter.delete('account', account.id);

            const result = await adapter.get('account', account.id);
            expect(result).toBeNull();
        });

        it('counts accounts', async () => {
            await adapter.put('account', makeAccount({ id: 'a' }));
            await adapter.put('account', makeAccount({ id: 'b' }));

            const total = await adapter.count('account');
            expect(total).toBe(2);
        });
    });

    describe('friend CRUD', () => {
        it('puts and gets a friend', async () => {
            const friend = makeFriend();
            await adapter.put('friend', friend);

            const result = await adapter.get('friend', friend.id);
            expect(result).not.toBeNull();
            expect(result!.requesterId).toBe(friend.requesterId);
        });

        it('gets friends by field', async () => {
            const friend = makeFriend();
            await adapter.put('friend', friend);

            const results = await adapter.getByField('friend', 'requesterId', friend.requesterId);
            expect(results).toHaveLength(1);
        });

        it('deletes a friend', async () => {
            const friend = makeFriend();
            await adapter.put('friend', friend);
            await adapter.delete('friend', friend.id);

            const result = await adapter.get('friend', friend.id);
            expect(result).toBeNull();
        });
    });

    describe('match CRUD', () => {
        it('puts and gets a match', async () => {
            const match = makeCoreMatch();
            await adapter.put('match', match);

            const result = await adapter.get('match', match.id);
            expect(result).not.toBeNull();
            expect(result!.id).toBe(match.id);
        });

        it('gets matches by systemId', async () => {
            const match = makeCoreMatch();
            await adapter.put('match', match);

            const results = await adapter.getByField('match', 'systemId', match.systemId);
            expect(results).toHaveLength(1);
        });
    });

    describe('campaign CRUD', () => {
        it('puts and gets a campaign', async () => {
            const campaign = makeCoreCampaign();
            await adapter.put('campaign', campaign);

            const result = await adapter.get('campaign', campaign.id);
            expect(result).not.toBeNull();
            expect(result!.name).toBe(campaign.name);
        });

        it('puts and gets a campaign participant', async () => {
            const campaign = makeCoreCampaign();
            await adapter.put('campaign', campaign);

            const participant = makeCampaignParticipant({ campaignId: campaign.id });
            await adapter.put('campaignParticipant', participant);

            const result = await adapter.get('campaignParticipant', participant.id);
            expect(result).not.toBeNull();
            expect(result!.campaignId).toBe(campaign.id);
        });
    });

    describe('userPresence CRUD', () => {
        it('puts and gets user presence', async () => {
            const presence = makeUserPresence();
            await adapter.put('userPresence', presence);

            const result = await adapter.get('userPresence', presence.userId);
            expect(result).not.toBeNull();
            expect(result!.status).toBe(presence.status);
        });
    });

    describe('transaction', () => {
        it('rolls back on error', async () => {
            const account = makeAccount();

            await expect(
                adapter.transaction(async () => {
                    await adapter.put('account', account);
                    throw new Error('Rollback test');
                }),
            ).rejects.toThrow('Rollback test');

            const result = await adapter.get('account', account.id);
            expect(result).toBeNull();
        });
    });

    describe('query options', () => {
        it('getAll with limit', async () => {
            await adapter.put('account', makeAccount({ id: 'a' }));
            await adapter.put('account', makeAccount({ id: 'b' }));
            await adapter.put('account', makeAccount({ id: 'c' }));

            const results = await adapter.getAll('account', { limit: 2 });
            expect(results).toHaveLength(2);
        });

        it('getAll with limit and offset', async () => {
            await adapter.put('account', makeAccount({ id: 'a' }));
            await adapter.put('account', makeAccount({ id: 'b' }));
            await adapter.put('account', makeAccount({ id: 'c' }));

            const results = await adapter.getAll('account', { limit: 2, offset: 1 });
            expect(results).toHaveLength(2);
        });
    });

    describe('deleteAll', () => {
        it('removes all entities from a store', async () => {
            await adapter.put('account', makeAccount({ id: 'a' }));
            await adapter.put('account', makeAccount({ id: 'b' }));

            await adapter.deleteAll('account');

            const results = await adapter.getAll('account');
            expect(results).toHaveLength(0);
        });
    });

    describe('deleteByField', () => {
        it('removes entities matching a field value', async () => {
            const friend1 = makeFriend({ id: 'f1', requesterId: 'user-x' });
            const friend2 = makeFriend({ id: 'f2', requesterId: 'user-x' });
            const friend3 = makeFriend({ id: 'f3', requesterId: 'user-y' });

            await adapter.put('friend', friend1);
            await adapter.put('friend', friend2);
            await adapter.put('friend', friend3);

            await adapter.deleteByField('friend', 'requesterId', 'user-x');

            const remaining = await adapter.getAll('friend');
            expect(remaining).toHaveLength(1);
            expect(remaining[0]!.id).toBe('f3');
        });
    });

    describe('syncStatus', () => {
        it('sets and gets sync status', async () => {
            await adapter.setSyncStatus('file-key-1', 'abc123', 'etag-1');

            const status = await adapter.getSyncStatus('file-key-1');
            expect(status).not.toBeNull();
            expect(status!.sha).toBe('abc123');
            expect(status!.etag).toBe('etag-1');
        });

        it('returns null for unknown file key', async () => {
            const status = await adapter.getSyncStatus('unknown');
            expect(status).toBeNull();
        });

        it('deletes sync status', async () => {
            await adapter.setSyncStatus('file-key-2', 'def456');
            await adapter.deleteSyncStatus('file-key-2');

            const status = await adapter.getSyncStatus('file-key-2');
            expect(status).toBeNull();
        });
    });

    describe('error handling', () => {
        it('throws DatabaseError for unknown store', async () => {
            await expect(adapter.get('nonExistentStore' as never, 'id')).rejects.toThrow(DatabaseError);
        });
    });
});
