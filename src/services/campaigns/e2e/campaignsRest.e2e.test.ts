import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { CreateCampaignRequest, JoinCampaignRequest, UserContext } from '@/types.js';
import type { Campaign, CampaignParticipant } from '@armoury/models';
import { router } from '@/router.js';
import { createE2EAdapter, resetDatabase } from '@/__testing__/e2eAdapter.js';
import type { DatabaseAdapter } from '@armoury/data-dao';

let adapter: DatabaseAdapter;

const organizer: UserContext = { userId: 'user-org', email: 'org@armoury.dev', name: 'Organizer' };
const participant: UserContext = { userId: 'user-part', email: 'part@armoury.dev', name: 'Participant' };

const createCampaignBody: CreateCampaignRequest = {
    name: 'Battle for Armageddon',
    type: 'crusade',
    narrative: { schemaVersion: 1, narrative: 'The war begins.' },
    startDate: '2024-06-01T00:00:00.000Z',
    endDate: null,
    status: 'active',
};

const joinBody: JoinCampaignRequest = {
    displayName: 'Participant',
    armyId: 'army-2',
    armyName: 'Shadow Legion',
    currentPhaseId: 'phase-1',
};

function restEvent(method: string, resource: string, body?: unknown, pathParameters?: Record<string, string>) {
    return {
        httpMethod: method,
        path: resource,
        resource,
        body: body !== undefined ? JSON.stringify(body) : null,
        pathParameters: pathParameters ?? null,
    };
}

beforeAll(async () => {
    adapter = await createE2EAdapter();
});

afterAll(async () => {
    await resetDatabase(adapter);
});

describe('campaigns REST e2e', () => {
    beforeEach(async () => {
        await resetDatabase(adapter);
    });

    it('creates a campaign and returns 201', async () => {
        const res = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);

        expect(res.statusCode).toBe(201);
        const campaign = JSON.parse(res.body) as Campaign;
        expect(campaign.name).toBe('Battle for Armageddon');
        expect(campaign.organizerId).toBe(organizer.userId);
        expect(campaign.status).toBe('active');
        expect(campaign.id).toBeTruthy();
    });

    it('lists campaigns by organizer', async () => {
        await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        await router(restEvent('POST', '/', { ...createCampaignBody, name: 'Second War' }), adapter, organizer);

        const res = await router(restEvent('GET', '/'), adapter, organizer);
        expect(res.statusCode).toBe(200);
        const campaigns = JSON.parse(res.body) as Campaign[];
        expect(campaigns.length).toBeGreaterThanOrEqual(2);
    });

    it('gets a campaign by id', async () => {
        const createRes = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        const created = JSON.parse(createRes.body) as Campaign;

        const getRes = await router(restEvent('GET', '/{id}', undefined, { id: created.id }), adapter, organizer);

        expect(getRes.statusCode).toBe(200);
        const fetched = JSON.parse(getRes.body) as Campaign;
        expect(fetched.id).toBe(created.id);
    });

    it('updates a campaign', async () => {
        const createRes = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        const created = JSON.parse(createRes.body) as Campaign;

        const updateRes = await router(
            restEvent(
                'PUT',
                '/{id}',
                { ...createCampaignBody, name: 'Updated Campaign', status: 'completed' },
                { id: created.id },
            ),
            adapter,
            organizer,
        );

        expect(updateRes.statusCode).toBe(200);
        const updated = JSON.parse(updateRes.body) as Campaign;
        expect(updated.name).toBe('Updated Campaign');
        expect(updated.status).toBe('completed');
    });

    it('deletes a campaign', async () => {
        const createRes = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        const created = JSON.parse(createRes.body) as Campaign;

        const deleteRes = await router(restEvent('DELETE', '/{id}', undefined, { id: created.id }), adapter, organizer);
        expect(deleteRes.statusCode).toBe(204);

        const getRes = await router(restEvent('GET', '/{id}', undefined, { id: created.id }), adapter, organizer);
        expect(getRes.statusCode).toBe(404);
    });

    it('joins a campaign as participant', async () => {
        const createRes = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        const campaign = JSON.parse(createRes.body) as Campaign;

        const joinRes = await router(
            restEvent('POST', '/{id}/participants', joinBody, { id: campaign.id }),
            adapter,
            participant,
        );

        expect(joinRes.statusCode).toBe(201);
        const joined = JSON.parse(joinRes.body) as CampaignParticipant;
        expect(joined.campaignId).toBe(campaign.id);
        expect(joined.userId).toBe(participant.userId);
    });

    it('lists participants for a campaign', async () => {
        const createRes = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        const campaign = JSON.parse(createRes.body) as Campaign;

        await router(restEvent('POST', '/{id}/participants', joinBody, { id: campaign.id }), adapter, participant);

        const listRes = await router(
            restEvent('GET', '/{id}/participants', undefined, { id: campaign.id }),
            adapter,
            organizer,
        );

        expect(listRes.statusCode).toBe(200);
        const participants = JSON.parse(listRes.body) as CampaignParticipant[];
        expect(participants.length).toBeGreaterThanOrEqual(1);
    });

    it('updates a participant', async () => {
        const createRes = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        const campaign = JSON.parse(createRes.body) as Campaign;

        const joinRes = await router(
            restEvent('POST', '/{id}/participants', joinBody, { id: campaign.id }),
            adapter,
            participant,
        );
        const joined = JSON.parse(joinRes.body) as CampaignParticipant;

        const updateRes = await router(
            restEvent(
                'PUT',
                '/{id}/participants/{pid}',
                { ...joinBody, displayName: 'Updated Name', matchesInCurrentPhase: 3 },
                { id: campaign.id, pid: joined.id },
            ),
            adapter,
            participant,
        );

        expect(updateRes.statusCode).toBe(200);
        const updated = JSON.parse(updateRes.body) as CampaignParticipant;
        expect(updated.displayName).toBe('Updated Name');
    });

    it('deletes a participant', async () => {
        const createRes = await router(restEvent('POST', '/', createCampaignBody), adapter, organizer);
        const campaign = JSON.parse(createRes.body) as Campaign;

        const joinRes = await router(
            restEvent('POST', '/{id}/participants', joinBody, { id: campaign.id }),
            adapter,
            participant,
        );
        const joined = JSON.parse(joinRes.body) as CampaignParticipant;

        const deleteRes = await router(
            restEvent('DELETE', '/{id}/participants/{pid}', undefined, {
                id: campaign.id,
                pid: joined.id,
            }),
            adapter,
            organizer,
        );
        expect(deleteRes.statusCode).toBe(204);
    });

    it('returns 404 for nonexistent campaign', async () => {
        const res = await router(restEvent('GET', '/{id}', undefined, { id: 'nonexistent' }), adapter, organizer);
        expect(res.statusCode).toBe(404);
    });
});
