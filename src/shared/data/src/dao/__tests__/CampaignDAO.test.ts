import { beforeEach, describe, it, expect, vi } from 'vitest';
import { CampaignDAO } from '@data/dao/CampaignDAO.js';
import { MockDatabaseAdapter } from '@wh40k10e/__mocks__/MockDatabaseAdapter.js';
import type { Campaign } from '@models/CampaignModel.js';

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
    return {
        id: 'campaign-1',
        name: 'Test Campaign',
        type: 'type-1',
        organizerId: 'user-1',
        narrative: { schemaVersion: 1, narrative: '' },
        startDate: '2025-01-01T00:00:00Z',
        endDate: null,
        status: 'upcoming',
        phases: [],
        customRules: [],
        rankings: [],
        participantIds: [],
        matchIds: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('CampaignDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: CampaignDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new CampaignDAO(adapter);
    });

    describe('constructor', () => {
        it('creates a CampaignDAO instance', () => {
            expect(dao).toBeInstanceOf(CampaignDAO);
        });
    });

    describe('listByType()', () => {
        it('returns only campaigns matching the type', async () => {
            await adapter.put('campaign', makeCampaign({ id: 'c-1', type: 'type-a' }));
            await adapter.put('campaign', makeCampaign({ id: 'c-2', type: 'type-b' }));
            await adapter.put('campaign', makeCampaign({ id: 'c-3', type: 'type-a' }));

            const results = await dao.listByType('type-a');

            expect(results).toHaveLength(2);
            expect(results.map((item: Campaign) => item.id).sort()).toEqual(['c-1', 'c-3']);
        });

        it('returns empty array when no campaigns match', async () => {
            await adapter.put('campaign', makeCampaign({ id: 'c-1', type: 'type-a' }));

            const results = await dao.listByType('type-b');

            expect(results).toEqual([]);
        });
    });

    describe('BaseDAO CRUD operations (inherited)', () => {
        it('get() retrieves a campaign by ID', async () => {
            const campaign = makeCampaign({ id: 'c-1' });
            await adapter.put('campaign', campaign);

            const retrieved = await dao.get('c-1');

            expect(retrieved).toEqual(campaign);
        });

        it('get() returns null when campaign does not exist', async () => {
            const retrieved = await dao.get('missing');

            expect(retrieved).toBeNull();
        });

        it('save() persists a campaign to the store', async () => {
            const campaign = makeCampaign({ id: 'c-2' });

            await dao.save(campaign);

            const retrieved = await adapter.get('campaign', 'c-2');
            expect(retrieved).toEqual(campaign);
        });

        it('list() returns all campaigns', async () => {
            await adapter.put('campaign', makeCampaign({ id: 'c-1' }));
            await adapter.put('campaign', makeCampaign({ id: 'c-2' }));

            const all = await dao.list();

            expect(all).toHaveLength(2);
        });

        it('delete() removes a campaign by ID', async () => {
            const campaign = makeCampaign({ id: 'c-1' });
            await adapter.put('campaign', campaign);

            await dao.delete('c-1');

            const retrieved = await adapter.get('campaign', 'c-1');
            expect(retrieved).toBeNull();
        });

        it('deleteAll() removes all campaigns from the store', async () => {
            await adapter.put('campaign', makeCampaign({ id: 'c-1' }));
            await adapter.put('campaign', makeCampaign({ id: 'c-2' }));

            await dao.deleteAll();

            const all = await dao.list();
            expect(all).toEqual([]);
        });

        it('count() returns the total number of campaigns', async () => {
            await adapter.put('campaign', makeCampaign({ id: 'c-1' }));
            await adapter.put('campaign', makeCampaign({ id: 'c-2' }));

            const count = await dao.count();

            expect(count).toBe(2);
        });

        it('saveMany() persists multiple campaigns at once', async () => {
            const campaigns = [makeCampaign({ id: 'c-1' }), makeCampaign({ id: 'c-2' }), makeCampaign({ id: 'c-3' })];

            await dao.saveMany(campaigns);

            const all = await dao.list();
            expect(all).toHaveLength(3);
        });
    });

    describe('Edge cases', () => {
        it('listByType() returns empty array when store is empty', async () => {
            const results = await dao.listByType('type-a');

            expect(results).toEqual([]);
        });
    });

    describe('Error handling', () => {
        it('listByType() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'getByField').mockRejectedValueOnce(error);

            await expect(dao.listByType('type-a')).rejects.toThrow('Adapter failure');
        });
    });
});
