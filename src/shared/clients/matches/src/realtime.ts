/**
 * Bidirectional WebSocket client for real-time match updates.
 *
 * Uses the `ws` npm package for WebSocket connectivity and `rxjs` for
 * reactive message streams. Supports subscribing to match state changes,
 * sending match updates, and auto-reconnects with capped exponential
 * backoff + jitter on unexpected disconnections. Uses server ping/pong
 * heartbeat to detect and terminate dead connections.
 *
 * Authentication is performed by appending the token as a query string parameter
 * on the WebSocket URL: `?token=<value>`.
 */

import WebSocket from 'ws';
import type { ClientRequest, IncomingMessage } from 'http';
import { Subject, BehaviorSubject, filter } from 'rxjs';
import type { Observable } from 'rxjs';
import {
    MAX_RECONNECT_ATTEMPTS,
    BASE_RECONNECT_DELAY_MS,
    MAX_RECONNECT_DELAY_MS,
    HEARTBEAT_TIMEOUT_MS,
} from '@clients-matches/config.js';
import type {
    MatchesWsConfig,
    IMatchesRealtimeClient,
    MatchesServerMessage,
    MatchesClientMessage,
    MatchStateMessage,
    MatchUpdatedMessage,
    UpdateMatchFields,
    ConnectionState,
    WebSocketErrorEvent,
    WebSocketErrorSource,
} from '@clients-matches/types.js';

/**
 * Bidirectional WebSocket client for real-time match updates.
 *
 * Connects to the matches real-time service via WebSocket and provides
 * reactive streams for match state and update events. Supports subscribing
 * to individual matches, sending updates, and auto-reconnects with capped
 * exponential backoff and jitter. Uses server ping/pong heartbeat to detect
 * and terminate dead connections.
 */
export class MatchesRealtimeClient implements IMatchesRealtimeClient {
    private readonly wsUrl: string;
    private readonly getToken: () => Promise<string> | string;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalDisconnect = false;
    private disposed = false;

    /**
     * The last error received from the WebSocket connection.
     *
     * Captured in the error handler and available for logging in the close
     * handler that immediately follows. Reset on each new connection attempt.
     */
    private lastError: Error | null = null;

    private readonly messagesSubject = new Subject<MatchesServerMessage>();
    private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
    private readonly errorsSubject = new Subject<WebSocketErrorEvent>();

    /** Stream of all server-to-client messages. */
    readonly messages$: Observable<MatchesServerMessage> = this.messagesSubject.asObservable();

    /** Stream of the current WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

    /**
     * Observable stream of structured error events from the WebSocket lifecycle.
     *
     * Every error — connection failures, handshake rejections, message parse
     * failures, token resolution errors, and send failures — is emitted here
     * with a `source` field identifying the originating event.
     */
    readonly errors$: Observable<WebSocketErrorEvent> = this.errorsSubject.asObservable();

    /**
     * Creates a new MatchesRealtimeClient instance.
     *
     * @param config - Configuration with WebSocket URL and token provider.
     */
    constructor(config: MatchesWsConfig) {
        this.wsUrl = config.wsUrl;
        this.getToken = config.getToken;
    }

    /**
     * Establishes the WebSocket connection with authentication.
     *
     * Resolves the authentication token (sync or async) and opens a WebSocket
     * connection. Incoming messages are parsed as JSON and emitted on the
     * messages$ observable. Auto-reconnects on unexpected disconnections with
     * capped exponential backoff.
     */
    connect(): void {
        if (this.disposed) {
            return;
        }

        this.intentionalDisconnect = false;
        this.connectionStateSubject.next('connecting');
        void this.resolveTokenAndConnect();
    }

    /**
     * Cleanly closes the WebSocket connection.
     *
     * Sets the intentional disconnect flag to prevent auto-reconnect.
     */
    disconnect(): void {
        this.intentionalDisconnect = true;
        this.clearReconnectTimer();
        this.reconnectAttempts = 0;
        this.cleanupWebSocket();
        this.connectionStateSubject.next('disconnected');
    }

    /**
     * Subscribes to real-time updates for a specific match.
     *
     * @param matchId - The match ID to subscribe to.
     * @throws Error if the WebSocket is not connected.
     */
    subscribeMatch(matchId: string): void {
        this.send({ action: 'subscribeMatch', matchId });
    }

    /**
     * Unsubscribes from real-time updates for a specific match.
     *
     * @param matchId - The match ID to unsubscribe from.
     * @throws Error if the WebSocket is not connected.
     */
    unsubscribeMatch(matchId: string): void {
        this.send({ action: 'unsubscribeMatch', matchId });
    }

