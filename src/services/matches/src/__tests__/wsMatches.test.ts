import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSend = vi.fn().mockResolvedValue(false);
const mockSendToMany = vi.fn().mockResolvedValue([]);

vi.mock('@sentry/aws-serverless', () => ({
    addBreadcrumb: vi.fn(),
    withScope: vi.fn((fn) => fn({ setTag: vi.fn(), setUser: vi.fn(), setContext: vi.fn() })),
    captureException: vi.fn(),
}));

vi.mock('@/utils/broadcast.js', () => ({
    createBroadcaster: vi.fn(() => ({ send: mockSend, sendToMany: mockSendToMany })),
}));

vi.mock('@/utils/wsErrors.js', () => ({ captureWsError: vi.fn() }));

import * as Sentry from '@sentry/aws-serverless';
import type { Match, MatchSubscription, UserContext, WebSocketEvent, WsConnection } from '@/types.js';
import {
    handleSubscribeMatch,
    handleUnsubscribeMatch,
    handleUpdateMatch,
    handleWsConnect,
    handleWsDefault,
    handleWsDisconnect,
} from '@/routes/wsMatches.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { createBroadcaster } from '@/utils/broadcast.js';
import { captureWsError } from '@/utils/wsErrors.js';

describe('wsMatches handlers', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();

        vi.clearAllMocks();
        mockSend.mockResolvedValue(false);
        mockSendToMany.mockResolvedValue([]);
    });

    describe('handleWsConnect', () => {
        it('returns 401 when userContext is null', async () => {
            const response = await handleWsConnect(makeWebSocketEvent(), adapter, null);

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'Unauthorized',
                message: 'Missing user context',
            });
        });

        it('returns 200 and stores WsConnection in adapter', async () => {
            const response = await handleWsConnect(makeWebSocketEvent(), adapter, makeUserContext());
            const connections = await adapter.getAll('wsConnection');

            expect(response.statusCode).toBe(200);
            expect(connections).toHaveLength(1);
            expect(connections[0]).toMatchObject({
                connectionId: 'conn-1',
                userId: 'user-1',
            });
        });

        it('returns 500 when adapter.put fails', async () => {
            vi.spyOn(adapter, 'put').mockRejectedValueOnce(new Error('db failed'));

            const response = await handleWsConnect(makeWebSocketEvent(), adapter, makeUserContext());

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'ServerError',
                message: 'Failed to establish connection',
            });
            expect(captureWsError).toHaveBeenCalledTimes(1);
        });

        it('adds Sentry breadcrumb on success', async () => {
            const response = await handleWsConnect(makeWebSocketEvent(), adapter, makeUserContext());

            expect(response.statusCode).toBe(200);
            expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
            expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'websocket.connect',
                    level: 'info',
                    data: expect.objectContaining({ connectionId: 'conn-1', userId: 'user-1' }),
                }),
            );
        });
    });

    describe('handleWsDisconnect', () => {
        it('returns 200 and deletes WsConnection', async () => {
            const deleteSpy = vi.spyOn(adapter, 'delete');
            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };

            await adapter.put('wsConnection', wsConnection);

            const response = await handleWsDisconnect(makeWebSocketEvent(), adapter, null);

            expect(response.statusCode).toBe(200);
            expect(deleteSpy).toHaveBeenCalledWith('wsConnection', 'conn-1');
            expect(await adapter.get('wsConnection', 'conn-1')).toBeNull();
        });

        it('deletes all MatchSubscriptions for the connectionId', async () => {
            const deleteSpy = vi.spyOn(adapter, 'delete');

            await adapter.put('matchSubscription', makeMatchSubscription());
            await adapter.put('matchSubscription', makeMatchSubscription({ id: 'conn-1:match-2', matchId: 'match-2' }));

            const response = await handleWsDisconnect(makeWebSocketEvent(), adapter, null);

            expect(response.statusCode).toBe(200);
            expect(deleteSpy).toHaveBeenCalledWith('matchSubscription', 'conn-1:match-1');
            expect(deleteSpy).toHaveBeenCalledWith('matchSubscription', 'conn-1:match-2');
            expect(await adapter.get('matchSubscription', 'conn-1:match-1')).toBeNull();
            expect(await adapter.get('matchSubscription', 'conn-1:match-2')).toBeNull();
        });

        it('returns 200 even when db errors and captures error', async () => {
            vi.spyOn(adapter, 'getByField').mockRejectedValueOnce(new Error('db failed'));

            const response = await handleWsDisconnect(makeWebSocketEvent(), adapter, null);

            expect(response.statusCode).toBe(200);
            expect(captureWsError).toHaveBeenCalledTimes(1);
        });

        it('works when no subscriptions exist', async () => {
            const response = await handleWsDisconnect(makeWebSocketEvent(), adapter, null);

            expect(response.statusCode).toBe(200);
            expect(captureWsError).not.toHaveBeenCalled();
        });
    });

    describe('handleWsDefault', () => {
        it('sends pong when body is ping action', async () => {
            const response = await handleWsDefault(
                makeWebSocketEvent({
                    body: JSON.stringify({ action: 'ping' }),
                    requestContext: {
                        routeKey: '$default',
                        connectionId: 'conn-1',
                        domainName: 'ws.example.com',
                        stage: 'prod',
                        eventType: 'MESSAGE',
                    },
                }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(200);
            expect(createBroadcaster).toHaveBeenCalledWith('ws.example.com', 'prod');
            expect(mockSend).toHaveBeenCalledWith('conn-1', { action: 'pong' });
        });

        it('returns 400 for unsupported actions', async () => {
            const response = await handleWsDefault(
                makeWebSocketEvent({
                    body: JSON.stringify({ action: 'unknownAction' }),
                    requestContext: {
                        routeKey: '$default',
                        connectionId: 'conn-1',
                        domainName: 'ws.example.com',
                        stage: 'prod',
                        eventType: 'MESSAGE',
                    },
                }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'UnknownAction',
                message: 'Unsupported action',
            });
        });

        it('returns 400 when body is null', async () => {
            const response = await handleWsDefault(makeWebSocketEvent({ body: null }), adapter, null);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'UnknownAction',
                message: 'Unsupported action',
            });
        });
    });

    describe('handleSubscribeMatch', () => {
        it('returns 400 when body is invalid JSON', async () => {
            const response = await handleSubscribeMatch(makeWebSocketEvent({ body: '{bad-json' }), adapter, null);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 400 when body is missing action subscribeMatch or missing matchId', async () => {
            const response = await handleSubscribeMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'subscribeMatch' }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 401 when connection is not found in adapter', async () => {
            const response = await handleSubscribeMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'subscribeMatch', matchId: 'match-1' }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'Unauthorized' });
        });

        it('returns 404 when match is not found', async () => {
            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };
            await adapter.put('wsConnection', wsConnection);

            const response = await handleSubscribeMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'subscribeMatch', matchId: 'match-1' }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'NotFound' });
        });

        it('returns 403 when user is not a player in the match', async () => {
            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };
            await adapter.put('wsConnection', wsConnection);
            await adapter.put(
                'match',
                makeMatch({
                    players: [
                        { playerId: 'user-2', campaignParticipantId: null },
                        { playerId: 'user-3', campaignParticipantId: null },
                    ],
                }),
            );

            const response = await handleSubscribeMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'subscribeMatch', matchId: 'match-1' }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(403);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'Forbidden' });
        });

        it('returns 200, stores MatchSubscription, sends matchState to subscriber', async () => {
            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };
            const match = makeMatch();

            await adapter.put('wsConnection', wsConnection);
            await adapter.put('match', match);

            const response = await handleSubscribeMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'subscribeMatch', matchId: 'match-1' }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(200);
            expect(await adapter.get('matchSubscription', 'conn-1:match-1')).toMatchObject({
                id: 'conn-1:match-1',
                connectionId: 'conn-1',
                matchId: 'match-1',
                userId: 'user-1',
            });
            expect(mockSend).toHaveBeenCalledWith('conn-1', {
                action: 'matchState',
                matchId: 'match-1',
                data: match,
            });
        });
    });

    describe('handleUnsubscribeMatch', () => {
        it('returns 400 when body is invalid', async () => {
            const response = await handleUnsubscribeMatch(makeWebSocketEvent({ body: '{bad-json' }), adapter, null);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 200 and deletes the subscription by connectionId:matchId', async () => {
            await adapter.put('matchSubscription', makeMatchSubscription());

            const response = await handleUnsubscribeMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'unsubscribeMatch', matchId: 'match-1' }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(200);
            expect(await adapter.get('matchSubscription', 'conn-1:match-1')).toBeNull();
        });

        it('returns 500 when adapter.delete fails', async () => {
            vi.spyOn(adapter, 'delete').mockRejectedValueOnce(new Error('db failed'));

            const response = await handleUnsubscribeMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'unsubscribeMatch', matchId: 'match-1' }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({
                error: 'ServerError',
                message: 'Failed to unsubscribe from match',
            });
            expect(captureWsError).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleUpdateMatch', () => {
        it('returns 400 when body is invalid JSON', async () => {
            const response = await handleUpdateMatch(makeWebSocketEvent({ body: '{bad-json' }), adapter, null);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 400 when validation fails (missing matchId or data)', async () => {
            const response = await handleUpdateMatch(
                makeWebSocketEvent({ body: JSON.stringify({ action: 'updateMatch', data: {} }) }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'ValidationError' });
        });

        it('returns 401 when connection not found', async () => {
            const response = await handleUpdateMatch(
                makeWebSocketEvent({
                    body: JSON.stringify({ action: 'updateMatch', matchId: 'match-1', data: { notes: 'updated' } }),
                }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'Unauthorized' });
        });

        it('returns 404 when match not found', async () => {
            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };
            await adapter.put('wsConnection', wsConnection);

            const response = await handleUpdateMatch(
                makeWebSocketEvent({
                    body: JSON.stringify({ action: 'updateMatch', matchId: 'match-1', data: { notes: 'updated' } }),
                }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(404);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'NotFound' });
        });

        it('returns 403 when user is not a player', async () => {
            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };
            await adapter.put('wsConnection', wsConnection);
            await adapter.put(
                'match',
                makeMatch({
                    players: [
                        { playerId: 'user-2', campaignParticipantId: null },
                        { playerId: 'user-3', campaignParticipantId: null },
                    ],
                }),
            );

            const response = await handleUpdateMatch(
                makeWebSocketEvent({
                    body: JSON.stringify({ action: 'updateMatch', matchId: 'match-1', data: { notes: 'updated' } }),
                }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(403);
            expect(JSON.parse(response.body ?? '{}')).toMatchObject({ error: 'Forbidden' });
        });

        it('returns 200, updates match in adapter, broadcasts matchUpdated to other subscribers', async () => {
            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };
            const otherConnection: WsConnection & { id: string } = {
                ...makeWsConnection({ connectionId: 'conn-2', userId: 'user-2' }),
                id: 'conn-2',
            };
            const match = makeMatch();

            await adapter.put('wsConnection', wsConnection);
            await adapter.put('wsConnection', otherConnection);
            await adapter.put('match', match);
            await adapter.put('matchSubscription', makeMatchSubscription());
            await adapter.put(
                'matchSubscription',
                makeMatchSubscription({ id: 'conn-2:match-1', connectionId: 'conn-2', userId: 'user-2' }),
            );

            const response = await handleUpdateMatch(
                makeWebSocketEvent({
                    body: JSON.stringify({
                        action: 'updateMatch',
                        matchId: 'match-1',
                        data: { notes: 'updated notes' },
                    }),
                }),
                adapter,
                null,
            );
            const updated = await adapter.get('match', 'match-1');

            expect(response.statusCode).toBe(200);
            expect(updated?.notes).toBe('updated notes');
            expect(mockSendToMany).toHaveBeenCalledWith(
                ['conn-2'],
                expect.objectContaining({
                    action: 'matchUpdated',
                    matchId: 'match-1',
                }),
            );
        });

        it('calls cleanupGoneConnections when sendToMany returns gone connections', async () => {
            mockSendToMany.mockResolvedValueOnce(['conn-2']);

            const wsConnection: WsConnection & { id: string } = { ...makeWsConnection(), id: 'conn-1' };
            const otherConnection: WsConnection & { id: string } = {
                ...makeWsConnection({ connectionId: 'conn-2', userId: 'user-2' }),
                id: 'conn-2',
            };

            await adapter.put('wsConnection', wsConnection);
            await adapter.put('wsConnection', otherConnection);
            await adapter.put('match', makeMatch());
            await adapter.put('matchSubscription', makeMatchSubscription());
            await adapter.put(
                'matchSubscription',
                makeMatchSubscription({ id: 'conn-2:match-1', connectionId: 'conn-2', userId: 'user-2' }),
            );

            const response = await handleUpdateMatch(
                makeWebSocketEvent({
                    body: JSON.stringify({
                        action: 'updateMatch',
                        matchId: 'match-1',
                        data: { notes: 'updated notes' },
                    }),
                }),
                adapter,
                null,
            );

            expect(response.statusCode).toBe(200);
            expect(await adapter.get('matchSubscription', 'conn-2:match-1')).toBeNull();
            expect(await adapter.get('wsConnection', 'conn-2')).toBeNull();
        });
    });
});

