import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { CreateMatchRequest, Match, UserContext } from '@/types.js';
import { router } from '@/router.js';
import { createE2EAdapter, resetDatabase } from '@/__testing__/e2eAdapter.js';
import type { LocalDatabaseAdapter } from '@/utils/localAdapter.js';

let adapter: LocalDatabaseAdapter;

const userA: UserContext = { sub: 'user-a', email: 'a@armoury.dev', name: 'Player A' };
const userB: UserContext = { sub: 'user-b', email: 'b@armoury.dev', name: 'Player B' };

const validCreateBody: CreateMatchRequest = {
    systemId: 'wh40k10e',
    players: [
        { playerId: userA.sub, campaignParticipantId: null },
        { playerId: userB.sub, campaignParticipantId: null },
    ],
    turnOrder: [userA.sub, userB.sub],
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

describe('matches REST e2e', () => {
    beforeEach(async () => {
        await resetDatabase(adapter);
    });

    it('creates a match and returns 201', async () => {
        const res = await router(restEvent('POST', '/', validCreateBody), adapter, userA);

        expect(res.statusCode).toBe(201);
        const match = JSON.parse(res.body) as Match;
        expect(match.systemId).toBe('wh40k10e');
        expect(match.players).toHaveLength(2);
        expect(match.id).toBeTruthy();
    });

    it('lists matches filtered by player', async () => {
        await router(restEvent('POST', '/', validCreateBody), adapter, userA);

        const resA = await router(restEvent('GET', '/'), adapter, userA);
        const matchesA = JSON.parse(resA.body) as Match[];
        expect(matchesA).toHaveLength(1);
        expect(matchesA[0]!.systemId).toBe('wh40k10e');
    });

    it('gets a match by id', async () => {
        const createRes = await router(restEvent('POST', '/', validCreateBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Match;

        const getRes = await router(restEvent('GET', '/{id}', undefined, { id: created.id }), adapter, userA);

        expect(getRes.statusCode).toBe(200);
        const fetched = JSON.parse(getRes.body) as Match;
        expect(fetched.id).toBe(created.id);
    });

    it('returns 404 for nonexistent match', async () => {
        const res = await router(restEvent('GET', '/{id}', undefined, { id: 'nonexistent' }), adapter, userA);

        expect(res.statusCode).toBe(404);
    });

    it('updates a match', async () => {
        const createRes = await router(restEvent('POST', '/', validCreateBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Match;

        const updateRes = await router(
            restEvent('PUT', '/{id}', { notes: 'Updated' }, { id: created.id }),
            adapter,
            userA,
        );

        expect(updateRes.statusCode).toBe(200);
        const updated = JSON.parse(updateRes.body) as Match;
        expect(updated.notes).toBe('Updated');
    });

    it('deletes a match', async () => {
        const createRes = await router(restEvent('POST', '/', validCreateBody), adapter, userA);
        const created = JSON.parse(createRes.body) as Match;

        const deleteRes = await router(restEvent('DELETE', '/{id}', undefined, { id: created.id }), adapter, userA);
        expect(deleteRes.statusCode).toBe(204);

        const getRes = await router(restEvent('GET', '/{id}', undefined, { id: created.id }), adapter, userA);
        expect(getRes.statusCode).toBe(404);
    });

    it('links a match to an opponent match', async () => {
        const resA = await router(restEvent('POST', '/', validCreateBody), adapter, userA);
        const matchA = JSON.parse(resA.body) as Match;

        const resB = await router(restEvent('POST', '/', validCreateBody), adapter, userB);
        const matchB = JSON.parse(resB.body) as Match;

        expect(matchA.id).toBeTruthy();
        expect(matchB.id).toBeTruthy();
    });

    it('returns 400 for invalid JSON body', async () => {
        const event = {
            httpMethod: 'POST',
            path: '/',
            resource: '/',
            body: '{invalid json',
            pathParameters: null,
        };

        const res = await router(event, adapter, userA);
        expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown route', async () => {
        const res = await router(restEvent('PATCH', '/'), adapter, userA);
        expect(res.statusCode).toBe(404);
    });
});
