import { beforeEach, describe, expect, it } from 'vitest';
import type { CreateMatchRequest, Match, UpdateMatchRequest, UserContext } from '@matches/src/types.js';
import { createMatch, deleteMatch, getMatch, listMatches, updateMatch } from '@matches/src/routes/matches.js';
import { MockDatabaseAdapter } from '@matches/src/__mocks__/MockDatabaseAdapter.js';

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
    notes: 'Test match',
    playedAt: '2024-01-15T12:00:00.000Z',
};

const updateRequest: UpdateMatchRequest = {
    notes: 'Updated notes',
    outcome: { status: 'completed', resultsByPlayerId: { 'user-1': 'loss', 'user-2': 'win' } },
};

describe('match routes', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        adapter.clear();
        await adapter.initialize();
    });

    it('createMatch: valid input returns 201 with match structure', async () => {
        const response = await createMatch(adapter, createRequest, null, baseUserContext);

        expect(response.statusCode).toBe(201);
        const payload = JSON.parse(response.body) as Match;

        expect(payload.id).toEqual(expect.any(String));
        expect(payload.systemId).toBe('wh40k10e');
        expect(payload.players).toHaveLength(2);
        expect(payload.players[0]!.playerId).toBe('user-1');
        expect(payload.outcome.status).toBe('setup');
    });

    it('createMatch: missing fields returns 400', async () => {
        const response = await createMatch(adapter, { systemId: 'wh40k10e' }, null, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('createMatch: null body returns 400', async () => {
        const response = await createMatch(adapter, null, null, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('createMatch: user not in players returns 403', async () => {
        const request: CreateMatchRequest = {
            systemId: 'wh40k10e',
            players: [
                { playerId: 'user-3', campaignParticipantId: null },
                { playerId: 'user-4', campaignParticipantId: null },
            ],
        };

        const response = await createMatch(adapter, request, null, baseUserContext);

        expect(response.statusCode).toBe(403);
    });

    it('listMatches: empty returns 200 with []', async () => {
        const response = await listMatches(adapter, null, null, baseUserContext);

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual([]);
    });

    it('listMatches: returns only matches the user participates in', async () => {
        const matchOne = buildMatch('match-1', ['user-1', 'user-2']);
        const matchTwo = buildMatch('match-2', ['user-3', 'user-4']);

        await adapter.put('match', matchOne);
        await adapter.put('match', matchTwo);

        const response = await listMatches(adapter, null, null, baseUserContext);
        const payload = JSON.parse(response.body) as Match[];

        expect(response.statusCode).toBe(200);
        expect(payload).toHaveLength(1);
        expect(payload[0]!.id).toBe('match-1');
    });

    it('getMatch: found returns 200', async () => {
        const match = buildMatch('match-1', ['user-1', 'user-2']);

        await adapter.put('match', match);

        const response = await getMatch(adapter, null, { id: 'match-1' }, baseUserContext);
        const payload = JSON.parse(response.body) as Match;

        expect(response.statusCode).toBe(200);
        expect(payload.id).toBe('match-1');
    });

    it('getMatch: not found returns 404', async () => {
        const response = await getMatch(adapter, null, { id: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('getMatch: missing id returns 400', async () => {
        const response = await getMatch(adapter, null, null, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('updateMatch: valid returns 200', async () => {
        const match = buildMatch('match-1', ['user-1', 'user-2']);

        await adapter.put('match', match);

        const response = await updateMatch(adapter, updateRequest, { id: 'match-1' }, baseUserContext);
        const payload = JSON.parse(response.body) as Match;

        expect(response.statusCode).toBe(200);
        expect(payload.notes).toBe('Updated notes');
        expect(payload.outcome.status).toBe('completed');
    });

    it('updateMatch: not found returns 404', async () => {
        const response = await updateMatch(adapter, updateRequest, { id: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });

    it('updateMatch: invalid body returns 400', async () => {
        const response = await updateMatch(adapter, null, { id: 'match-1' }, baseUserContext);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'ValidationError' });
    });

    it('deleteMatch: success returns 204', async () => {
        const match = buildMatch('match-1', ['user-1', 'user-2']);

        await adapter.put('match', match);

        const response = await deleteMatch(adapter, null, { id: 'match-1' }, baseUserContext);

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe('');
        await expect(adapter.get('match', 'match-1')).resolves.toBeNull();
    });

    it('deleteMatch: not found returns 404', async () => {
        const response = await deleteMatch(adapter, null, { id: 'missing' }, baseUserContext);

        expect(response.statusCode).toBe(404);
        expect(JSON.parse(response.body)).toMatchObject({ error: 'NotFound' });
    });
});

function buildMatch(id: string, playerIds: string[]): Match {
    return {
        id,
        systemId: 'wh40k10e',
        players: playerIds.map((playerId) => ({
            playerId,
            campaignParticipantId: null,
        })),
        turn: { activePlayerId: null, turnOrder: playerIds, turnNumber: 0 },
        score: null,
        outcome: { status: 'setup', resultsByPlayerId: {} },
        campaignId: null,
        matchData: null,
        notes: '',
        playedAt: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
    };
}
