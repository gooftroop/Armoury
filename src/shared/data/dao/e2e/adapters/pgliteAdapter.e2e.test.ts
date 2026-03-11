import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PGliteAdapter } from '@armoury/adapters-pglite';
import {
    makeAccount,
    makeCampaignParticipant,
    makeCoreCampaign,
    makeCoreMatch,
    makeFriend,
} from '../__fixtures__/index.ts';
import { DatabaseError } from '@armoury/data-dao/types';

describe('PGliteAdapter E2E', () => {
    let adapter: PGliteAdapter;

    beforeEach(async () => {
        adapter = new PGliteAdapter();
        await adapter.initialize();
    });

    afterEach(async () => {
        await adapter.close();
    });

    describe('account CRUD', () => {
        it('should put and get an account', async () => {
            const account = makeAccount();
            await adapter.put('account', account);

            const result = await adapter.get('account', account.id);
            expect(result).not.toBeNull();
            expect(result!.id).toBe(account.id);
            expect(result!.displayName).toBe(account.displayName);
        });

        it('should return null for non-existent account', async () => {
            const result = await adapter.get('account', 'non-existent');
            expect(result).toBeNull();
        });

        it('should getAll accounts', async () => {
            await adapter.put('account', makeAccount({ id: 'user-1' }));
            await adapter.put('account', makeAccount({ id: 'user-2' }));

            const results = await adapter.getAll('account');
            expect(results).toHaveLength(2);
        });

        it('should getAll with limit and offset', async () => {
            await adapter.put('account', makeAccount({ id: 'a' }));
            await adapter.put('account', makeAccount({ id: 'b' }));
            await adapter.put('account', makeAccount({ id: 'c' }));

            const results = await adapter.getAll('account', { limit: 2, offset: 1 });
            expect(results).toHaveLength(2);
        });

        it('should upsert on conflict', async () => {
            const account = makeAccount();
            await adapter.put('account', account);
            await adapter.put('account', { ...account, displayName: 'Updated Name' });

            const result = await adapter.get('account', account.id);
            expect(result!.displayName).toBe('Updated Name');
        });

        it('should delete an account', async () => {
            const account = makeAccount();
            await adapter.put('account', account);
            await adapter.delete('account', account.id);

            const result = await adapter.get('account', account.id);
            expect(result).toBeNull();
        });

        it('should deleteAll accounts', async () => {
            await adapter.put('account', makeAccount({ id: 'user-1' }));
            await adapter.put('account', makeAccount({ id: 'user-2' }));
            await adapter.deleteAll('account');

            const results = await adapter.getAll('account');
            expect(results).toHaveLength(0);
        });

        it('should count accounts', async () => {
            await adapter.put('account', makeAccount({ id: 'user-1' }));
            await adapter.put('account', makeAccount({ id: 'user-2' }));

            const count = await adapter.count('account');
            expect(count).toBe(2);
        });

        it('should handle JSONB fields (preferences)', async () => {
            const account = makeAccount({
                preferences: { theme: 'dark', language: 'en', notificationsEnabled: true },
            });
            await adapter.put('account', account);

            const result = await adapter.get('account', account.id);
            expect(result!.preferences).toEqual(account.preferences);
        });
    });

    describe('friend CRUD', () => {
        it('should put and get a friend', async () => {
            const friend = makeFriend();
            await adapter.put('friend', friend);

            const result = await adapter.get('friend', friend.id);
            expect(result).not.toBeNull();
            expect(result!.requesterId).toBe(friend.requesterId);
            expect(result!.canShareArmyLists).toBe(true);
        });

        it('should getByField for friend status', async () => {
            await adapter.put('friend', makeFriend({ id: 'f1', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f2', status: 'pending' }));
            await adapter.put('friend', makeFriend({ id: 'f3', status: 'accepted' }));

            const accepted = await adapter.getByField('friend', 'status', 'accepted');
            expect(accepted).toHaveLength(2);
        });

        it('should deleteByField', async () => {
            await adapter.put('friend', makeFriend({ id: 'f1', status: 'blocked' }));
            await adapter.put('friend', makeFriend({ id: 'f2', status: 'accepted' }));
            await adapter.deleteByField('friend', 'status', 'blocked');

            const all = await adapter.getAll('friend');
            expect(all).toHaveLength(1);
            expect(all[0]!.id).toBe('f2');
        });
    });

    describe('match CRUD', () => {
        it('should put and get a match with JSONB matchData', async () => {
            const match = makeCoreMatch();
            await adapter.put('match', match);

            const result = await adapter.get('match', match.id);
            expect(result).not.toBeNull();
            expect(result!.systemId).toBe('wh40k10e');
            expect(result!.players).toEqual([
                { playerId: 'auth0|user-1', campaignParticipantId: null },
                { playerId: 'auth0|user-2', campaignParticipantId: null },
            ]);
            expect(result!.matchData).toEqual(match.matchData);
        });

        it('should handle null matchData', async () => {
            const match = makeCoreMatch({ matchData: null });
            await adapter.put('match', match);

            const result = await adapter.get('match', match.id);
            expect(result!.matchData).toBeNull();
        });
    });

    describe('campaign CRUD', () => {
        it('should put and get a campaign', async () => {
            const campaign = makeCoreCampaign();
            await adapter.put('campaign', campaign);

            const result = await adapter.get('campaign', campaign.id);
            expect(result).not.toBeNull();
            expect(result!.name).toBe('Test Campaign');
            expect(result!.type).toBe('custom');
        });

        it('should put and get campaign participants', async () => {
            const participant = makeCampaignParticipant();
            await adapter.put('campaignParticipant', participant);

            const result = await adapter.get('campaignParticipant', participant.id);
            expect(result).not.toBeNull();
            expect(result!.campaignId).toBe('campaign-1');
            expect(result!.userId).toBe('auth0|user-1');
        });
    });

    describe('putMany', () => {
        it('should insert multiple entities atomically', async () => {
            const accounts = [
                makeAccount({ id: 'user-1' }),
                makeAccount({ id: 'user-2' }),
                makeAccount({ id: 'user-3' }),
            ];
            await adapter.putMany('account', accounts);

            const count = await adapter.count('account');
            expect(count).toBe(3);
        });
    });

    describe('transactions', () => {
        it('should commit on success', async () => {
            await adapter.transaction(async () => {
                await adapter.put('account', makeAccount({ id: 'tx-1' }));
                await adapter.put('account', makeAccount({ id: 'tx-2' }));
            });

            const count = await adapter.count('account');
            expect(count).toBe(2);
        });

        it('should rollback on error', async () => {
            await adapter.put('account', makeAccount({ id: 'existing' }));

            try {
                await adapter.transaction(async () => {
                    await adapter.put('account', makeAccount({ id: 'new-in-tx' }));
                    throw new Error('Intentional failure');
                });
            } catch {
                /* intentional — verifying rollback */
            }

            const count = await adapter.count('account');
            expect(count).toBe(1);
            const newAccount = await adapter.get('account', 'new-in-tx');
            expect(newAccount).toBeNull();
        });

        it('should return value from transaction', async () => {
            const result = await adapter.transaction(async () => {
                await adapter.put('account', makeAccount({ id: 'tx-return' }));

                return 'success';
            });

            expect(result).toBe('success');
        });
    });

    describe('sync status', () => {
        it('should set and get sync status', async () => {
            await adapter.setSyncStatus('core:wh40k-10e.gst', 'abc123', 'etag-1');

            const status = await adapter.getSyncStatus('core:wh40k-10e.gst');
            expect(status).not.toBeNull();
            expect(status!.fileKey).toBe('core:wh40k-10e.gst');
            expect(status!.sha).toBe('abc123');
            expect(status!.etag).toBe('etag-1');
        });

        it('should return null for non-existent sync status', async () => {
            const status = await adapter.getSyncStatus('non-existent');
            expect(status).toBeNull();
        });

        it('should upsert sync status', async () => {
            await adapter.setSyncStatus('file-1', 'sha-1');
            await adapter.setSyncStatus('file-1', 'sha-2', 'etag-updated');

            const status = await adapter.getSyncStatus('file-1');
            expect(status!.sha).toBe('sha-2');
            expect(status!.etag).toBe('etag-updated');
        });

        it('should delete sync status', async () => {
            await adapter.setSyncStatus('file-1', 'sha-1');
            await adapter.deleteSyncStatus('file-1');

            const status = await adapter.getSyncStatus('file-1');
            expect(status).toBeNull();
        });
    });

    describe('query options', () => {
        it('should support orderBy ascending', async () => {
            await adapter.put('account', makeAccount({ id: 'b-user', displayName: 'Bravo' }));
            await adapter.put('account', makeAccount({ id: 'a-user', displayName: 'Alpha' }));
            await adapter.put('account', makeAccount({ id: 'c-user', displayName: 'Charlie' }));

            const results = await adapter.getAll('account', { orderBy: 'displayName', direction: 'asc' });
            expect(results[0]!.displayName).toBe('Alpha');
            expect(results[2]!.displayName).toBe('Charlie');
        });

        it('should support orderBy descending', async () => {
            await adapter.put('account', makeAccount({ id: 'b-user', displayName: 'Bravo' }));
            await adapter.put('account', makeAccount({ id: 'a-user', displayName: 'Alpha' }));

            const results = await adapter.getAll('account', { orderBy: 'displayName', direction: 'desc' });
            expect(results[0]!.displayName).toBe('Bravo');
            expect(results[1]!.displayName).toBe('Alpha');
        });

        it('should support count with field filter', async () => {
            await adapter.put('friend', makeFriend({ id: 'f1', status: 'accepted' }));
            await adapter.put('friend', makeFriend({ id: 'f2', status: 'pending' }));
            await adapter.put('friend', makeFriend({ id: 'f3', status: 'accepted' }));

            const count = await adapter.count('friend', 'status', 'accepted');
            expect(count).toBe(2);
        });
    });

    describe('error handling', () => {
        it('should throw DatabaseError for operations on uninitialized adapter', async () => {
            const uninitAdapter = new PGliteAdapter();
            await expect(uninitAdapter.get('account', '1')).rejects.toThrow(DatabaseError);
        });
    });
});
