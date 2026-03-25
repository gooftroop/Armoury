/**
 * Bidirectional WebSocket client for real-time match updates.
 *
 * Extends the shared `WebSocketClient` base from `@armoury/network` to provide
 * matches-domain message validation and RxJS streams while reusing common
 * connection, reconnect, heartbeat, and error lifecycle behavior.
 */

import { WebSocketClient } from '@armoury/network';
import type { ConnectionState, WebSocketClientConfig, WebSocketErrorEvent } from '@armoury/network';
import { BehaviorSubject, Subject, filter } from 'rxjs';
import type { Observable } from 'rxjs';
import {
    BASE_RECONNECT_DELAY_MS,
    HEARTBEAT_TIMEOUT_MS,
    MAX_RECONNECT_ATTEMPTS,
    MAX_RECONNECT_DELAY_MS,
} from '@/config.js';
import type {
    IMatchesRealtimeClient,
    MatchesClientMessage,
    MatchesServerMessage,
    MatchesWsConfig,
    MatchStateMessage,
    MatchUpdatedMessage,
    UpdateMatchFields,
} from '@/types.js';

/**
 * @requirements
 * 1. Must expose the same public realtime API contract as `IMatchesRealtimeClient`.
 * 2. Must delegate websocket lifecycle behavior to `WebSocketClient`.
 * 3. Must validate inbound server messages before emission.
 * 4. Must emit messages, connection state, and errors through RxJS observables.
 * 5. Must keep domain helper streams for `matchState$` and `matchUpdated$`.
 * 6. Must map `MatchesWsConfig` and config constants into `WebSocketClientConfig`.
 * 7. Must dispose base websocket resources and complete all subjects on `dispose()`.
 */

/**
 * Bidirectional WebSocket client for real-time match updates.
 */
export class MatchesRealtimeClient extends WebSocketClient<MatchesServerMessage> implements IMatchesRealtimeClient {
    private readonly messagesSubject = new Subject<MatchesServerMessage>();
    private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
    private readonly errorsSubject = new Subject<WebSocketErrorEvent>();
    /** Stream of all server-to-client messages. */
    readonly messages$: Observable<MatchesServerMessage> = this.messagesSubject.asObservable();
    /** Stream of the current WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();
    /** Stream of structured websocket lifecycle errors. */
    readonly errors$: Observable<WebSocketErrorEvent> = this.errorsSubject.asObservable();

    /**
     * Creates a new `MatchesRealtimeClient`.
     *
     * @param config - Matches websocket URL and token provider.
     */
    constructor(config: MatchesWsConfig) {
        const wsClientConfig: WebSocketClientConfig = {
            wsUrl: config.wsUrl,
            getToken: config.getToken,
            maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
            baseReconnectDelayMs: BASE_RECONNECT_DELAY_MS,
            maxReconnectDelayMs: MAX_RECONNECT_DELAY_MS,
            heartbeatTimeoutMs: HEARTBEAT_TIMEOUT_MS,
        };
        super(wsClientConfig);
    }

    /**
     * Subscribes to real-time updates for a specific match.
     *
     * @param matchId - The match ID to subscribe to.
     */
    subscribeMatch(matchId: string): void {
        const message: MatchesClientMessage = { action: 'subscribeMatch', matchId };
        this.send(message);
    }

    /**
     * Unsubscribes from real-time updates for a specific match.
     *
     * @param matchId - The match ID to unsubscribe from.
     */
    unsubscribeMatch(matchId: string): void {
        const message: MatchesClientMessage = { action: 'unsubscribeMatch', matchId };
        this.send(message);
    }

    /**
     * Sends a match update to the server via WebSocket.
     *
     * @param matchId - The match ID to update.
     * @param data - The fields to update.
     */
    sendMatchUpdate(matchId: string, data: UpdateMatchFields): void {
        const message: MatchesClientMessage = { action: 'updateMatch', matchId, data };
        this.send(message);
    }

    /**
     * Filtered observable for a specific match's state messages.
     *
     * @param matchId - The match ID to filter for.
     * @returns Observable emitting only `matchState` messages for the provided match.
     */
    matchState$(matchId: string): Observable<MatchStateMessage> {
        return this.messages$.pipe(
            filter((msg): msg is MatchStateMessage => msg.action === 'matchState' && msg.matchId === matchId),
        );
    }

    /**
     * Filtered observable for a specific match's update messages.
     *
     * @param matchId - The match ID to filter for.
     * @returns Observable emitting only `matchUpdated` messages for the provided match.
     */
    matchUpdated$(matchId: string): Observable<MatchUpdatedMessage> {
        return this.messages$.pipe(
            filter((msg): msg is MatchUpdatedMessage => msg.action === 'matchUpdated' && msg.matchId === matchId),
        );
    }

    override dispose(): void {
        super.dispose();
        this.messagesSubject.complete();
        this.connectionStateSubject.complete();
        this.errorsSubject.complete();
    }

    protected override validateMessage(parsed: unknown): parsed is MatchesServerMessage {
        if (typeof parsed !== 'object' || parsed === null) {
            return false;
        }

        const message = parsed as Record<string, unknown>;

        return message['action'] === 'matchState' || message['action'] === 'matchUpdated';
    }

    protected override onMessage(message: MatchesServerMessage): void {
        this.messagesSubject.next(message);
    }

    protected override onConnectionStateChange(state: ConnectionState): void {
        this.connectionStateSubject.next(state);
    }

    protected override onError(event: WebSocketErrorEvent): void {
        this.errorsSubject.next(event);
    }
}

/**
 * Factory function to create a new `MatchesRealtimeClient` instance.
 *
 * @param config - Configuration with WebSocket URL and token provider.
 * @returns A new `MatchesRealtimeClient` instance.
 */
export function createMatchesRealtimeClient(config: MatchesWsConfig): MatchesRealtimeClient {
    return new MatchesRealtimeClient(config);
}
