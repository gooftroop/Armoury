import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Match, UserContext, WebSocketEvent } from '@matches/src/types.js';
import { createE2EAdapter, resetDatabase } from '@matches/src/__testing__/e2eAdapter.js';
import type { LocalDatabaseAdapter } from '@matches/src/utils/localAdapter.js';
import type { BroadcastRecord } from '../../__testing__/mockBroadcaster.ts';
import { createMockBroadcaster } from '../../__testing__/mockBroadcaster.ts';
import { createTestUserContext, createWebSocketEvent } from '../../__testing__/helpers.ts';
import { wsRouter } from '@matches/src/wsRouter.js';

const mockBroadcast = createMockBroadcaster();

vi.mock('@matches/src/utils/broadcast.js', () => ({
    createBroadcaster: () => mockBroadcast.broadcaster,
}));

let adapter: LocalDatabaseAdapter;

const userA: UserContext = createTestUserContext({ sub: 'ws-user-a', name: 'WS Player A' });
const userB: UserContext = createTestUserContext({ sub: 'ws-user-b', name: 'WS Player B' });

function connectEvent(connectionId: string, userContext: UserContext): WebSocketEvent {
    return createWebSocketEvent({
        routeKey: '$connect',
        connectionId,
        userContext,
        eventType: 'CONNECT',
    });
}

function disconnectEvent(connectionId: string): WebSocketEvent {
    return createWebSocketEvent({
        routeKey: '$disconnect',
        connectionId,
        eventType: 'DISCONNECT',
    });
}

function messageEvent(connectionId: string, body: unknown): WebSocketEvent {
    return createWebSocketEvent({
        routeKey: (body as { action: string }).action,
        connectionId,
        body,
        eventType: 'MESSAGE',
    });
}

