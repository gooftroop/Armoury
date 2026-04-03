import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockConstructor, mockConnect, mockDisconnect, mockDispose, mockSend } = vi.hoisted(() => ({
    mockConstructor: vi.fn(),
    mockConnect: vi.fn(),
    mockDisconnect: vi.fn(),
    mockDispose: vi.fn(),
    mockSend: vi.fn(),
}));

vi.mock('@armoury/network', () => {
    class MockWebSocketClient {
        constructor(config: unknown) {
            mockConstructor(config);
        }

        connect(): void {
            mockConnect();
        }

        disconnect(): void {
            mockDisconnect();
        }

        dispose(): void {
            mockDispose();
        }

        send(message: unknown): void {
            mockSend(message);
        }

        protected validateMessage(_parsed: unknown): boolean {
            return false;
        }

        protected onMessage(_message: unknown): void {}

        protected onConnectionStateChange(_state: string): void {}

        protected onError(_event: unknown): void {}
    }

    return { WebSocketClient: MockWebSocketClient };
});

vi.mock('@/config.js', () => ({
    MAX_RECONNECT_ATTEMPTS: 10,
    BASE_RECONNECT_DELAY_MS: 1000,
    MAX_RECONNECT_DELAY_MS: 30000,
    HEARTBEAT_TIMEOUT_MS: 31000,
}));

import { MatchesRealtimeClient, createMatchesRealtimeClient } from '../realtime.js';
import type {
    ConnectionState,
    Match,
    MatchStateMessage,
    MatchUpdatedMessage,
    MatchesServerMessage,
    MatchesWsConfig,
    UpdateMatchFields,
    WebSocketErrorEvent,
} from '../types.js';

type TestableClient = MatchesRealtimeClient & {
    validateMessage(parsed: unknown): boolean;
    onMessage(message: MatchesServerMessage): void;
    onConnectionStateChange(state: ConnectionState): void;
    onError(event: WebSocketErrorEvent): void;
};

type BaseClientConfigLike = {
    wsUrl: string;
    getToken: MatchesWsConfig['getToken'];
    maxReconnectAttempts: number;
    baseReconnectDelayMs: number;
    maxReconnectDelayMs: number;
    heartbeatTimeoutMs: number;
};

const createConfig = (): MatchesWsConfig => ({
    wsUrl: 'wss://matches.example.com',
    getToken: () => 'token-123',
});

const createMatch = (id: string): Match => ({
    id,
    systemId: 'sys-1',
    players: [
        { playerId: 'p1', campaignParticipantId: null },
        { playerId: 'p2', campaignParticipantId: null },
    ],
    turn: {
        activePlayerId: 'p1',
        turnOrder: ['p1', 'p2'],
        turnNumber: 1,
    },
    score: {
        totalsByPlayerId: { p1: 0, p2: 0 },
        events: [],
    },
    outcome: {
        status: 'setup',
        resultsByPlayerId: {},
    },
    campaignId: null,
    matchData: null,
    notes: '',
    playedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
});

const createMatchStateMessage = (matchId: string): MatchStateMessage => ({
    action: 'matchState',
    matchId,
    data: createMatch(matchId),
});

const createMatchUpdatedMessage = (matchId: string): MatchUpdatedMessage => ({
    action: 'matchUpdated',
    matchId,
    data: createMatch(matchId),
});

const createTestableClient = (config: MatchesWsConfig = createConfig()): TestableClient =>
    new MatchesRealtimeClient(config) as TestableClient;

