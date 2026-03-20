/**
 * Friends WebSocket presence client using a cross-runtime WebSocket abstraction.
 *
 * Provides a reactive stream of friend presence events (online/offline)
 * via WebSocket connection to the friends presence service. Includes
 * automatic reconnection with exponential backoff and jitter.
 */

import { Subject, BehaviorSubject } from 'rxjs';
import type { Observable } from 'rxjs';
import { MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY_MS } from '@/config.js';
import type { FriendsPresenceConfig, FriendsServerMessage, ConnectionState } from '@/types.js';

/** Numeric WebSocket readyState for OPEN in both browser and ws runtimes. */
const SOCKET_OPEN_STATE = 1;

/**
 * WebSocket-like contract used by this client in both browser and Node.js.
 */
interface PresenceSocket {
    /** Current connection ready state. */
    readonly readyState: number;
    /** Sends text payload to the server. */
    send(data: string): void;
    /** Closes the underlying socket. */
    close(): void;
    /** Adds an event listener (browser-style API). */
    addEventListener?: (type: 'open' | 'message' | 'close' | 'error', listener: (event: unknown) => void) => void;
    /** Removes an event listener (browser-style API). */
    removeEventListener?: (type: 'open' | 'message' | 'close' | 'error', listener: (event: unknown) => void) => void;
    /** Registers an event handler (Node ws EventEmitter API). */
    on?: (type: 'open' | 'message' | 'close' | 'error', listener: (event: unknown) => void) => void;
}

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

    /** Observable stream of errors encountered by the client (socket errors, message parse failures, etc.). */
    readonly errors$: Observable<{ error: unknown; context?: Record<string, unknown> }>;

    /** Sends a JSON message to the server via the WebSocket connection. */
    send(message: Record<string, unknown>): void;

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
    private readonly errorsSubject = new Subject<{ error: unknown; context?: Record<string, unknown> }>();
    private readonly messagesSubject = new Subject<FriendsServerMessage>();
    private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
    private ws: PresenceSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalClose = false;
    private disposed = false;

    /** Observable stream of typed messages from the friends presence server. */
    readonly messages$: Observable<FriendsServerMessage> = this.messagesSubject.asObservable();

    /** Observable stream of the current WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

    /** Observable stream of errors encountered by the client (socket errors, message parse failures, etc.). */
    readonly errors$: Observable<{ error: unknown; context?: Record<string, unknown> }> =
        this.errorsSubject.asObservable();

    /**
     * Sends a JSON payload to the presence service when the socket is connected.
     *
     * @param message - JSON-serializable message payload to send.
     */
    send(message: Record<string, unknown>): void {
        if (this.ws && this.ws.readyState === SOCKET_OPEN_STATE) {
            this.ws.send(JSON.stringify(message));
        }
    }

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
                    void this.establishConnection(token);
                },
                () => {
                    this.connectionStateSubject.next('disconnected');
                },
            );
        } else {
            void this.establishConnection(tokenResult);
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
        this.errorsSubject.complete();
    }

    /**
     * Creates the WebSocket connection and wires up event handlers.
     *
     * @param token - The authentication token to include as a query parameter.
     */
    private async establishConnection(token: string): Promise<void> {
        if (this.disposed) {
            return;
        }

        const url = `${this.wsUrl}?token=${encodeURIComponent(token)}`;

        try {
            const ws = await this.createSocket(url);

            if (this.disposed || this.intentionalClose) {
                ws.close();

                return;
            }

            this.ws = ws;
        } catch (error) {
            this.errorsSubject.next({ error, context: { operation: 'establishConnection' } });
            this.connectionStateSubject.next('disconnected');

            return;
        }

        this.addSocketListener(this.ws, 'open', () => {
            this.reconnectAttempts = 0;
            this.connectionStateSubject.next('connected');
        });

        this.addSocketListener(this.ws, 'message', (payload) => {
            const data = this.getMessagePayload(payload);

            this.handleMessage(data);
        });

        this.addSocketListener(this.ws, 'close', () => {
            this.ws = null;

            if (!this.intentionalClose && !this.disposed) {
                this.scheduleReconnect();
            } else {
                this.connectionStateSubject.next('disconnected');
            }
        });

        this.addSocketListener(this.ws, 'error', (error) => {
            this.errorsSubject.next({ error, context: { operation: 'socketError' } });
            // Error is followed by a close event, so reconnection is handled there.
            // We do not emit errors on the messages$ stream.
        });
    }

    /**
     * Creates a WebSocket instance for the active runtime.
     *
     * Uses the native WebSocket in browser environments and lazily imports
     * the `ws` package in Node.js environments.
     *
     * @param url - Fully qualified WebSocket URL.
     * @returns A socket instance implementing the PresenceSocket contract.
     */
    private async createSocket(url: string): Promise<PresenceSocket> {
        if (typeof globalThis.WebSocket !== 'undefined') {
            return new globalThis.WebSocket(url) as unknown as PresenceSocket;
        }

        const wsModule = await import('ws');

        return new wsModule.default(url) as unknown as PresenceSocket;
    }

    /**
     * Registers an event listener on either browser-style or ws-style APIs.
     *
     * @param ws - Socket instance to register on.
     * @param event - Event name.
     * @param handler - Event handler callback.
     */
    private addSocketListener(
        ws: PresenceSocket,
        event: 'open' | 'message' | 'close' | 'error',
        handler: (event: unknown) => void,
    ): void {
        if (typeof ws.addEventListener === 'function') {
            ws.addEventListener(event, handler);

            return;
        }

        if (typeof ws.on === 'function') {
            ws.on(event, handler);
        }
    }

    /**
     * Extracts message payload from browser MessageEvent or ws raw callback value.
     *
     * @param payload - Message callback payload.
     * @returns Raw message body to decode.
     */
    private getMessagePayload(payload: unknown): unknown {
        if (typeof payload === 'object' && payload !== null && 'data' in payload) {
            return (payload as { data: unknown }).data;
        }

        return payload;
    }

    /**
     * Parses an incoming WebSocket message, validates its action field,
     * and emits the typed message on the messages$ subject.
     *
     * @param data - The raw WebSocket message data.
     */
    private handleMessage(data: unknown): void {
        try {
            const text = this.toMessageText(data);

            if (text === null) {
                return;
            }

            const parsed: unknown = JSON.parse(text);

            if (!this.isValidServerMessage(parsed)) {
                return;
            }

            this.messagesSubject.next(parsed);
        } catch (error) {
            this.errorsSubject.next({ error, context: { operation: 'handleMessage' } });
            // Silently ignore malformed messages
        }
    }

    /**
     * Converts runtime-specific WebSocket message data to text.
     *
     * @param data - Raw message data from browser or ws callbacks.
     * @returns UTF-8 text payload, or null when data cannot be decoded.
     */
    private toMessageText(data: unknown): string | null {
        if (typeof data === 'string') {
            return data;
        }

        if (data instanceof ArrayBuffer) {
            return new TextDecoder().decode(new Uint8Array(data));
        }

        if (ArrayBuffer.isView(data)) {
            return new TextDecoder().decode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        }

        if (typeof data === 'object' && data !== null && 'toString' in data) {
            return data.toString();
        }

        return null;
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
            this.errorsSubject.next({
                error: new Error('Max reconnection attempts reached'),
                context: { operation: 'scheduleReconnect' },
            });
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
