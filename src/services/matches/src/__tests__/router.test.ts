import { beforeEach, describe, expect, it } from 'vitest';
import type { CreateMatchRequest, Match, UpdateMatchRequest, UserContext } from '@/types.js';
import { router } from '@/router.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';

const baseUserContext: UserContext = {
    sub: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
};

const createRequest: CreateMatchRequest = {
    systemId: 'wh40k10e',
    players: [
        { playerId: 'user-1', campaignParticipantId: null },
        { playerId: 'user-2', campaignParticipantId: null },
    ],
    playedAt: '2024-01-15T12:00:00.000Z',
};

const updateRequest: UpdateMatchRequest = {
    notes: 'Draw game.',
    outcome: { status: 'completed', resultsByPlayerId: { 'user-1': 'draw', 'user-2': 'draw' } },
};

describe('router', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        adapter.clear();
        await adapter.initialize();
    });

    it('routes POST /matches to create', async () => {
        const response = await router(
            {
                httpMethod: 'POST',
                path: '/matches',
                resource: '/matches',
                body: JSON.stringify(createRequest),
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(201);
        const payload = JSON.parse(response.body) as Match;
        expect(payload.systemId).toBe('wh40k10e');
        expect(payload.players).toHaveLength(2);
    });

    it('routes GET /matches to list', async () => {
        const response = await router(
            {
                httpMethod: 'GET',
                path: '/matches',
                resource: '/matches',
                body: null,
                pathParameters: null,
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual([]);
    });

    it('routes GET /matches/:id to get', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/matches',
                resource: '/matches',
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
                path: `/matches/${created.id}`,
                resource: '/matches/{id}',
                body: null,
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toMatchObject({ id: created.id });
    });

    it('routes PUT /matches/:id to update', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/matches',
                resource: '/matches',
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
                path: `/matches/${created.id}`,
                resource: '/matches/{id}',
                body: JSON.stringify(updateRequest),
                pathParameters: { id: created.id },
            },
            adapter,
            baseUserContext,
        );

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body) as Match;
        expect(payload.notes).toBe('Draw game.');
        expect(payload.outcome.status).toBe('completed');
    });

    it('routes DELETE /matches/:id to delete', async () => {
        const createResponse = await router(
            {
                httpMethod: 'POST',
                path: '/matches',
                resource: '/matches',
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
                path: `/matches/${created.id}`,
                resource: '/matches/{id}',
                body: null,
                pathParameters: { id: created.id },
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
                path: '/matches',
                resource: '/matches',
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
