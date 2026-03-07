import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignDAO } from '@data/dao/CampaignDAO.js';
import { MockDatabaseAdapter } from '@wh40k10e/__mocks__/MockDatabaseAdapter.js';
import { makeCampaign } from '../../../e2e/__fixtures__/makeCampaign.ts';
import type { CampaignPhase, CampaignRanking, Campaign } from '@models/CampaignModel.js';

function makeCampaignPhase(overrides: Partial<CampaignPhase> = {}): CampaignPhase {
    return {
        id: 'phase-1',
        name: 'Incursion',
        order: 1,
        pointsLimit: 1000,
        matchesRequired: 2,
        notes: 'Phase notes',
        narrative: { schemaVersion: 1, narrative: 'Phase narrative' },
        customRules: ['Rule 1'],
        startDate: '2025-06-01T00:00:00Z',
        endDate: null,
        ...overrides,
    };
}

function makeCampaignRanking(overrides: Partial<CampaignRanking> = {}): CampaignRanking {
    return {
        participantId: 'participant-1',
        userId: 'auth0|user-1',
        displayName: 'Player One',
        rank: 1,
        wins: 2,
        losses: 1,
        draws: 0,
        totalVP: 42,
        ...overrides,
    };
}

function makeCampaignFixture(overrides: Partial<Campaign> = {}): Campaign {
    return makeCampaign({
        organizerId: 'auth0|organizer-1',
        narrative: {
            schemaVersion: 1,
            narrative: 'Test narrative',
        },
        status: 'active',
        customRules: ['Rule A'],
        matchIds: ['match-1'],
        type: 'wh40k10e-crusade',
        phases: [makeCampaignPhase()],
        rankings: [makeCampaignRanking()],
        participantIds: ['participant-1'],
        ...overrides,
    });
}

describe('CampaignDAO integration tests', () => {
    let adapter: MockDatabaseAdapter;
    let dao: CampaignDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new CampaignDAO(adapter);
    });

    it('should save and get a campaign', async () => {
        const campaign = makeCampaignFixture({ name: 'Crusade Alpha' });
        await dao.save(campaign);

        const result = await dao.get(campaign.id);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(campaign.id);
        expect(result!.name).toBe('Crusade Alpha');
    });

    it('should list all campaigns', async () => {
        await dao.save(makeCampaignFixture({ id: 'campaign-1' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-2' }));

        const results = await dao.list();
        expect(results).toHaveLength(2);
    });

    it('should count campaigns', async () => {
        await dao.save(makeCampaignFixture({ id: 'campaign-1' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-2' }));

        const count = await dao.count();
        expect(count).toBe(2);
    });

    it('should delete a campaign', async () => {
        await dao.save(makeCampaignFixture({ id: 'campaign-delete' }));
        await dao.delete('campaign-delete');

        const result = await dao.get('campaign-delete');
        expect(result).toBeNull();
    });

    it('should delete all campaigns', async () => {
        await dao.save(makeCampaignFixture({ id: 'campaign-1' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-2' }));
        await dao.deleteAll();

        const count = await dao.count();
        expect(count).toBe(0);
    });

    it('should list campaigns by organizer', async () => {
        await dao.save(makeCampaignFixture({ id: 'campaign-1', organizerId: 'auth0|organizer-1' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-2', organizerId: 'auth0|organizer-2' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-3', organizerId: 'auth0|organizer-1' }));

        const results = await dao.listByOrganizer('auth0|organizer-1');
        expect(results).toHaveLength(2);
    });

    it('should list campaigns by status', async () => {
        await dao.save(makeCampaignFixture({ id: 'campaign-1', status: 'active' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-2', status: 'completed' }));

        const results = await dao.listByStatus('active');
        expect(results).toHaveLength(1);
    });

    it('should list campaigns by crusade rules', async () => {
        await dao.save(makeCampaignFixture({ id: 'campaign-1', type: 'core' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-2', type: 'armageddon' }));
        await dao.save(makeCampaignFixture({ id: 'campaign-3', type: 'core' }));

        const results = await dao.listByType('core');
        expect(results).toHaveLength(2);
    });

    it('should preserve JSONB fields through round-trip', async () => {
        const campaign = makeCampaignFixture({
            phases: [
                makeCampaignPhase({
                    id: 'phase-2',
                    customRules: ['Rule A', 'Rule B'],
                }),
            ],
            rankings: [
                makeCampaignRanking({
                    participantId: 'participant-2',
                    totalVP: 55,
                }),
            ],
        });
        await dao.save(campaign);

        const result = await dao.get(campaign.id);
        expect(result!.phases).toEqual(campaign.phases);
        expect(result!.rankings).toEqual(campaign.rankings);
    });

    it('should save many campaigns', async () => {
        await dao.saveMany([makeCampaignFixture({ id: 'campaign-1' }), makeCampaignFixture({ id: 'campaign-2' })]);

        const results = await dao.list();
        expect(results).toHaveLength(2);
    });
});
