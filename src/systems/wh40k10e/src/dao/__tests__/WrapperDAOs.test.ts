import { beforeEach, describe, it, expect } from 'vitest';
import { BSDATA_OWNER, BSDATA_REPO } from '../BaseDAO.ts';
import { ArmyDAO } from '../ArmyDAO.ts';
import { CampaignDAO } from '@armoury/data-dao/dao/CampaignDAO';

import { AccountDAO } from '@armoury/data-dao/dao/AccountDAO';
import { MockDatabaseAdapter } from '../../__mocks__/MockDatabaseAdapter.ts';
import type { Army } from '../../models/ArmyModel.ts';
import type { Campaign } from '@armoury/models/CampaignModel';

import type { Account } from '@armoury/models/AccountModel';

/**
 * Creates a minimal Army fixture for testing.
 */
function makeArmy(overrides: Partial<Army> = {}): Army {
    return {
        id: 'army-1',
        ownerId: 'user-1',
        name: 'Test Army',
        factionId: 'space-marines',
        detachmentId: null,
        warlordUnitId: null,
        battleSize: 'StrikeForce',
        pointsLimit: 2000,
        units: [],
        totalPoints: 0,
        notes: '',
        versions: [],
        currentVersion: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
    return {
        id: 'campaign-1',
        name: 'Test Campaign',
        type: 'wh40k10e-crusade',
        organizerId: 'user-1',
        narrative: {
            schemaVersion: 1,
            narrative: 'Test narrative',
        },
        startDate: '2025-01-01T00:00:00Z',
        endDate: null,
        status: 'active',
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

function makeAccount(overrides: Partial<Account> = {}): Account {
    return {
        id: 'auth0|user-1',
        userId: 'auth0|user-1',
        preferences: {
            theme: 'auto',
            language: 'en',
            notificationsEnabled: true,
        },
        systems: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('BaseDAO', () => {
    it('sets correct BSData owner and repo defaults', () => {
        expect(BSDATA_OWNER).toBe('BSData');
        expect(BSDATA_REPO).toBe('wh40k-10e');
    });
});

describe('ArmyDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: ArmyDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new ArmyDAO(adapter);
    });

    it('saves an army to the database', async () => {
        const army = makeArmy({ id: 'army-1' });

        await dao.save(army);

        const retrieved = await adapter.get('army', 'army-1');
        expect(retrieved).toEqual(army);
    });

    it('retrieves an army by ID', async () => {
        const army = makeArmy({ id: 'army-1' });
        await adapter.put('army', army);

        const retrieved = await dao.get('army-1');

        expect(retrieved).toEqual(army);
    });

    it('returns null when army does not exist', async () => {
        const retrieved = await dao.get('nonexistent');

        expect(retrieved).toBeNull();
    });

    it('lists all armies', async () => {
        await dao.save(makeArmy({ id: 'army-1' }));
        await dao.save(makeArmy({ id: 'army-2' }));
        await dao.save(makeArmy({ id: 'army-3' }));

        const all = await dao.list();

        expect(all).toHaveLength(3);
        expect(all.map((a) => a.id).sort()).toEqual(['army-1', 'army-2', 'army-3']);
    });

    it('deletes an army by ID', async () => {
        const army = makeArmy({ id: 'army-1' });
        await dao.save(army);

        await dao.delete('army-1');

        const retrieved = await dao.get('army-1');
        expect(retrieved).toBeNull();
    });

    it('counts total armies', async () => {
        await dao.save(makeArmy({ id: 'army-1' }));
        await dao.save(makeArmy({ id: 'army-2' }));

        const count = await dao.count();

        expect(count).toBe(2);
    });

    it('saves multiple armies at once', async () => {
        const army1 = makeArmy({ id: 'army-1' });
        const army2 = makeArmy({ id: 'army-2' });

        await dao.saveMany([army1, army2]);

        const retrieved1 = await dao.get('army-1');
        const retrieved2 = await dao.get('army-2');

        expect(retrieved1).toEqual(army1);
        expect(retrieved2).toEqual(army2);
    });

    it('lists armies by owner', async () => {
        const army1 = makeArmy({ id: 'army-1', ownerId: 'user-1' });
        const army2 = makeArmy({ id: 'army-2', ownerId: 'user-2' });
        await dao.save(army1);
        await dao.save(army2);

        const result = await dao.listByOwner('user-1');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(army1);
    });

    it('lists armies by faction', async () => {
        const army1 = makeArmy({ id: 'army-1', factionId: 'space-marines' });
        const army2 = makeArmy({ id: 'army-2', factionId: 'chaos-knights' });
        await dao.save(army1);
        await dao.save(army2);

        const result = await dao.listByFaction('space-marines');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(army1);
    });

    it('deletes all armies', async () => {
        await dao.save(makeArmy({ id: 'army-1' }));
        await dao.save(makeArmy({ id: 'army-2' }));

        await dao.deleteAll();

        const count = await dao.count();

        expect(count).toBe(0);
    });
});

describe('CampaignDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: CampaignDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new CampaignDAO(adapter);
    });

    it('saves a campaign to the database', async () => {
        const campaign = makeCampaign({ id: 'campaign-1' });

        await dao.save(campaign);

        const retrieved = await adapter.get('campaign', 'campaign-1');
        expect(retrieved).toEqual(campaign);
    });

    it('retrieves a campaign by ID', async () => {
        const campaign = makeCampaign({ id: 'campaign-1' });
        await adapter.put('campaign', campaign);

        const retrieved = await dao.get('campaign-1');

        expect(retrieved).toEqual(campaign);
    });

    it('returns null when campaign does not exist', async () => {
        const retrieved = await dao.get('nonexistent');

        expect(retrieved).toBeNull();
    });

    it('lists all campaigns', async () => {
        await dao.save(makeCampaign({ id: 'campaign-1' }));
        await dao.save(makeCampaign({ id: 'campaign-2' }));

        const all = await dao.list();

        expect(all).toHaveLength(2);
        expect(all.map((c) => c.id).sort()).toEqual(['campaign-1', 'campaign-2']);
    });

    it('deletes a campaign by ID', async () => {
        const campaign = makeCampaign({ id: 'campaign-1' });
        await dao.save(campaign);

        await dao.delete('campaign-1');

        const retrieved = await dao.get('campaign-1');
        expect(retrieved).toBeNull();
    });

    it('saves multiple campaigns at once', async () => {
        const campaign1 = makeCampaign({ id: 'campaign-1' });
        const campaign2 = makeCampaign({ id: 'campaign-2' });

        await dao.saveMany([campaign1, campaign2]);

        const retrieved1 = await dao.get('campaign-1');
        const retrieved2 = await dao.get('campaign-2');

        expect(retrieved1).toEqual(campaign1);
        expect(retrieved2).toEqual(campaign2);
    });

    it('lists campaigns by organizer', async () => {
        const campaign1 = makeCampaign({ id: 'campaign-1', organizerId: 'user-1' });
        const campaign2 = makeCampaign({ id: 'campaign-2', organizerId: 'user-2' });
        await dao.save(campaign1);
        await dao.save(campaign2);

        const result = await dao.listByOrganizer('user-1');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(campaign1);
    });

    it('lists campaigns by status', async () => {
        const campaign1 = makeCampaign({ id: 'campaign-1', status: 'active' });
        const campaign2 = makeCampaign({ id: 'campaign-2', status: 'completed' });
        await dao.save(campaign1);
        await dao.save(campaign2);

        const result = await dao.listByStatus('active');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(campaign1);
    });

    it('deletes all campaigns', async () => {
        await dao.save(makeCampaign({ id: 'campaign-1' }));
        await dao.save(makeCampaign({ id: 'campaign-2' }));

        await dao.deleteAll();

        const count = await dao.count();

        expect(count).toBe(0);
    });

    it('counts total campaigns', async () => {
        await dao.save(makeCampaign({ id: 'campaign-1' }));
        await dao.save(makeCampaign({ id: 'campaign-2' }));

        const count = await dao.count();

        expect(count).toBe(2);
    });
});

describe('AccountDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: AccountDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new AccountDAO(adapter);
    });

    it('saves an account to the database', async () => {
        const account = makeAccount({ id: 'auth0|user-1' });

        await dao.save(account);

        const retrieved = await adapter.get('account', 'auth0|user-1');
        expect(retrieved).toEqual(account);
    });

    it('retrieves an account by ID', async () => {
        const account = makeAccount({ id: 'auth0|user-1' });
        await adapter.put('account', account);

        const retrieved = await dao.get('auth0|user-1');

        expect(retrieved).toEqual(account);
    });

    it('returns null when account does not exist', async () => {
        const retrieved = await dao.get('nonexistent');

        expect(retrieved).toBeNull();
    });

    it('lists all accounts', async () => {
        await dao.save(makeAccount({ id: 'auth0|user-1' }));
        await dao.save(makeAccount({ id: 'auth0|user-2' }));

        const all = await dao.list();

        expect(all).toHaveLength(2);
    });

    it('deletes an account by ID', async () => {
        const account = makeAccount({ id: 'auth0|user-1' });
        await dao.save(account);

        await dao.delete('auth0|user-1');

        const retrieved = await dao.get('auth0|user-1');
        expect(retrieved).toBeNull();
    });
});
