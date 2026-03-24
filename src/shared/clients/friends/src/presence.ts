/**
 * Friends WebSocket presence client using ws + rxjs.
 *
 * Provides a reactive stream of friend presence events (online/offline)
 * via WebSocket connection to the friends presence service. Includes
 * automatic reconnection with capped exponential backoff and jitter,
 * heartbeat-based dead connection detection via ping/pong, and proper
 * listener cleanup to prevent memory leaks.
 */

import WebSocket from 'ws';
import { Subject, BehaviorSubject } from 'rxjs';
import type { Observable } from 'rxjs';
import {
    MAX_RECONNECT_ATTEMPTS,
    BASE_RECONNECT_DELAY_MS,
    MAX_RECONNECT_DELAY_MS,
    HEARTBEAT_TIMEOUT_MS,
} from '@/config.js';
import type {
    FriendsPresenceConfig,
    FriendsServerMessage,
    ConnectionState,
    WebSocketErrorEvent,
    WebSocketErrorSource,
} from '@/types.js';
import type { ClientRequest, IncomingMessage } from 'http';

/**
 * Interface for the friends WebSocket presence client.
 *
 * Defines the public contract for connecting to the friends presence service
 * and receiving friend online/offline events as reactive streams.
 */
export interface IFriendsPresenceClient {
    /** Observable stream of typed messages from the friends presence server. */
    readonly messages$: Observable<FriendsServerMessage>;

    /** Observable stream of the current WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState>;

    /**
     * Observable stream of structured error events from the WebSocket lifecycle.
     *
     * Every error — connection failures, handshake rejections, message parse
     * failures, and token resolution errors — is emitted here with a `source`
     * field identifying the originating event. Consumers can subscribe once and
     * route all errors to Sentry or a logging backend.
     */
    readonly errors$: Observable<WebSocketErrorEvent>;

    /**
     * Establishes a WebSocket connection to the presence service.
     * Authentication is provided via a token query string parameter.
     */
    connect(): void;

    /**
     * Cleanly closes the WebSocket connection.
     * Does not complete the observable streams, allowing reconnection.
     */
    disconnect(): void;

    /**
     * Disposes of all resources: completes all subjects, closes the connection,
     * and cleans up internal state. The client cannot be reused after disposal.
     */
    dispose(): void;
}

/**
 * Friends WebSocket presence client implementation.
 *
 * Connects to the friends presence service via WebSocket and emits typed
 * presence events (friendOnline, friendOffline) as rxjs observables.
 * Automatically reconnects with capped exponential backoff and jitter on
 * unexpected disconnections. Uses server ping/pong heartbeat to detect
 * and terminate dead connections.
 */
export class FriendsPresenceClient implements IFriendsPresenceClient {
    private readonly wsUrl: string;
    private readonly getToken: () => Promise<string> | string;
    private readonly messagesSubject = new Subject<FriendsServerMessage>();
    private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
    private readonly errorsSubject = new Subject<WebSocketErrorEvent>();
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalClose = false;
    private disposed = false;

    /**
     * The last error received from the WebSocket connection.
     *
     * Captured in the error handler and available for logging in the close
     * handler that immediately follows. Reset on each new connection attempt.
     */
    private lastError: Error | null = null;

    /** Observable stream of typed messages from the friends presence server. */
    readonly messages$: Observable<FriendsServerMessage> = this.messagesSubject.asObservable();

    /** Observable stream of the current WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

    /**
     * Observable stream of structured error events from the WebSocket lifecycle.
     *
     * Every error — connection failures, handshake rejections, message parse
     * failures, and token resolution errors — is emitted here with a `source`
     * field identifying the originating event.
     */
    readonly errors$: Observable<WebSocketErrorEvent> = this.errorsSubject.asObservable();

    /**
     * Creates a new FriendsPresenceClient instance.
     *
     * @param config - Configuration containing the WebSocket URL and token provider.
     */
    constructor(config: FriendsPresenceConfig) {
        this.wsUrl = config.wsUrl;
        this.getToken = config.getToken;
    }

    /**
     * Establishes a WebSocket connection to the presence service.
     *
     * Resolves the authentication token (sync or async) and connects to the
     * WebSocket URL with the token as a query string parameter. Incoming messages
     * are parsed as JSON, validated, and emitted on the messages$ observable.
     * On unexpected disconnection, the client will automatically attempt to
     * reconnect with capped exponential backoff.
     */
    connect(): void {
        if (this.disposed) {
            return;
        }

        this.intentionalClose = false;
        this.connectionStateSubject.next('connecting');
        void this.resolveTokenAndConnect();
    }

    /**
     * Cleanly closes the WebSocket connection.
     *
     * Marks the close as intentional so no reconnection is attempted.
     * Does not complete the observable streams, allowing future reconnection
     * via connect().
     */
    disconnect(): void {
        this.intentionalClose = true;
        this.clearReconnectTimer();
        this.reconnectAttempts = 0;
        this.cleanupWebSocket();
        this.connectionStateSubject.next('disconnected');
    }

    /**
     * Disposes of all resources held by this client.
     *
     * Completes all rxjs subjects, closes the WebSocket connection, and marks
     * the client as disposed. The client cannot be reused after calling dispose().
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
     * be disposed or intentionally closed while awaiting the token.
     */
    private async resolveTokenAndConnect(): Promise<void> {
        try {
            const token = await Promise.resolve(this.getToken());

            if (this.disposed || this.intentionalClose) {
                return;
            }

            this.establishConnection(token);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitError(err, 'ws:token-resolve');
            this.connectionStateSubject.next('disconnected');
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

            if (!this.intentionalClose && !this.disposed) {
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
            const text = typeof data === 'string' ? data : data.toString();
            const parsed: unknown = JSON.parse(text);

            if (!this.isValidServerMessage(parsed)) {
                return;
            }

            this.messagesSubject.next(parsed);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitError(err, 'ws:message-parse');
        }
    }

    /**
     * Validates that a parsed message has a recognized action field.
     *
     * @param message - The parsed JSON message to validate.
     * @returns True if the message is a valid FriendsServerMessage.
     */
    private isValidServerMessage(message: unknown): message is FriendsServerMessage {
        if (typeof message !== 'object' || message === null) {
            return false;
        }

        const msg = message as Record<string, unknown>;

        return msg['action'] === 'friendOnline' || msg['action'] === 'friendOffline';
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
}

/**
 * Factory function to create a new FriendsPresenceClient instance.
 *
 * Provides a convenient way to instantiate a FriendsPresenceClient with the
 * required configuration. This is the recommended way to create presence clients
 * instead of calling the constructor directly.
 *
 * @param config - Configuration containing the WebSocket URL and token provider.
 * @returns A new FriendsPresenceClient instance configured with the provided options.
 */
export function createFriendsPresenceClient(config: FriendsPresenceConfig): FriendsPresenceClient {
    return new FriendsPresenceClient(config);
}
