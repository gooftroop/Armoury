import { beforeEach, describe, expect, it } from 'vitest';
import type {
    CreateCampaignRequest,
    JoinCampaignRequest,
    UpdateCampaignRequest,
    UpdateParticipantRequest,
    UserContext,
} from '@/types.js';
import { router } from '@/router.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

const createRequest: CreateCampaignRequest = {
    name: 'Campaign',
    type: 'crusade',
    narrative: {
        schemaVersion: 1,
        narrative: 'Narrative',
    },
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: null,
    status: 'upcoming',
    customRules: [],
};

const updateRequest: UpdateCampaignRequest = {
    name: 'Updated',
    type: 'generic',
    narrative: {
        schemaVersion: 1,
        narrative: 'Updated narrative',
    },
    startDate: '2024-02-01T00:00:00.000Z',
    endDate: null,
    status: 'active',
    phases: [],
    customRules: [],
    rankings: [],
    participantIds: [],
    matchIds: [],
};

const joinRequest: JoinCampaignRequest = {
    displayName: 'Participant',
    armyId: 'army-1',
    armyName: 'Army',
    currentPhaseId: 'phase-1',
    matchesInCurrentPhase: 0,
    participantData: null,
    matchIds: [],
};

const updateParticipantRequest: UpdateParticipantRequest = {
    displayName: 'Participant Updated',
    armyId: 'army-2',
    armyName: 'Army 2',
    currentPhaseId: 'phase-2',
    matchesInCurrentPhase: 1,
    participantData: null,
    matchIds: [],
};

describe('router', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        adapter.clear();
        await adapter.initialize();
    });

    it('routes POST /campaigns to create', async () => {
        const response = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toMatchObject({ name: createRequest.name });
    });

    it('routes GET /campaigns to list', async () => {
        const response = await router(
            {
                httpMethod: 'GET',
                path: '/campaigns',
                resource: '/campaigns',
                body: null,
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual([]);
    });

    it('routes GET /campaigns/:id to get', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        const response = await router(
            {
                httpMethod: 'GET',
                path: `/campaigns/${created.id}`,
                resource: '/campaigns/{id}',
                body: null,
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ id: created.id });
    });

    it('routes PUT /campaigns/:id to update', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        const response = await router(
            {
                httpMethod: 'PUT',
                path: `/campaigns/${created.id}`,
                resource: '/campaigns/{id}',
                body: JSON.stringify(updateRequest),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ name: updateRequest.name });
    });

    it('routes DELETE /campaigns/:id to delete', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        const response = await router(
            {
                httpMethod: 'DELETE',
                path: `/campaigns/${created.id}`,
                resource: '/campaigns/{id}',
                body: null,
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');
    });

    it('routes POST /campaigns/:id/participants to join', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        const response = await router(
            {
                httpMethod: 'POST',
                path: `/campaigns/${created.id}/participants`,
                resource: '/campaigns/{id}/participants',
                body: JSON.stringify(joinRequest),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(201);
        expect(JSON.parse(response.body)).toMatchObject({ campaignId: created.id });
    });

    it('routes GET /campaigns/:id/participants to list participants', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        await router(
            {
                httpMethod: 'POST',
                path: `/campaigns/${created.id}/participants`,
                resource: '/campaigns/{id}/participants',
                body: JSON.stringify(joinRequest),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        const response = await router(
            {
                httpMethod: 'GET',
                path: `/campaigns/${created.id}/participants`,
                resource: '/campaigns/{id}/participants',
                body: null,
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body) as { id: string }[];

        expect(payload).toHaveLength(1);
    });

    it('routes GET /campaigns/:id/participants/:pid to get participant', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        const joinResponse = await router(
            {
                httpMethod: 'POST',
                path: `/campaigns/${created.id}/participants`,
                resource: '/campaigns/{id}/participants',
                body: JSON.stringify(joinRequest),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );
        const participant = JSON.parse(joinResponse.body) as { id: string };

        const response = await router(
            {
                httpMethod: 'GET',
                path: `/campaigns/${created.id}/participants/${participant.id}`,
                resource: '/campaigns/{id}/participants/{pid}',
                body: null,
                pathParameters: { id: created.id, pid: participant.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ id: participant.id });
    });

    it('routes PUT /campaigns/:id/participants/:pid to update participant', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        const joinResponse = await router(
            {
                httpMethod: 'POST',
                path: `/campaigns/${created.id}/participants`,
                resource: '/campaigns/{id}/participants',
                body: JSON.stringify(joinRequest),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );
        const participant = JSON.parse(joinResponse.body) as { id: string };

        const response = await router(
            {
                httpMethod: 'PUT',
                path: `/campaigns/${created.id}/participants/${participant.id}`,
                resource: '/campaigns/{id}/participants/{pid}',
                body: JSON.stringify(updateParticipantRequest),
                pathParameters: { id: created.id, pid: participant.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ displayName: updateParticipantRequest.displayName });
    });

    it('routes DELETE /campaigns/:id/participants/:pid to delete participant', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );
        const created = JSON.parse(createResponse.body) as { id: string };

        const joinResponse = await router(
            {
                httpMethod: 'POST',
                path: `/campaigns/${created.id}/participants`,
                resource: '/campaigns/{id}/participants',
                body: JSON.stringify(joinRequest),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );
        const participant = JSON.parse(joinResponse.body) as { id: string };

        const response = await router(
            {
                httpMethod: 'DELETE',
                path: `/campaigns/${created.id}/participants/${participant.id}`,
                resource: '/campaigns/{id}/participants/{pid}',
                body: null,
                pathParameters: { id: created.id, pid: participant.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');
    });

    it('returns 404 for unknown routes', async () => {
        const response = await router(
            {
                httpMethod: 'GET',
                path: '/unknown',
                resource: '/unknown',
                body: null,
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('returns 400 for invalid JSON body', async () => {
        const response = await router(
            {
                httpMethod: 'POST',
                path: '/campaigns',
                resource: '/campaigns',
                body: '{invalid-json',
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });
});
