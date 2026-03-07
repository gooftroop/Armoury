import WebSocket from 'ws';
import { Subject, BehaviorSubject, filter } from 'rxjs';
import type { Observable } from 'rxjs';
import { MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY_MS } from '@clients-matches/config.js';
import type {
    MatchesWsConfig,
    IMatchesRealtimeClient,
    MatchesServerMessage,
    MatchesClientMessage,
    MatchStateMessage,
    MatchUpdatedMessage,
    UpdateMatchFields,
    ConnectionState,
} from '@clients-matches/types.js';

/**
 * Bidirectional WebSocket client for real-time match updates.
 *
 * Uses the `ws` npm package for WebSocket connectivity and `rxjs` for
 * reactive message streams. Supports subscribing to match state changes,
 * sending match updates, and auto-reconnects with exponential backoff + jitter
 * on unexpected disconnections.
 *
 * Authentication is performed by appending the token as a query string parameter
 * on the WebSocket URL: `?token=<value>`.
 */
export class MatchesRealtimeClient implements IMatchesRealtimeClient {
    private readonly wsUrl: string;
    private readonly getToken: () => Promise<string> | string;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private intentionalDisconnect = false;
    private disposed = false;

    private readonly messagesSubject = new Subject<MatchesServerMessage>();
    private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');

    /** Stream of all server-to-client messages. */
    readonly messages$: Observable<MatchesServerMessage> = this.messagesSubject.asObservable();

    /** Stream of the current WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

    /**
     * Creates a new MatchesRealtimeClient instance.
     *
     * @param config - Configuration with WebSocket URL and token provider
     */
    constructor(config: MatchesWsConfig) {
        this.wsUrl = config.wsUrl;
        this.getToken = config.getToken;
    }

    /**
     * Establishes the WebSocket connection with authentication.
     *
     * Appends the token as a query string parameter and opens a WebSocket
     * connection. Incoming messages are parsed as JSON and emitted on the
     * messages$ observable. Auto-reconnects on unexpected disconnections.
     */
    connect(): void {
        if (this.disposed) {
            return;
        }

        this.intentionalDisconnect = false;
        this.connectionStateSubject.next('connecting');
        this.establishConnection();
    }

    /**
     * Cleanly closes the WebSocket connection.
     *
     * Sets the intentional disconnect flag to prevent auto-reconnect.
     */
    disconnect(): void {
        this.intentionalDisconnect = true;
        this.clearReconnectTimer();
        this.closeWebSocket();
        this.connectionStateSubject.next('disconnected');
    }

    /**
     * Subscribes to real-time updates for a specific match.
     *
     * @param matchId - The match ID to subscribe to
     * @throws Error if the WebSocket is not connected
     */
    subscribeMatch(matchId: string): void {
        this.send({ action: 'subscribeMatch', matchId });
    }

    /**
     * Unsubscribes from real-time updates for a specific match.
     *
     * @param matchId - The match ID to unsubscribe from
     * @throws Error if the WebSocket is not connected
     */
    unsubscribeMatch(matchId: string): void {
        this.send({ action: 'unsubscribeMatch', matchId });
    }

    /**
     * Sends a match update to the server via WebSocket.
     *
     * @param matchId - The match ID to update
     * @param data - The fields to update
     * @throws Error if the WebSocket is not connected
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
     * @param matchId - The match ID to filter for
     * @returns Observable emitting only MatchStateMessage for the given match
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
     * @param matchId - The match ID to filter for
     * @returns Observable emitting only MatchUpdatedMessage for the given match
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
    }

    private async establishConnection(): Promise<void> {
        try {
            const token = await this.getToken();
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
                if (!this.intentionalDisconnect && !this.disposed) {
                    this.scheduleReconnect();
                }
            });

            this.ws.on('error', () => {
                // Error events are followed by close events; reconnection is handled there.
            });
        } catch {
            if (!this.intentionalDisconnect && !this.disposed) {
                this.scheduleReconnect();
            }
        }
    }

    private handleMessage(data: WebSocket.Data): void {
        try {
            const parsed: unknown = JSON.parse(data.toString());

            if (this.isValidServerMessage(parsed)) {
                this.messagesSubject.next(parsed);
            }
        } catch {
            // Ignore malformed messages.
        }
    }

    private isValidServerMessage(message: unknown): message is MatchesServerMessage {
        if (typeof message !== 'object' || message === null) {
            return false;
        }

        const msg = message as Record<string, unknown>;

        return msg['action'] === 'matchState' || msg['action'] === 'matchUpdated';
    }

    private send(message: MatchesClientMessage): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }

        this.ws.send(JSON.stringify(message));
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            this.connectionStateSubject.next('disconnected');

            return;
        }

        this.connectionStateSubject.next('reconnecting');
        const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts);
        const jitter = Math.random() * delay * 0.5;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this.establishConnection();
        }, delay + jitter);
    }

    private closeWebSocket(): void {
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

/**
 * Factory function to create a new MatchesRealtimeClient instance.
 *
 * @param config - Configuration with WebSocket URL and token provider
 * @returns A new MatchesRealtimeClient instance
 */
export function createMatchesRealtimeClient(config: MatchesWsConfig): MatchesRealtimeClient {
    return new MatchesRealtimeClient(config);
}
