/**
 * Browser-native WebSocket base client with reconnection and heartbeat support.
 *
 * Provides reusable lifecycle management for authenticated WebSocket clients,
 * including token resolution, connection state transitions, capped exponential
 * backoff with jitter, timeout-based heartbeat detection, and structured error
 * emission. Subclasses provide runtime message validation and consume callbacks.
 */

/**
 * @requirements
 * 1. Must connect using only native browser WebSocket APIs.
 * 2. Must expose connect, disconnect, dispose, and state APIs.
 * 3. Must support sync or async token resolution before opening the socket.
 * 4. Must emit connection state transitions via subclass callback.
 * 5. Must parse JSON messages and dispatch only validated messages.
 * 6. Must emit structured WebSocketErrorEvent objects for all error paths.
 * 7. Must support capped exponential reconnect with jitter and max attempts.
 * 8. Must use timer-based heartbeat reset on open and every received message.
 * 9. Must close stale sockets on heartbeat timeout and before reconnecting.
 * 10. Must prevent reconnect/disconnect side effects after dispose.
 */

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const DEFAULT_BASE_RECONNECT_DELAY_MS = 1000;
const DEFAULT_MAX_RECONNECT_DELAY_MS = 30000;
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 31000;

/** Connection states exposed by the WebSocket client lifecycle. */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/** Error source identifiers for structured WebSocket error reporting. */
export type WebSocketErrorSource =
    | 'ws:error'
    | 'ws:open'
    | 'ws:message-parse'
    | 'ws:token-resolve'
    | 'ws:send'
    | 'ws:heartbeat-timeout';

/** Structured WebSocket error payload emitted by the client. */
export interface WebSocketErrorEvent {
    /** The underlying error instance for this failure. */
    readonly error: Error;
    /** The lifecycle source where the error originated. */
    readonly source: WebSocketErrorSource;
    /** ISO 8601 timestamp describing when the error was emitted. */
    readonly timestamp: string;
    /** Optional immutable contextual data for additional debugging context. */
    readonly context?: Readonly<Record<string, unknown>>;
}

/** Configuration used to create a WebSocketClient instance. */
export interface WebSocketClientConfig {
    /** WebSocket server URL (without token). */
    wsUrl: string;
    /** Sync or async function returning an auth token. */
    getToken: () => Promise<string> | string;
    /** Max reconnection attempts. Default: 10. */
    maxReconnectAttempts?: number;
    /** Base reconnect delay in ms. Default: 1000. */
    baseReconnectDelayMs?: number;
    /** Max reconnect delay in ms. Default: 30000. */
    maxReconnectDelayMs?: number;
    /** Heartbeat timeout in ms. Default: 31000. */
    heartbeatTimeoutMs?: number;
}

/** Abstract browser WebSocket client base class. */
export abstract class WebSocketClient<MessageT> {
    private readonly wsUrl: string;
    private readonly getToken: () => Promise<string> | string;
    private readonly maxReconnectAttempts: number;
    private readonly baseReconnectDelayMs: number;
    private readonly maxReconnectDelayMs: number;
    private readonly heartbeatTimeoutMs: number;

    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalClose = false;
    private disposed = false;
    private connectionState: ConnectionState = 'disconnected';
    private lastError: Error | null = null;

    /** Current connection state for this client instance. */
    get state(): ConnectionState {
        return this.connectionState;
    }

    /**
     * Creates a new WebSocketClient with resiliency configuration.
     *
     * @param config - WebSocket URL, token provider, and reconnect/heartbeat tuning.
     */
    constructor(config: WebSocketClientConfig) {
        this.wsUrl = config.wsUrl;
        this.getToken = config.getToken;
        this.maxReconnectAttempts = config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
        this.baseReconnectDelayMs = config.baseReconnectDelayMs ?? DEFAULT_BASE_RECONNECT_DELAY_MS;
        this.maxReconnectDelayMs = config.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS;
        this.heartbeatTimeoutMs = config.heartbeatTimeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT_MS;
    }

    /** Connects to the configured WebSocket endpoint with token authentication. */
    connect(): void {
        if (this.disposed) {
            return;
        }

        this.intentionalClose = false;
        this.setState('connecting');
        void this.resolveTokenAndConnect();
    }

    /** Disconnects intentionally and stops reconnect attempts. */
    disconnect(): void {
        this.intentionalClose = true;
        this.clearReconnectTimer();
        this.reconnectAttempts = 0;
        this.cleanupWebSocket();
        this.setState('disconnected');
    }