async function seedMatch(matchAdapter: LocalDatabaseAdapter, ...playerIds: string[]): Promise<Match> {
    const match: Match = {
        id: `match-${Date.now()}`,
        systemId: 'wh40k10e',
        players: playerIds.map((id) => ({ playerId: id, campaignParticipantId: null })),
        turn: { activePlayerId: playerIds[0], turnOrder: playerIds, turnNumber: 1 },
        score: null,
        outcome: {
            status: 'setup',
            resultsByPlayerId: Object.fromEntries(playerIds.map((id) => [id, 'draw'])),
        },
        campaignId: null,
        notes: '',
        playedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await matchAdapter.put('match', match);

    return match;
}

beforeAll(async () => {
    adapter = await createE2EAdapter();
});

afterAll(async () => {
    await resetDatabase(adapter);
});

describe('matches WebSocket e2e', () => {
    beforeEach(async () => {
        await resetDatabase(adapter);
        mockBroadcast.reset();
    });

    it('connect stores a ws connection', async () => {
        const res = await wsRouter(connectEvent('conn-a', userA), adapter, userA);

        expect(res.statusCode).toBe(200);

        const connection = await adapter.get('wsConnection', 'conn-a');
        expect(connection).not.toBeNull();
        expect(connection!.userId).toBe(userA.sub);
    });

    it('connect without user context returns 401', async () => {
        const event = createWebSocketEvent({
            routeKey: '$connect',
            connectionId: 'conn-noauth',
            eventType: 'CONNECT',
        });

        const res = await wsRouter(event, adapter, null);
        expect(res.statusCode).toBe(401);
    });

    it('subscribe sends initial match state and stores subscription', async () => {
        await wsRouter(connectEvent('conn-a', userA), adapter, userA);
        const match = await seedMatch(adapter, userA.sub);

        const res = await wsRouter(
            messageEvent('conn-a', { action: 'subscribeMatch', matchId: match.id }),
            adapter,
            null,
        );

        expect(res.statusCode).toBe(200);

        const subscription = await adapter.get('matchSubscription', `conn-a:${match.id}`);
        expect(subscription).not.toBeNull();
        expect(subscription!.matchId).toBe(match.id);

        expect(mockBroadcast.broadcasts).toHaveLength(1);
        const broadcast = mockBroadcast.broadcasts[0] as BroadcastRecord;
        expect(broadcast.connectionId).toBe('conn-a');
        expect((broadcast.data as { action: string }).action).toBe('matchState');
    });

    it('subscribe returns 403 for non-participant', async () => {
        await wsRouter(connectEvent('conn-other', { sub: 'other-user', email: 'o@test.dev', name: 'Other' }), adapter, {
            sub: 'other-user',
            email: 'o@test.dev',
            name: 'Other',
        });
        const match = await seedMatch(adapter, userA.sub);

        const res = await wsRouter(
            messageEvent('conn-other', { action: 'subscribeMatch', matchId: match.id }),
            adapter,
            null,
        );

        expect(res.statusCode).toBe(403);
    });

    it('updateMatch updates the record and broadcasts to subscribers', async () => {
        await wsRouter(connectEvent('conn-a', userA), adapter, userA);
        await wsRouter(connectEvent('conn-b', userB), adapter, userB);

        const match = await seedMatch(adapter, userA.sub, userB.sub);

        await wsRouter(messageEvent('conn-b', { action: 'subscribeMatch', matchId: match.id }), adapter, null);
        mockBroadcast.reset();

        const res = await wsRouter(
            messageEvent('conn-a', {
                action: 'updateMatch',
                matchId: match.id,
                data: { notes: 'Updated via WS' },
            }),
            adapter,
            null,
        );

        expect(res.statusCode).toBe(200);

        const updated = (await adapter.get('match', match.id)) as Match;
        expect(updated).not.toBeNull();
        expect(updated!.notes).toBe('Updated via WS');

        expect(mockBroadcast.broadcasts).toHaveLength(1);
        const broadcast = mockBroadcast.broadcasts[0] as BroadcastRecord;
        expect(broadcast.connectionId).toBe('conn-b');
        expect((broadcast.data as { action: string }).action).toBe('matchUpdated');
    });

    it('updateMatch returns 403 for non-owner', async () => {
        await wsRouter(connectEvent('conn-b', userB), adapter, userB);
        const match = await seedMatch(adapter, userA.sub);

        const res = await wsRouter(
            messageEvent('conn-b', {
                action: 'updateMatch',
                matchId: match.id,
                data: { notes: 'Unauthorized update' },
            }),
            adapter,
            null,
        );

        expect(res.statusCode).toBe(403);
    });

    it('unsubscribe removes the subscription', async () => {
        await wsRouter(connectEvent('conn-a', userA), adapter, userA);
        const match = await seedMatch(adapter, userA.sub);

        await wsRouter(messageEvent('conn-a', { action: 'subscribeMatch', matchId: match.id }), adapter, null);

        const res = await wsRouter(
            messageEvent('conn-a', { action: 'unsubscribeMatch', matchId: match.id }),
            adapter,
            null,
        );

        expect(res.statusCode).toBe(200);

        const subscription = await adapter.get('matchSubscription', `conn-a:${match.id}`);
        expect(subscription).toBeNull();
    });

    it('disconnect removes connection and all subscriptions', async () => {
        await wsRouter(connectEvent('conn-a', userA), adapter, userA);
        const match = await seedMatch(adapter, userA.sub);

        await wsRouter(messageEvent('conn-a', { action: 'subscribeMatch', matchId: match.id }), adapter, null);

        const res = await wsRouter(disconnectEvent('conn-a'), adapter, null);
        expect(res.statusCode).toBe(200);

        const connection = await adapter.get('wsConnection', 'conn-a');
        expect(connection).toBeNull();

        const subscription = await adapter.get('matchSubscription', `conn-a:${match.id}`);
        expect(subscription).toBeNull();
    });

    it('unknown action returns 400', async () => {
        const event = createWebSocketEvent({
            routeKey: '$default',
            connectionId: 'conn-a',
            eventType: 'MESSAGE',
        });

        const res = await wsRouter(event, adapter, null);
        expect(res.statusCode).toBe(400);
    });
});