describe('MatchesRealtimeClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor and factory', () => {
        it('creates instance with mapped base websocket config values', () => {
            const config = createConfig();

            new MatchesRealtimeClient(config);

            expect(mockConstructor).toHaveBeenCalledTimes(1);
            const constructorArg = (mockConstructor.mock.calls[0] as [unknown])[0] as BaseClientConfigLike;
            expect(constructorArg.wsUrl).toBe(config.wsUrl);
            expect(constructorArg.getToken).toBe(config.getToken);
            expect(constructorArg.maxReconnectAttempts).toBe(10);
            expect(constructorArg.baseReconnectDelayMs).toBe(1000);
            expect(constructorArg.maxReconnectDelayMs).toBe(30000);
            expect(constructorArg.heartbeatTimeoutMs).toBe(31000);
        });

        it('createMatchesRealtimeClient factory returns a MatchesRealtimeClient', () => {
            const client = createMatchesRealtimeClient(createConfig());

            expect(client).toBeInstanceOf(MatchesRealtimeClient);
        });
    });

    describe('validateMessage', () => {
        it('returns true for matchState messages', () => {
            const client = createTestableClient();

            const result = client.validateMessage(createMatchStateMessage('m1'));

            expect(result).toBe(true);
        });

        it('returns true for matchUpdated messages', () => {
            const client = createTestableClient();

            const result = client.validateMessage(createMatchUpdatedMessage('m1'));

            expect(result).toBe(true);
        });

        it('returns false for non-matches actions', () => {
            const client = createTestableClient();

            const result = client.validateMessage({ action: 'friendOnline' });

            expect(result).toBe(false);
        });

        it.each([null, undefined, 'hello', 123, true])('returns false for non-object value %p', (value) => {
            const client = createTestableClient();

            const result = client.validateMessage(value);

            expect(result).toBe(false);
        });
    });

    describe('onMessage', () => {
        it('emits messages through messages$', () => {
            const client = createTestableClient();
            const received: MatchesServerMessage[] = [];
            client.messages$.subscribe((message) => received.push(message));

            const message = createMatchStateMessage('m1');
            client.onMessage(message);

            expect(received).toEqual([message]);
        });

        it('emits multiple messages in order', () => {
            const client = createTestableClient();
            const received: MatchesServerMessage[] = [];
            client.messages$.subscribe((message) => received.push(message));

            const first = createMatchStateMessage('m1');
            const second = createMatchUpdatedMessage('m1');

            client.onMessage(first);
            client.onMessage(second);

            expect(received).toEqual([first, second]);
        });
    });

    describe('subscribeMatch', () => {
        it('calls send with subscribeMatch payload', () => {
            const client = createTestableClient();

            client.subscribeMatch('m1');

            expect(mockSend).toHaveBeenCalledWith({ action: 'subscribeMatch', matchId: 'm1' });
        });

        it('uses base client send implementation (mockSend)', () => {
            const client = createTestableClient();

            client.subscribeMatch('m2');

            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(mockSend).toHaveBeenCalledWith({ action: 'subscribeMatch', matchId: 'm2' });
        });
    });

    describe('unsubscribeMatch', () => {
        it('calls send with unsubscribeMatch payload', () => {
            const client = createTestableClient();

            client.unsubscribeMatch('m1');

            expect(mockSend).toHaveBeenCalledWith({ action: 'unsubscribeMatch', matchId: 'm1' });
        });

        it('sends one message per unsubscribe call', () => {
            const client = createTestableClient();

            client.unsubscribeMatch('m2');

            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(mockSend).toHaveBeenCalledWith({ action: 'unsubscribeMatch', matchId: 'm2' });
        });
    });

    describe('sendMatchUpdate', () => {
        it('calls send with updateMatch payload', () => {
            const client = createTestableClient();
            const data: UpdateMatchFields = { notes: 'updated notes' };

            client.sendMatchUpdate('m1', data);

            expect(mockSend).toHaveBeenCalledWith({ action: 'updateMatch', matchId: 'm1', data });
        });

        it('forwards complex update payloads unchanged', () => {
            const client = createTestableClient();
            const data: UpdateMatchFields = {
                notes: 'complex update',
                turn: {
                    activePlayerId: 'p2',
                    turnOrder: ['p1', 'p2'],
                    turnNumber: 2,
                },
            };

            client.sendMatchUpdate('m2', data);

            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(mockSend).toHaveBeenCalledWith({ action: 'updateMatch', matchId: 'm2', data });
        });
    });

    describe('matchState$', () => {
        it('emits only matchState for the specified matchId', () => {
            const client = createTestableClient();
            const received: MatchStateMessage[] = [];
            client.matchState$('m1').subscribe((message) => received.push(message));

            const target = createMatchStateMessage('m1');
            client.onMessage(target);

            expect(received).toEqual([target]);
        });

        it('does not emit matchUpdated messages', () => {
            const client = createTestableClient();
            const received: MatchStateMessage[] = [];
            client.matchState$('m1').subscribe((message) => received.push(message));

            client.onMessage(createMatchUpdatedMessage('m1'));

            expect(received).toEqual([]);
        });

        it('does not emit matchState for a different matchId', () => {
            const client = createTestableClient();
            const received: MatchStateMessage[] = [];
            client.matchState$('m1').subscribe((message) => received.push(message));

            client.onMessage(createMatchStateMessage('m2'));

            expect(received).toEqual([]);
        });
    });

    describe('matchUpdated$', () => {
        it('emits only matchUpdated for the specified matchId', () => {
            const client = createTestableClient();
            const received: MatchUpdatedMessage[] = [];
            client.matchUpdated$('m1').subscribe((message) => received.push(message));

            const target = createMatchUpdatedMessage('m1');
            client.onMessage(target);

            expect(received).toEqual([target]);
        });

        it('does not emit matchState messages', () => {
            const client = createTestableClient();
            const received: MatchUpdatedMessage[] = [];
            client.matchUpdated$('m1').subscribe((message) => received.push(message));

            client.onMessage(createMatchStateMessage('m1'));

            expect(received).toEqual([]);
        });

        it('does not emit matchUpdated for a different matchId', () => {
            const client = createTestableClient();
            const received: MatchUpdatedMessage[] = [];
            client.matchUpdated$('m1').subscribe((message) => received.push(message));

            client.onMessage(createMatchUpdatedMessage('m2'));

            expect(received).toEqual([]);
        });
    });

    describe('onConnectionStateChange', () => {
        it('emits connection state updates through connectionState$', () => {
            const client = createTestableClient();
            const received: ConnectionState[] = [];
            client.connectionState$.subscribe((state) => received.push(state));

            client.onConnectionStateChange('connecting');
            client.onConnectionStateChange('connected');

            expect(received).toEqual(['disconnected', 'connecting', 'connected']);
        });

        it('starts with disconnected as initial state', () => {
            const client = createTestableClient();
            const received: ConnectionState[] = [];
            client.connectionState$.subscribe((state) => received.push(state));

            expect(received[0]).toBe('disconnected');
        });
    });

    describe('onError', () => {
        it('emits error events through errors$', () => {
            const client = createTestableClient();
            const received: WebSocketErrorEvent[] = [];
            client.errors$.subscribe((event) => received.push(event));

            const errorEvent = {
                source: 'unknown',
                error: new Error('socket failure'),
                message: 'socket failure',
            } as unknown as WebSocketErrorEvent;

            client.onError(errorEvent);

            expect(received).toEqual([errorEvent]);
        });
    });

    describe('dispose', () => {
        it('calls super.dispose()', () => {
            const client = createTestableClient();

            client.dispose();

            expect(mockDispose).toHaveBeenCalledTimes(1);
        });

        it('completes messages$', () => {
            const client = createTestableClient();
            let completed = false;

            client.messages$.subscribe({
                complete: () => {
                    completed = true;
                },
            });

            client.dispose();

            expect(completed).toBe(true);
        });

        it('completes connectionState$', () => {
            const client = createTestableClient();
            let completed = false;

            client.connectionState$.subscribe({
                complete: () => {
                    completed = true;
                },
            });

            client.dispose();

            expect(completed).toBe(true);
        });

        it('completes errors$', () => {
            const client = createTestableClient();
            let completed = false;

            client.errors$.subscribe({
                complete: () => {
                    completed = true;
                },
            });

            client.dispose();

            expect(completed).toBe(true);
        });
    });
});