    /** Disposes all resources and permanently disables reuse of this client. */
    dispose(): void {
        this.disposed = true;
        this.disconnect();
    }

    /**
     * Sends JSON-serializable data through the active socket connection.
     *
     * @param data - The payload to serialize and send.
     * @throws Error when the socket is not connected or send fails.
     */
    protected send(data: unknown): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            const error = new Error('WebSocket is not connected');
            this.emitError(error, 'ws:send', {
                readyState: this.ws?.readyState,
            });
            throw error;
        }

        try {
            this.ws.send(JSON.stringify(data));
        } catch (error) {
            const sendError = error instanceof Error ? error : new Error(String(error));
            this.emitError(sendError, 'ws:send');
            throw sendError;
        }
    }

    protected abstract validateMessage(parsed: unknown): parsed is MessageT;

    protected onMessage(_message: MessageT): void {}

    protected onConnectionStateChange(_state: ConnectionState): void {}

    protected onError(_event: WebSocketErrorEvent): void {}

    private async resolveTokenAndConnect(): Promise<void> {
        try {
            const token = await Promise.resolve(this.getToken());

            if (this.disposed || this.intentionalClose) {
                return;
            }

            this.establishConnection(token);
        } catch (error) {
            const tokenError = error instanceof Error ? error : new Error(String(error));
            this.emitError(tokenError, 'ws:token-resolve');
            this.setState('disconnected');
        }
    }

    private establishConnection(token: string): void {
        if (this.disposed) {
            return;
        }

        this.cleanupWebSocket();
        this.lastError = null;

        const url = `${this.wsUrl}?Auth=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(url);

        this.ws.onerror = (event: Event) => {
            const wsError = new Error('WebSocket error event');
            this.lastError = wsError;
            this.emitError(wsError, 'ws:error', {
                eventType: event.type,
                readyState: this.ws?.readyState,
            });
        };

        this.ws.onopen = (_event: Event) => {
            try {
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.setState('connected');
            } catch (error) {
                const openError = error instanceof Error ? error : new Error(String(error));
                this.emitError(openError, 'ws:open');
                this.ws?.close();
            }
        };

        this.ws.onmessage = (event: MessageEvent) => {
            this.startHeartbeat();
            this.handleMessage(event);
        };

        this.ws.onclose = (_event: CloseEvent) => {
            this.clearHeartbeat();

            const errorBeforeClose = this.lastError;
            this.lastError = null;
            this.ws = null;

            if (!this.intentionalClose && !this.disposed) {
                this.scheduleReconnect(errorBeforeClose);
            } else {
                this.setState('disconnected');
            }
        };
    }

    private handleMessage(event: MessageEvent): void {
        try {
            if (typeof event.data !== 'string') {
                throw new Error('WebSocket message data must be a string');
            }

            const parsed: unknown = JSON.parse(event.data);

            if (!this.validateMessage(parsed)) {
                return;
            }

            this.onMessage(parsed);
        } catch (error) {
            const parseError = error instanceof Error ? error : new Error(String(error));
            this.emitError(parseError, 'ws:message-parse', {
                dataType: typeof event.data,
            });
        }
    }

    private scheduleReconnect(_causingError?: Error | null): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.setState('disconnected');

            return;
        }

        this.setState('reconnecting');

        const baseDelay = Math.min(
            this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts),
            this.maxReconnectDelayMs,
        );
        const jitter = Math.random() * baseDelay * 0.5;

        this.reconnectAttempts++;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, baseDelay + jitter);
    }

    private startHeartbeat(): void {
        this.clearHeartbeat();

        this.heartbeatTimer = setTimeout(() => {
            if (!this.ws) {
                return;
            }

            this.emitError(new Error('WebSocket heartbeat timeout'), 'ws:heartbeat-timeout', {
                heartbeatTimeoutMs: this.heartbeatTimeoutMs,
            });
            this.ws.close();
        }, this.heartbeatTimeoutMs);
    }

    private clearHeartbeat(): void {
        if (this.heartbeatTimer !== null) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private cleanupWebSocket(): void {
        this.clearHeartbeat();

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;

            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }

            this.ws = null;
        }
    }

    private emitError(error: Error, source: WebSocketErrorSource, context?: Record<string, unknown>): void {
        this.onError({
            error,
            source,
            timestamp: new Date().toISOString(),
            context: context ? Object.freeze({ ...context }) : undefined,
        });
    }

    private setState(state: ConnectionState): void {
        this.connectionState = state;
        this.onConnectionStateChange(state);
    }
}
