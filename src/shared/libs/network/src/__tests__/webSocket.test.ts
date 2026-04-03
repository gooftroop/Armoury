/**
 * Unit tests for the browser WebSocket base client.
 *
 * Source: src/webSocket.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    WebSocketClient,
    type ConnectionState,
    type WebSocketClientConfig,
    type WebSocketErrorEvent,
} from '@network/webSocket.js';

/**
 * @requirements
 * 1. Must construct with defaults and expose disconnected as initial state.
 * 2. Must resolve sync/async tokens and connect to URL with encoded token.
 * 3. Must emit expected connection state transitions across lifecycle events.
 * 4. Must dispatch only validated messages and report parse failures.
 * 5. Must reconnect using capped exponential backoff with jitter.
 * 6. Must stop reconnecting at max attempts and on intentional disconnect.
 * 7. Must run heartbeat timeout logic and reset heartbeat on incoming messages.
 * 8. Must emit structured error events with correct source values.
 * 9. Must send only when connected and report ws:send errors when disconnected.
 * 10. Must dispose safely, prevent reuse, and clean socket/timer resources.
 * 11. Must send periodic ping messages at a configurable interval while connected.
 * 12. Must stop ping when connection closes or client is disposed.
 */

/**
 * @requirements
 * 1. Must mimic the native browser WebSocket surface used by WebSocketClient.
 * 2. Must expose test helpers to simulate open/message/error/close events.
 * 3. Must track created instances and constructor URL arguments.
 */
class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    static readonly instances: MockWebSocket[] = [];

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    onopen: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;

    readonly url: string;
    close = vi.fn((code?: number, reason?: string) => {
        this.readyState = MockWebSocket.CLOSING;
        this.simulateClose(code, reason);
    });
    send = vi.fn();

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }

    /** Simulates a successful socket open event. */
    simulateOpen(): void {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.({ type: 'open' } as Event);
    }

    /** Simulates an incoming message event with provided payload data. */
    simulateMessage(data: unknown): void {
        this.onmessage?.({ type: 'message', data } as MessageEvent);
    }

    /** Simulates a close event and marks the socket as closed. */
    simulateClose(code = 1000, reason = ''): void {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ type: 'close', code, reason, wasClean: true } as CloseEvent);
    }

    /** Simulates an error event. */
    simulateError(): void {
        this.onerror?.({ type: 'error' } as Event);
    }
}

/**
 * Test concrete client for exercising abstract WebSocketClient behavior.
 */
class TestWebSocketClient extends WebSocketClient<{ type: 'valid'; value: string }> {
    readonly messages: Array<{ type: 'valid'; value: string }> = [];
    readonly states: ConnectionState[] = [];
    readonly errors: WebSocketErrorEvent[] = [];

    protected validateMessage(parsed: unknown): parsed is { type: 'valid'; value: string } {
        if (typeof parsed !== 'object' || parsed === null) {
            return false;
        }

        const value = parsed as Record<string, unknown>;

        return value['type'] === 'valid' && typeof value['value'] === 'string';
    }

    protected override onMessage(message: { type: 'valid'; value: string }): void {
        this.messages.push(message);
    }

    protected override onConnectionStateChange(state: ConnectionState): void {
        this.states.push(state);
    }

    protected override onError(event: WebSocketErrorEvent): void {
        this.errors.push(event);
    }

    sendJson(data: unknown): void {
        this.send(data);
    }
}

const WORKSPACE_WS_URL = 'wss://example.test/realtime';

const makeClient = (overrides: Partial<WebSocketClientConfig> = {}): TestWebSocketClient => {
    return new TestWebSocketClient({
        wsUrl: WORKSPACE_WS_URL,
        getToken: () => 'token-default',
        ...overrides,
    });
};

const getLastSocket = (): MockWebSocket => {
    const instance = MockWebSocket.instances.at(-1);

    if (!instance) {
        throw new Error('Expected MockWebSocket instance to exist');
    }

    return instance;
};

const flushPromises = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
};