    /**
     * Sends a match update to the server via WebSocket.
     *
     * @param matchId - The match ID to update.
     * @param data - The fields to update.
     * @throws Error if the WebSocket is not connected.
     */
    sendMatchUpdate(matchId: string, data: UpdateMatchFields): void {
        this.send({ action: 'updateMatch', matchId, data });
    }

    /**
     * Filtered observable for a specific match's state messages.
     *
     * Emits only MatchStateMessage events for the given match ID. These messages
     * are sent by the server upon subscribing to a match.
     *
     * @param matchId - The match ID to filter for.
     * @returns Observable emitting only MatchStateMessage for the given match.
     */
    matchState$(matchId: string): Observable<MatchStateMessage> {
        return this.messages$.pipe(
            filter((msg): msg is MatchStateMessage => msg.action === 'matchState' && msg.matchId === matchId),
        );
    }

    /**
     * Filtered observable for a specific match's update messages.
     *
     * Emits only MatchUpdatedMessage events for the given match ID. These messages
     * are broadcast by the server when another client updates the match.
     *
     * @param matchId - The match ID to filter for.
     * @returns Observable emitting only MatchUpdatedMessage for the given match.
     */
    matchUpdated$(matchId: string): Observable<MatchUpdatedMessage> {
        return this.messages$.pipe(
            filter((msg): msg is MatchUpdatedMessage => msg.action === 'matchUpdated' && msg.matchId === matchId),
        );
    }

    /**
     * Completes all subjects, closes connection, and cleans up resources.
     *
     * After calling dispose, the client cannot be reconnected.
     */
    dispose(): void {
        this.disposed = true;
        this.disconnect();
        this.messagesSubject.complete();
        this.connectionStateSubject.complete();
        this.errorsSubject.complete();
    }

    /**
     * Resolves the authentication token and initiates the WebSocket connection.
     *
     * Handles both synchronous and asynchronous token providers uniformly via
     * Promise.resolve(). Guards against race conditions where the client may
     * be disposed or intentionally disconnected while awaiting the token.
     */
    private async resolveTokenAndConnect(): Promise<void> {
        try {
            const token = await Promise.resolve(this.getToken());

            if (this.disposed || this.intentionalDisconnect) {
                return;
            }

            this.establishConnection(token);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitError(err, 'ws:token-resolve');

            if (!this.intentionalDisconnect && !this.disposed) {
                this.scheduleReconnect();
            }
        }
    }

    /**
     * Creates the WebSocket connection and wires up event handlers.
     *
     * Cleans up any existing connection before creating a new one to prevent
     * listener accumulation. Registers heartbeat monitoring via server ping
     * events to detect and terminate dead connections.
     *
     * @param token - The authentication token to include as a query parameter.
     */
    private establishConnection(token: string): void {
        if (this.disposed) {
            return;
        }

        this.cleanupWebSocket();
        this.lastError = null;

        const url = `${this.wsUrl}?token=${encodeURIComponent(token)}`;

        this.ws = new WebSocket(url);

        this.ws.on('error', (error: Error) => {
            this.lastError = error;
            this.emitError(error, 'ws:error');
            // Close event follows automatically; reconnection handled there.
        });

        this.ws.on('open', () => {
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.connectionStateSubject.next('connected');
        });

        this.ws.on('message', (data: WebSocket.RawData, _isBinary: boolean) => {
            this.handleMessage(data);
        });

        this.ws.on('ping', () => {
            this.startHeartbeat();
        });

        this.ws.on('close', (_code: number, _reason: Buffer) => {
            this.clearHeartbeat();
            const errorBeforeClose = this.lastError;
            this.lastError = null;
            this.ws = null;

            if (!this.intentionalDisconnect && !this.disposed) {
                this.scheduleReconnect(errorBeforeClose);
            } else {
                this.connectionStateSubject.next('disconnected');
            }
        });

        this.ws.on('unexpected-response', (_req: ClientRequest, res: IncomingMessage) => {
            const statusCode = res.statusCode ?? 0;
            const statusMessage = res.statusMessage ?? '';
            const error = new Error(`WebSocket handshake failed: HTTP ${String(statusCode)} ${statusMessage}`.trim());

            this.lastError = error;
            this.emitError(error, 'ws:unexpected-response', { statusCode, statusMessage });

            if (statusCode === 401 || statusCode === 403) {
                this.connectionStateSubject.next('disconnected');
                this.ws?.terminate();
            }
            // Other status codes: close event follows and triggers reconnect.
        });

        this.ws.on('upgrade', (_request: IncomingMessage) => {
            // Reserved for future debug logging.
        });
    }

