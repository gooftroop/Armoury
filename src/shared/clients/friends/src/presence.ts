/**
 * Friends WebSocket presence client using ws + rxjs.
 *
 * Provides a reactive stream of friend presence events (online/offline)
 * via WebSocket connection to the friends presence service. Includes
 * automatic reconnection with exponential backoff and jitter.
 */

import WebSocket from 'ws';
import { Subject, BehaviorSubject } from 'rxjs';
import type { Observable } from 'rxjs';
import { MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY_MS } from './config.ts';
import type { FriendsPresenceConfig, FriendsServerMessage, ConnectionState } from './types.ts';

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
 * Automatically reconnects with exponential backoff and jitter on
 * unexpected disconnections.
 */
export class FriendsPresenceClient implements IFriendsPresenceClient {
    private readonly wsUrl: string;
    private readonly getToken: () => Promise<string> | string;
    private readonly messagesSubject = new Subject<FriendsServerMessage>();
    private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalClose = false;
    private disposed = false;

    /** Observable stream of typed messages from the friends presence server. */
    readonly messages$: Observable<FriendsServerMessage> = this.messagesSubject.asObservable();

    /** Observable stream of the current WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

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
     * Resolves the authentication token and connects to the WebSocket URL with
     * the token as a query string parameter. Incoming messages are parsed as JSON,
     * validated, and emitted on the messages$ observable. On unexpected disconnection,
     * the client will automatically attempt to reconnect with exponential backoff.
     */
    connect(): void {
        if (this.disposed) {
            return;
        }

        this.intentionalClose = false;
        this.connectionStateSubject.next('connecting');

        const tokenResult = this.getToken();

        if (tokenResult instanceof Promise) {
            tokenResult.then(
                (token) => {
                    this.establishConnection(token);
                },
                () => {
                    this.connectionStateSubject.next('disconnected');
                },
            );
        } else {
            this.establishConnection(tokenResult);
        }
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

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

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
    }

    /**
     * Creates the WebSocket connection and wires up event handlers.
     *
     * @param token - The authentication token to include as a query parameter.
     */
    private establishConnection(token: string): void {
        if (this.disposed) {
            return;
        }

        const url = `${this.wsUrl}?token=${encodeURIComponent(token)}`;

        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
            this.reconnectAttempts = 0;
            this.connectionStateSubject.next('connected');
        });

        this.ws.on('message', (data: WebSocket.Data) => {
            this.handleMessage(data);
        });

        this.ws.on('close', () => {
            this.ws = null;

            if (!this.intentionalClose && !this.disposed) {
                this.scheduleReconnect();
            } else {
                this.connectionStateSubject.next('disconnected');
            }
        });

        this.ws.on('error', () => {
            // Error is followed by a close event, so reconnection is handled there.
            // We do not emit errors on the messages$ stream.
        });
    }

    /**
     * Parses an incoming WebSocket message, validates its action field,
     * and emits the typed message on the messages$ subject.
     *
     * @param data - The raw WebSocket message data.
     */
    private handleMessage(data: WebSocket.Data): void {
        try {
            const text = typeof data === 'string' ? data : data.toString();
            const parsed: unknown = JSON.parse(text);

            if (!this.isValidServerMessage(parsed)) {
                return;
            }

            this.messagesSubject.next(parsed);
        } catch {
            // Silently ignore malformed messages
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
     * Schedules a reconnection attempt with exponential backoff and jitter.
     *
     * If the maximum number of reconnection attempts has been reached,
     * transitions to 'disconnected' state and stops retrying.
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            this.connectionStateSubject.next('disconnected');

            return;
        }

        this.connectionStateSubject.next('reconnecting');

        // Exponential backoff: BASE_RECONNECT_DELAY_MS * 2^attempt
        const baseDelay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts);

        // Add jitter: random value between 0 and half the base delay
        const jitter = Math.random() * baseDelay * 0.5;
        const delay = baseDelay + jitter;

        this.reconnectAttempts++;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    /** Clears any pending reconnection timer. */
    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
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
