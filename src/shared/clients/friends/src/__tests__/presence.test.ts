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

import { FriendsPresenceClient, createFriendsPresenceClient } from '../presence.js';
import type { ConnectionState, FriendsPresenceConfig, FriendsServerMessage, WebSocketErrorEvent } from '../types.js';

type TestableClient = FriendsPresenceClient & {
    validateMessage(parsed: unknown): boolean;
    onMessage(message: FriendsServerMessage): void;
    onConnectionStateChange(state: ConnectionState): void;
    onError(event: WebSocketErrorEvent): void;
};

type BaseClientConfigLike = {
    wsUrl: string;
    getToken: FriendsPresenceConfig['getToken'];
    maxReconnectAttempts: number;
    baseReconnectDelayMs: number;
    maxReconnectDelayMs: number;
    heartbeatTimeoutMs: number;
};

const createConfig = (): FriendsPresenceConfig => ({
    wsUrl: 'wss://presence.example.com',
    getToken: () => 'token-123',
});

const createTestableClient = (config: FriendsPresenceConfig = createConfig()): TestableClient =>
    new FriendsPresenceClient(config) as TestableClient;

describe('FriendsPresenceClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor and factory', () => {
        it('maps FriendsPresenceConfig and package constants to base WebSocket config', () => {
            const config = createConfig();

            new FriendsPresenceClient(config);

            expect(mockConstructor).toHaveBeenCalledTimes(1);

            const constructorArg = (mockConstructor.mock.calls[0] as [unknown])[0] as BaseClientConfigLike;
            expect(constructorArg.wsUrl).toBe(config.wsUrl);
            expect(constructorArg.getToken).toBe(config.getToken);
            expect(constructorArg.maxReconnectAttempts).toBe(10);
            expect(constructorArg.baseReconnectDelayMs).toBe(1000);
            expect(constructorArg.maxReconnectDelayMs).toBe(30000);
            expect(constructorArg.heartbeatTimeoutMs).toBe(31000);
        });

        it('createFriendsPresenceClient returns a FriendsPresenceClient instance', () => {
            const client = createFriendsPresenceClient(createConfig());

            expect(client).toBeInstanceOf(FriendsPresenceClient);
        });
    });

    describe('validateMessage', () => {
        it('returns true for friendOnline messages', () => {
            const client = createTestableClient();

            const result = client.validateMessage({ action: 'friendOnline', userId: 'u1', name: 'Alice' });

            expect(result).toBe(true);
        });

        it('returns true for friendOffline messages', () => {
            const client = createTestableClient();

            const result = client.validateMessage({ action: 'friendOffline', userId: 'u1' });

            expect(result).toBe(true);
        });

        it('returns false for non-presence actions', () => {
            const client = createTestableClient();

            const result = client.validateMessage({ action: 'matchState' });

            expect(result).toBe(false);
        });

        it.each([null, undefined, 'hello', 123, true])('returns false for non-object value %p', (value) => {
            const client = createTestableClient();

            const result = client.validateMessage(value);

            expect(result).toBe(false);
        });
    });

    describe('onMessage', () => {
        it('emits server messages through messages$', () => {
            const client = createTestableClient();
            const received: FriendsServerMessage[] = [];
            client.messages$.subscribe((message) => received.push(message));

            const message: FriendsServerMessage = { action: 'friendOnline', userId: 'u1', name: 'Alice' };
            client.onMessage(message);

            expect(received).toEqual([message]);
        });

        it('emits multiple messages in order', () => {
            const client = createTestableClient();
            const received: FriendsServerMessage[] = [];
            client.messages$.subscribe((message) => received.push(message));

            const first: FriendsServerMessage = { action: 'friendOnline', userId: 'u1', name: 'Alice' };
            const second: FriendsServerMessage = { action: 'friendOffline', userId: 'u1' };

            client.onMessage(first);
            client.onMessage(second);

            expect(received).toEqual([first, second]);
        });
    });

    describe('onConnectionStateChange', () => {
        it('emits connection state changes through connectionState$', () => {
            const client = createTestableClient();
            const received: ConnectionState[] = [];
            client.connectionState$.subscribe((state) => received.push(state));

            client.onConnectionStateChange('connecting');
            client.onConnectionStateChange('connected');

            expect(received).toEqual(['disconnected', 'connecting', 'connected']);
        });

        it('starts with disconnected and then emits new values', () => {
            const client = createTestableClient();
            const received: ConnectionState[] = [];
            client.connectionState$.subscribe((state) => received.push(state));

            client.onConnectionStateChange('reconnecting');

            expect(received[0]).toBe('disconnected');
            expect(received[1]).toBe('reconnecting');
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

        it('emits multiple errors in order', () => {
            const client = createTestableClient();
            const received: WebSocketErrorEvent[] = [];
            client.errors$.subscribe((event) => received.push(event));

            const first = {
                source: 'unknown',
                error: new Error('first'),
                message: 'first',
            } as unknown as WebSocketErrorEvent;
            const second = {
                source: 'unknown',
                error: new Error('second'),
                message: 'second',
            } as unknown as WebSocketErrorEvent;

            client.onError(first);
            client.onError(second);

            expect(received).toEqual([first, second]);
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