describe('WebSocketClient', () => {
    beforeEach(() => {
        MockWebSocket.instances.length = 0;
        vi.useFakeTimers();
        vi.stubGlobal('WebSocket', MockWebSocket);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('construction', () => {
        it('creates an instance with disconnected initial state', () => {
            const client = makeClient();

            expect(client.state).toBe('disconnected');
            expect(client.states).toEqual([]);
            expect(client.errors).toEqual([]);
        });
    });

    describe('connection', () => {
        it('connects with sync token and encoded query parameter', async () => {
            const client = makeClient({ getToken: () => 'token with space' });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            expect(socket.url).toBe('wss://example.test/realtime?Auth=token%20with%20space');

            socket.simulateOpen();

            expect(client.state).toBe('connected');
            expect(client.states).toEqual(['connecting', 'connected']);
        });

        it('connects with async token provider', async () => {
            const client = makeClient({
                getToken: async () => 'async-token',
            });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            expect(socket.url).toBe('wss://example.test/realtime?Auth=async-token');
        });

        it('emits ws:token-resolve and disconnected when token resolution fails', async () => {
            const client = makeClient({
                getToken: () => {
                    throw new Error('token failure');
                },
            });

            client.connect();
            await flushPromises();

            expect(client.state).toBe('disconnected');
            expect(client.states).toEqual(['connecting', 'disconnected']);
            expect(client.errors).toHaveLength(1);
            expect(client.errors[0]?.source).toBe('ws:token-resolve');
        });
    });

    describe('message handling', () => {
        it('delivers validated messages to onMessage', async () => {
            const client = makeClient();

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();
            socket.simulateMessage('{"type":"valid","value":"hello"}');

            expect(client.messages).toEqual([{ type: 'valid', value: 'hello' }]);
        });

        it('ignores invalid but parseable messages', async () => {
            const client = makeClient();

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();
            socket.simulateMessage('{"type":"invalid","value":"hello"}');

            expect(client.messages).toEqual([]);
            expect(client.errors).toEqual([]);
        });

        it('emits ws:message-parse on invalid JSON', async () => {
            const client = makeClient();

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();
            socket.simulateMessage('not json');

            expect(client.errors).toHaveLength(1);
            expect(client.errors[0]?.source).toBe('ws:message-parse');
        });
    });

    describe('reconnection', () => {
        it('uses exponential backoff and jitter for reconnect delays', async () => {
            const randomSpy = vi.spyOn(Math, 'random');
            randomSpy.mockReturnValueOnce(0.4);
            randomSpy.mockReturnValueOnce(0.2);

            const client = makeClient({
                baseReconnectDelayMs: 1000,
                maxReconnectDelayMs: 8000,
                maxReconnectAttempts: 5,
            });
            const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');

            client.connect();
            await flushPromises();
            getLastSocket().simulateClose();

            const firstReconnectDelay = timeoutSpy.mock.calls.at(-1)?.[1] as number;
            expect(firstReconnectDelay).toBe(1200);
            expect(client.state).toBe('reconnecting');

            vi.advanceTimersByTime(firstReconnectDelay);
            await flushPromises();
            getLastSocket().simulateClose();

            const secondReconnectDelay = timeoutSpy.mock.calls.at(-1)?.[1] as number;
            expect(secondReconnectDelay).toBe(2200);
        });

        it('stops reconnecting when max attempts is reached', async () => {
            const client = makeClient({
                maxReconnectAttempts: 1,
                baseReconnectDelayMs: 10,
            });

            client.connect();
            await flushPromises();
            getLastSocket().simulateClose();
            vi.advanceTimersByTime(10);
            await flushPromises();
            getLastSocket().simulateClose();

            expect(client.state).toBe('disconnected');
            expect(client.states.at(-1)).toBe('disconnected');
        });

        it('does not reconnect after intentional disconnect', async () => {
            const client = makeClient({ baseReconnectDelayMs: 10 });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();
            client.disconnect();

            expect(client.state).toBe('disconnected');
            vi.runOnlyPendingTimers();
            expect(MockWebSocket.instances).toHaveLength(1);
        });
    });

    describe('heartbeat', () => {
        it('starts heartbeat on open and resets it on message', async () => {
            const client = makeClient({ heartbeatTimeoutMs: 1000 });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            const closeSpy = socket.close;
            socket.simulateOpen();

            vi.advanceTimersByTime(900);
            socket.simulateMessage('{"type":"valid","value":"keepalive"}');
            vi.advanceTimersByTime(900);

            expect(closeSpy).not.toHaveBeenCalled();
        });

        it('closes the connection and emits ws:heartbeat-timeout on timeout', async () => {
            const client = makeClient({ heartbeatTimeoutMs: 1000 });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            const closeSpy = socket.close;
            socket.simulateOpen();

            vi.advanceTimersByTime(1001);

            expect(closeSpy).toHaveBeenCalled();
            expect(client.errors.at(-1)?.source).toBe('ws:heartbeat-timeout');
        });
    });

    describe('ping', () => {
        it('sends ping at the configured interval while connected', async () => {
            const client = makeClient({ pingIntervalMs: 500 });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();

            expect(socket.send).not.toHaveBeenCalled();

            vi.advanceTimersByTime(500);
            expect(socket.send).toHaveBeenCalledTimes(1);
            expect(socket.send).toHaveBeenCalledWith('{"action":"ping"}');

            vi.advanceTimersByTime(500);
            expect(socket.send).toHaveBeenCalledTimes(2);
        });

        it('stops pinging when the socket closes', async () => {
            const client = makeClient({
                pingIntervalMs: 500,
                maxReconnectAttempts: 0,
            });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();

            vi.advanceTimersByTime(500);
            expect(socket.send).toHaveBeenCalledTimes(1);

            socket.simulateClose();

            vi.advanceTimersByTime(1500);
            expect(socket.send).toHaveBeenCalledTimes(1);
        });

        it('stops pinging when the client is disposed', async () => {
            const client = makeClient({ pingIntervalMs: 500 });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();

            vi.advanceTimersByTime(500);
            expect(socket.send).toHaveBeenCalledTimes(1);

            client.dispose();

            vi.advanceTimersByTime(1500);
            expect(socket.send).toHaveBeenCalledTimes(1);
        });

        it('prevents heartbeat timeout when server responds to pings', async () => {
            const client = makeClient({
                pingIntervalMs: 500,
                heartbeatTimeoutMs: 1000,
            });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();

            // At 500ms: ping fires
            vi.advanceTimersByTime(500);
            expect(socket.send).toHaveBeenCalledTimes(1);

            // Server responds with pong at 600ms — resets heartbeat timer
            vi.advanceTimersByTime(100);
            socket.simulateMessage('{"action":"pong"}');

            // At 1100ms: heartbeat would have fired at 1000ms without the pong reset
            vi.advanceTimersByTime(500);
            expect(socket.close).not.toHaveBeenCalled();
            expect(client.errors).toEqual([]);
        });
    });

    describe('error handling', () => {
        it('emits ws:error when native error event occurs', async () => {
            const client = makeClient();

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateError();

            expect(client.errors).toHaveLength(1);
            expect(client.errors[0]?.source).toBe('ws:error');
            expect(client.errors[0]?.timestamp).toBeTypeOf('string');
        });

        it('emits ws:open when open callback processing throws', async () => {
            class ThrowingOpenClient extends TestWebSocketClient {
                protected override onConnectionStateChange(state: ConnectionState): void {
                    if (state === 'connected') {
                        throw new Error('open callback failed');
                    }

                    super.onConnectionStateChange(state);
                }
            }

            const client = new ThrowingOpenClient({ wsUrl: WORKSPACE_WS_URL, getToken: () => 't' });

            client.connect();
            await flushPromises();
            getLastSocket().simulateOpen();

            expect(client.errors.at(-1)?.source).toBe('ws:open');
        });
    });

    describe('send', () => {
        it('sends serialized payload when connected', async () => {
            const client = makeClient();

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();

            client.sendJson({ action: 'ping' });

            expect(socket.send).toHaveBeenCalledWith('{"action":"ping"}');
            expect(client.errors).toEqual([]);
        });

        it('throws and emits ws:send when not connected', () => {
            const client = makeClient();

            expect(() => {
                client.sendJson({ action: 'ping' });
            }).toThrow('WebSocket is not connected');

            expect(client.errors).toHaveLength(1);
            expect(client.errors[0]?.source).toBe('ws:send');
        });
    });

    describe('disconnect', () => {
        it('sets disconnected state and closes active socket', async () => {
            const client = makeClient();

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();
            client.disconnect();

            expect(socket.close).toHaveBeenCalled();
            expect(client.state).toBe('disconnected');
            expect(client.states.at(-1)).toBe('disconnected');
        });
    });

    describe('dispose and cleanup', () => {
        it('disposes and prevents reconnecting or reusing the client', async () => {
            const client = makeClient({ baseReconnectDelayMs: 10 });

            client.connect();
            await flushPromises();

            const socket = getLastSocket();
            socket.simulateOpen();
            client.dispose();
            socket.simulateClose();

            client.connect();
            await flushPromises();
            vi.runOnlyPendingTimers();

            expect(client.state).toBe('disconnected');
            expect(MockWebSocket.instances).toHaveLength(1);
        });

        it('cleans up previous socket before creating a new connection', async () => {
            const client = makeClient();

            client.connect();
            await flushPromises();

            const firstSocket = getLastSocket();
            client.connect();
            await flushPromises();

            expect(firstSocket.close).toHaveBeenCalled();
            expect(MockWebSocket.instances).toHaveLength(2);
        });
    });
});
