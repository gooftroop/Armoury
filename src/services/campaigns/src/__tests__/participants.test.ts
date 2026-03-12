import { beforeEach, describe, expect, it } from 'vitest';
import type { JoinCampaignRequest, UpdateParticipantRequest, UserContext } from '@/types.js';
import type { Campaign, CampaignParticipant } from '@armoury/models';
import {
    deleteParticipant,
    getParticipant,
    joinCampaign,
    listParticipants,
    updateParticipant,
} from '@/routes/participants.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

const joinRequest: JoinCampaignRequest = {
    displayName: 'Participant One',
    armyId: 'army-1',
    armyName: 'First Army',
    currentPhaseId: 'phase-1',
    matchesInCurrentPhase: 1,
    participantData: null,
    matchIds: ['match-1'],
};

const updateRequest: UpdateParticipantRequest = {
    displayName: 'Participant Updated',
    armyId: 'army-2',
    armyName: 'Updated Army',
    currentPhaseId: 'phase-2',
    matchesInCurrentPhase: 2,
    participantData: null,
    matchIds: ['match-2'],
};

describe('participant routes', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        adapter.clear();
        await adapter.initialize();
    });

    it('joinCampaign: returns 201, adds participant and updates campaign participants', async () => {
        const campaign = buildCampaign('campaign-1');

        await adapter.put('campaign', campaign);

        const response = await joinCampaign(adapter, joinRequest, { id: 'campaign-1' }, baseUserContext);
        const participant = JSON.parse(response.body) as CampaignParticipant;

        expect(response.statusCode).toBe(201);
        expect(participant.id).toEqual(expect.any(String));
        expect(participant.campaignId).toBe('campaign-1');

        const updatedCampaign = await adapter.get('campaign', 'campaign-1');

        expect(updatedCampaign?.participantIds).toContain(participant.id);
    });

    it('joinCampaign: returns 404 when campaign not found', async () => {
        const response = await joinCampaign(adapter, joinRequest, { id: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('joinCampaign: returns 400 for missing fields', async () => {
        const response = await joinCampaign(adapter, { displayName: 'Missing' }, { id: 'campaign-1' }, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('listParticipants: returns 200 with participants filtered by campaign id', async () => {
        const campaign = buildCampaign('campaign-1');
        const otherCampaign = buildCampaign('campaign-2');
        const participant = buildParticipant('participant-1', 'campaign-1');
        const otherParticipant = buildParticipant('participant-2', 'campaign-2');

        await adapter.put('campaign', campaign);
        await adapter.put('campaign', otherCampaign);
        await adapter.put('campaignParticipant', participant);
        await adapter.put('campaignParticipant', otherParticipant);

        const response = await listParticipants(adapter, null, { id: 'campaign-1' }, baseUserContext);
        const payload = JSON.parse(response.body) as CampaignParticipant[];

        expect(response.statusCode).toBe(200);
        expect(payload).toHaveLength(1);
        expect(payload[0].id).toBe('participant-1');
    });

    it('getParticipant: returns 200 with participant data', async () => {
        const participant = buildParticipant('participant-1', 'campaign-1');

        await adapter.put('campaignParticipant', participant);

        const response = await getParticipant(adapter, null, { pid: 'participant-1' }, baseUserContext);
        const payload = JSON.parse(response.body) as CampaignParticipant;

        expect(response.statusCode).toBe(200);
        expect(payload.id).toBe('participant-1');
    });

    it('getParticipant: returns 404 when not found', async () => {
        const response = await getParticipant(adapter, null, { pid: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('updateParticipant: returns 200 with updated data', async () => {
        const participant = buildParticipant('participant-1', 'campaign-1');

        await adapter.put('campaignParticipant', participant);

        const response = await updateParticipant(adapter, updateRequest, { pid: 'participant-1' }, baseUserContext);
        const payload = JSON.parse(response.body) as CampaignParticipant;

        expect(response.statusCode).toBe(200);
        expect(payload.displayName).toBe(updateRequest.displayName);
        expect(payload.armyId).toBe(updateRequest.armyId);
    });

    it('updateParticipant: returns 404 when not found', async () => {
        const response = await updateParticipant(adapter, updateRequest, { pid: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('deleteParticipant: returns 204, removes participant and updates campaign participantIds', async () => {
        const campaign = buildCampaign('campaign-1', ['participant-1']);
        const participant = buildParticipant('participant-1', 'campaign-1');

        await adapter.put('campaign', campaign);
        await adapter.put('campaignParticipant', participant);

        const response = await deleteParticipant(
            adapter,
            null,
            { id: 'campaign-1', pid: 'participant-1' },
            baseUserContext,
        );

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');

        const updatedCampaign = await adapter.get('campaign', 'campaign-1');

        expect(updatedCampaign?.participantIds).toEqual([]);
        await expect(adapter.get('campaignParticipant', 'participant-1')).resolves.toBeNull();
    });

    it('deleteParticipant: returns 404 when campaign or participant not found', async () => {
        const responseMissingCampaign = await deleteParticipant(
            adapter,
            null,
            { id: 'missing', pid: 'participant-1' },
            baseUserContext,
        );

        expect(responseMissingCampaign.statusCode).toBe(404);
        expect(JSON.parse(responseMissingCampaign.body)).toMatchObject({ error: 'NotFound' });

        const campaign = buildCampaign('campaign-1');

        await adapter.put('campaign', campaign);

        const responseMissingParticipant = await deleteParticipant(
            adapter,
            null,
            { id: 'campaign-1', pid: 'participant-1' },
            baseUserContext,
        );

        expect(responseMissingParticipant.statusCode).toBe(404);
        expect(JSON.parse(responseMissingParticipant.body)).toMatchObject({ error: 'NotFound' });
    });
});

function buildCampaign(id: string, participantIds: string[] = []): Campaign {
    return {
        id,
        name: 'Campaign',
        type: 'crusade',
        organizerId: 'organizer-1',
        narrative: {
            schemaVersion: 1,
            narrative: 'Narrative',
        },
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: null,
        status: 'upcoming',
        phases: [],
        customRules: [],
        rankings: [],
        participantIds,
        matchIds: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };
}

function buildParticipant(id: string, campaignId: string): CampaignParticipant {
    return {
        id,
        campaignId,
        userId: 'user-1',
        displayName: 'Participant',
        isOrganizer: false,
        armyId: 'army-1',
        armyName: 'Army',
        currentPhaseId: 'phase-1',
        matchesInCurrentPhase: 0,
        participantData: null,
        matchIds: [],
        joinedAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };
}