    /**
     * Parses an incoming WebSocket message, validates its action field,
     * and emits the typed message on the messages$ subject.
     *
     * @param data - The raw WebSocket message data.
     */
    private handleMessage(data: WebSocket.RawData): void {
        try {
            const parsed: unknown = JSON.parse(data.toString());

            if (this.isValidServerMessage(parsed)) {
                this.messagesSubject.next(parsed);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitError(err, 'ws:message-parse');
        }
    }

    /**
     * Validates that a parsed message has a recognized action field.
     *
     * @param message - The parsed JSON message to validate.
     * @returns True if the message is a valid MatchesServerMessage.
     */
    private isValidServerMessage(message: unknown): message is MatchesServerMessage {
        if (typeof message !== 'object' || message === null) {
            return false;
        }

        const msg = message as Record<string, unknown>;

        return msg['action'] === 'matchState' || msg['action'] === 'matchUpdated';
    }

    /**
     * Sends a message to the server via the open WebSocket connection.
     *
     * @param message - The client message to send.
     * @throws Error if the WebSocket is not connected.
     */
    private send(message: MatchesClientMessage): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            const error = new Error('WebSocket is not connected');
            this.emitError(error, 'ws:send');
            throw error;
        }

        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitError(err, 'ws:send');
            throw err;
        }
    }

    /**
     * Emits a structured error event on the errors$ observable.
     *
     * @param error - The underlying error instance.
     * @param source - Which WebSocket lifecycle event produced this error.
     * @param context - Optional contextual data (e.g. HTTP status code).
     */
    private emitError(error: Error, source: WebSocketErrorSource, context?: Record<string, unknown>): void {
        this.errorsSubject.next({
            error,
            source,
            timestamp: new Date().toISOString(),
            context: context ? Object.freeze({ ...context }) : undefined,
        });
    }

    /**
     * Schedules a reconnection attempt with capped exponential backoff and jitter.
     *
     * The delay is calculated as BASE_RECONNECT_DELAY_MS * 2^attempt, capped at
     * MAX_RECONNECT_DELAY_MS. Jitter of up to 50% of the base delay is added to
     * prevent thundering herd on server restart. The attempt counter is incremented
     * before scheduling so backoff escalates correctly across retries.
     *
     * @param _causingError - The error that triggered the close, if any. Reserved for
     *   future logging integration.
     * If the maximum number of reconnection attempts has been reached,
     * transitions to 'disconnected' state and stops retrying.
     */
    private scheduleReconnect(_causingError?: Error | null): void {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            this.connectionStateSubject.next('disconnected');

            return;
        }

        this.connectionStateSubject.next('reconnecting');

        const baseDelay = Math.min(
            BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
            MAX_RECONNECT_DELAY_MS,
        );
        const jitter = Math.random() * baseDelay * 0.5;

        this.reconnectAttempts++;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, baseDelay + jitter);
    }

    /**
     * Tears down the current WebSocket connection and cleans up all associated
     * resources.
     *
     * Clears the heartbeat timer, removes all event listeners to prevent memory
     * leaks, and terminates the underlying socket. Must be called before creating
     * a new WebSocket instance to avoid listener accumulation across reconnects.
     */
    private cleanupWebSocket(): void {
        this.clearHeartbeat();

        if (this.ws) {
            this.ws.removeAllListeners();

            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.terminate();
            }

            this.ws = null;
        }
    }

    /** Clears any pending reconnection timer. */
    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Starts or resets the heartbeat timer.
     *
     * Called on connection open and on each server ping. If the server does not
     * send a ping within HEARTBEAT_TIMEOUT_MS, the connection is considered dead
     * and is terminated immediately. This follows the ws library's recommended
     * pattern for detecting broken connections on the client side.
     */
    private startHeartbeat(): void {
        this.clearHeartbeat();
        this.heartbeatTimer = setTimeout(() => {
            this.ws?.terminate();
        }, HEARTBEAT_TIMEOUT_MS);
    }

    /** Clears the heartbeat timeout timer. */
    private clearHeartbeat(): void {
        if (this.heartbeatTimer !== null) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
}

/**
 * Factory function to create a new MatchesRealtimeClient instance.
 *
 * @param config - Configuration with WebSocket URL and token provider.
 * @returns A new MatchesRealtimeClient instance.
 */
export function createMatchesRealtimeClient(config: MatchesWsConfig): MatchesRealtimeClient {
    return new MatchesRealtimeClient(config);
}
