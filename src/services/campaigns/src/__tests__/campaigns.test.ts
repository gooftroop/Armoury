import { beforeEach, describe, expect, it } from 'vitest';
import type { CreateCampaignRequest, UpdateCampaignRequest, UserContext } from '@/types.js';
import type { Campaign } from '@armoury/models';
import { createCampaign, deleteCampaign, getCampaign, listCampaigns, updateCampaign } from '@/routes/campaigns.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

const createRequest: CreateCampaignRequest = {
    name: 'Crusade Alpha',
    type: 'crusade',
    narrative: { schemaVersion: 1, narrative: 'A new crusade begins.' },
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: null,
    status: 'upcoming',
    customRules: ['No allies.'],
};

const updateRequest: UpdateCampaignRequest = {
    name: 'Crusade Beta',
    type: 'generic',
    narrative: { schemaVersion: 1, narrative: 'Updated narrative.' },
    startDate: '2024-02-01T00:00:00.000Z',
    endDate: '2024-06-01T00:00:00.000Z',
    status: 'active',
    phases: [],
    customRules: ['Updated rule.'],
    rankings: [],
    participantIds: ['participant-1'],
    matchIds: ['match-1'],
};

describe('campaign routes', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        adapter.clear();
        await adapter.initialize();
    });

    it('createCampaign: valid input returns 201 with campaign data and organizer', async () => {
        const response = await createCampaign(adapter, createRequest, null, baseUserContext);

        expect(response.statusCode).toBe(201);

        const payload = JSON.parse(response.body) as Campaign;

        expect(payload.id).toEqual(expect.any(String));
        expect(payload.organizerId).toBe(baseUserContext.sub);
        expect(payload.name).toBe(createRequest.name);
        expect(payload.participantIds).toEqual([]);
    });

    it('createCampaign: missing required fields returns 400', async () => {
        const response = await createCampaign(adapter, { name: 'Only Name' }, null, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('createCampaign: null body returns 400', async () => {
        const response = await createCampaign(adapter, null, null, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('listCampaigns: returns 200 with empty array when no campaigns', async () => {
        const response = await listCampaigns(adapter, null, null, baseUserContext);

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual([]);
    });

    it('listCampaigns: returns 200 with all campaigns', async () => {
        const campaignOne = buildCampaign('campaign-1', 'Campaign One');
        const campaignTwo = buildCampaign('campaign-2', 'Campaign Two');

        await adapter.put('campaign', campaignOne);
        await adapter.put('campaign', campaignTwo);

        const response = await listCampaigns(adapter, null, null, baseUserContext);
        const payload = JSON.parse(response.body) as Campaign[];

        expect(response.statusCode).toBe(200);
        expect(payload).toHaveLength(2);
        expect(payload).toEqual(expect.arrayContaining([campaignOne, campaignTwo]));
    });

    it('getCampaign: returns 200 with campaign data', async () => {
        const campaign = buildCampaign('campaign-1', 'Campaign One');

        await adapter.put('campaign', campaign);

        const response = await getCampaign(adapter, null, { id: 'campaign-1' }, baseUserContext);
        const payload = JSON.parse(response.body) as Campaign;

        expect(response.statusCode).toBe(200);
        expect(payload.id).toBe('campaign-1');
        expect(payload.name).toBe(campaign.name);
    });

    it('getCampaign: returns 404 when not found', async () => {
        const response = await getCampaign(adapter, null, { id: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('getCampaign: returns 400 when missing id', async () => {
        const response = await getCampaign(adapter, null, null, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('updateCampaign: returns 200 with updated data', async () => {
        const campaign = buildCampaign('campaign-1', 'Campaign One');

        await adapter.put('campaign', campaign);

        const response = await updateCampaign(adapter, updateRequest, { id: 'campaign-1' }, baseUserContext);
        const payload = JSON.parse(response.body) as Campaign;

        expect(response.statusCode).toBe(200);
        expect(payload.name).toBe(updateRequest.name);
        expect(payload.status).toBe(updateRequest.status);
        expect(payload.customRules).toEqual(updateRequest.customRules);
    });

    it('updateCampaign: returns 404 when campaign not found', async () => {
        const response = await updateCampaign(adapter, updateRequest, { id: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('updateCampaign: returns 400 for invalid body', async () => {
        const response = await updateCampaign(adapter, null, { id: 'campaign-1' }, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('deleteCampaign: returns 204 on success', async () => {
        const campaign = buildCampaign('campaign-1', 'Campaign One');

        await adapter.put('campaign', campaign);

        const response = await deleteCampaign(adapter, null, { id: 'campaign-1' }, baseUserContext);

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');
        await expect(adapter.get('campaign', 'campaign-1')).resolves.toBeNull();
    });

    it('deleteCampaign: returns 404 when not found', async () => {
        const response = await deleteCampaign(adapter, null, { id: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });
});

function buildCampaign(id: string, name: string): Campaign {
    return {
        id,
        name,
        type: 'crusade',
        organizerId: 'organizer-1',
        narrative: { schemaVersion: 1, narrative: 'Narrative' },
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: null,
        status: 'upcoming',
        phases: [],
        customRules: [],
        rankings: [],
        participantIds: [],
        matchIds: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };
}
