import { beforeEach, describe, it, expect, vi } from 'vitest';
import { CampaignParticipantDAO } from '@data/dao/CampaignParticipantDAO.js';
import { MockDatabaseAdapter } from '@wh40k10e/__mocks__/MockDatabaseAdapter.js';
import type { CampaignParticipant } from '@models/CampaignModel.js';

function makeParticipant(overrides: Partial<CampaignParticipant> = {}): CampaignParticipant {
    return {
        id: 'campaign-1:user-1',
        campaignId: 'campaign-1',
        userId: 'user-1',
        displayName: 'Test User',
        isOrganizer: false,
        armyId: 'army-1',
        armyName: 'Test Army',
        currentPhaseId: 'phase-1',
        matchesInCurrentPhase: 0,
        participantData: null,
        matchIds: [],
        joinedAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('CampaignParticipantDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: CampaignParticipantDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new CampaignParticipantDAO(adapter);
    });

    describe('constructor', () => {
        it('creates a CampaignParticipantDAO instance', () => {
            expect(dao).toBeInstanceOf(CampaignParticipantDAO);
        });
    });

    describe('listByCampaign()', () => {
        it('returns only participants for the specified campaign', async () => {
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u1', campaignId: 'c1', userId: 'u1' }));
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u2', campaignId: 'c1', userId: 'u2' }));
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c2:u3', campaignId: 'c2', userId: 'u3' }));

            const results = await dao.listByCampaign('c1');

            expect(results).toHaveLength(2);
            expect(results.map((item: CampaignParticipant) => item.id).sort()).toEqual(['c1:u1', 'c1:u2']);
        });

        it('returns empty array when no participants match', async () => {
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u1', campaignId: 'c1' }));

            const results = await dao.listByCampaign('c2');

            expect(results).toEqual([]);
        });
    });

    describe('listByUser()', () => {
        it('returns only participants for the specified user', async () => {
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u1', campaignId: 'c1', userId: 'u1' }));
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c2:u1', campaignId: 'c2', userId: 'u1' }));
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c3:u2', campaignId: 'c3', userId: 'u2' }));

            const results = await dao.listByUser('u1');

            expect(results).toHaveLength(2);
            expect(results.map((item: CampaignParticipant) => item.id).sort()).toEqual(['c1:u1', 'c2:u1']);
        });

        it('returns empty array when no participants match', async () => {
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u1', userId: 'u1' }));

            const results = await dao.listByUser('u2');

            expect(results).toEqual([]);
        });
    });

    describe('BaseDAO CRUD operations (inherited)', () => {
        it('get() retrieves a participant by ID', async () => {
            const participant = makeParticipant({ id: 'c1:u1' });
            await adapter.put('campaignParticipant', participant);

            const retrieved = await dao.get('c1:u1');

            expect(retrieved).toEqual(participant);
        });

        it('get() returns null when participant does not exist', async () => {
            const retrieved = await dao.get('missing');

            expect(retrieved).toBeNull();
        });

        it('save() persists a participant to the store', async () => {
            const participant = makeParticipant({ id: 'c1:u2' });

            await dao.save(participant);

            const retrieved = await adapter.get('campaignParticipant', 'c1:u2');
            expect(retrieved).toEqual(participant);
        });

        it('list() returns all participants', async () => {
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u1' }));
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u2' }));

            const all = await dao.list();

            expect(all).toHaveLength(2);
        });

        it('delete() removes a participant by ID', async () => {
            const participant = makeParticipant({ id: 'c1:u1' });
            await adapter.put('campaignParticipant', participant);

            await dao.delete('c1:u1');

            const retrieved = await adapter.get('campaignParticipant', 'c1:u1');
            expect(retrieved).toBeNull();
        });

        it('deleteAll() removes all participants from the store', async () => {
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u1' }));
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u2' }));

            await dao.deleteAll();

            const all = await dao.list();
            expect(all).toEqual([]);
        });

        it('count() returns the total number of participants', async () => {
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u1' }));
            await adapter.put('campaignParticipant', makeParticipant({ id: 'c1:u2' }));

            const count = await dao.count();

            expect(count).toBe(2);
        });

        it('saveMany() persists multiple participants at once', async () => {
            const participants = [
                makeParticipant({ id: 'c1:u1' }),
                makeParticipant({ id: 'c1:u2' }),
                makeParticipant({ id: 'c2:u3' }),
            ];

            await dao.saveMany(participants);

            const all = await dao.list();
            expect(all).toHaveLength(3);
        });
    });

    describe('Edge cases', () => {
        it('listByCampaign() returns empty array when store is empty', async () => {
            const results = await dao.listByCampaign('c1');

            expect(results).toEqual([]);
        });

        it('listByUser() returns empty array when store is empty', async () => {
            const results = await dao.listByUser('u1');

            expect(results).toEqual([]);
        });
    });

    describe('Error handling', () => {
        it('listByCampaign() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'getByField').mockRejectedValueOnce(error);

            await expect(dao.listByCampaign('c1')).rejects.toThrow('Adapter failure');
        });

        it('listByUser() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'getByField').mockRejectedValueOnce(error);

            await expect(dao.listByUser('u1')).rejects.toThrow('Adapter failure');
        });
    });
});