function makeWebSocketEvent(overrides: Partial<WebSocketEvent> = {}): WebSocketEvent {
    const { requestContext: requestContextOverrides, ...eventOverrides } = overrides;

    const requestContext = {
        routeKey: '$connect',
        connectionId: 'conn-1',
        domainName: 'ws.example.com',
        stage: 'prod',
        eventType: 'CONNECT' as const,
        ...(requestContextOverrides ?? {}),
    };

    return {
        requestContext,
        body: null,
        queryStringParameters: null,
        ...eventOverrides,
    };
}

function makeUserContext(overrides: Partial<UserContext> = {}): UserContext {
    return {
        userId: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        ...overrides,
    };
}

function makeWsConnection(overrides: Partial<WsConnection> = {}): WsConnection {
    return {
        connectionId: 'conn-1',
        userId: 'user-1',
        connectedAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeMatch(overrides: Partial<Match> = {}): Match {
    return {
        id: 'match-1',
        systemId: 'wh40k10e',
        players: [
            { playerId: 'user-1', campaignParticipantId: null },
            { playerId: 'user-2', campaignParticipantId: null },
        ],
        turn: { activePlayerId: 'user-1', turnOrder: ['user-1', 'user-2'], turnNumber: 1 },
        score: null,
        outcome: { status: 'in_progress', resultsByPlayerId: {} },
        campaignId: null,
        notes: '',
        playedAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeMatchSubscription(overrides: Partial<MatchSubscription> = {}): MatchSubscription {
    return {
        id: 'conn-1:match-1',
        connectionId: 'conn-1',
        matchId: 'match-1',
        userId: 'user-1',
        ...overrides,
    };
}
