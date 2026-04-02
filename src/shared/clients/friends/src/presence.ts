import { BehaviorSubject, Subject } from 'rxjs';
import type { Observable } from 'rxjs';
import { WebSocketClient } from '@armoury/network';
import type { ConnectionState, WebSocketClientConfig, WebSocketErrorEvent } from '@armoury/network';
import {
    BASE_RECONNECT_DELAY_MS,
    HEARTBEAT_TIMEOUT_MS,
    MAX_RECONNECT_ATTEMPTS,
    MAX_RECONNECT_DELAY_MS,
} from '@/config.js';
import type { FriendsPresenceConfig, FriendsServerMessage } from '@/types.js';

/** Friends WebSocket presence client based on @armoury/network. */

/**
 * @requirements
 * 1. Must preserve the IFriendsPresenceClient public API consumed by @armoury/streams.
 * 2. Must emit typed server messages through messages$.
 * 3. Must emit WebSocket lifecycle state transitions through connectionState$.
 * 4. Must emit structured WebSocket errors through errors$.
 * 5. Must delegate connect/disconnect/reconnect/heartbeat logic to WebSocketClient.
 * 6. Must validate inbound messages before emission.
 * 7. Must map FriendsPresenceConfig and package constants to WebSocketClientConfig.
 * 8. Must dispose resources by invoking base disposal and completing rxjs subjects.
 */

/** Public contract for the friends WebSocket presence client. */
export interface IFriendsPresenceClient {
    /** Typed messages emitted by the friends presence server. */
    readonly messages$: Observable<FriendsServerMessage>;

    /** Current WebSocket lifecycle state stream. */
    readonly connectionState$: Observable<ConnectionState>;

    /** Structured WebSocket lifecycle error stream. */
    readonly errors$: Observable<WebSocketErrorEvent>;

    /** Establishes a WebSocket connection to the presence service. */
    connect(): void;

    /** Cleanly closes the WebSocket connection without completing streams. */
    disconnect(): void;

    /** Disposes all resources and completes all observable streams. */
    dispose(): void;
}

/** Friends presence client that adapts WebSocketClient callbacks to rxjs streams. */
export class FriendsPresenceClient extends WebSocketClient<FriendsServerMessage> implements IFriendsPresenceClient {
    private readonly messagesSubject = new Subject<FriendsServerMessage>();
    private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');
    private readonly errorsSubject = new Subject<WebSocketErrorEvent>();

    /** Typed messages emitted by the friends presence server. */
    readonly messages$: Observable<FriendsServerMessage> = this.messagesSubject.asObservable();

    /** Current WebSocket lifecycle state stream. */
    readonly connectionState$: Observable<ConnectionState> = this.connectionStateSubject.asObservable();

    /** Structured WebSocket lifecycle error stream. */
    readonly errors$: Observable<WebSocketErrorEvent> = this.errorsSubject.asObservable();

    /** Creates a FriendsPresenceClient from friends presence configuration. */
    constructor(config: FriendsPresenceConfig) {
        const clientConfig: WebSocketClientConfig = {
            wsUrl: config.wsUrl,
            getToken: config.getToken,
            maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
            baseReconnectDelayMs: BASE_RECONNECT_DELAY_MS,
            maxReconnectDelayMs: MAX_RECONNECT_DELAY_MS,
            heartbeatTimeoutMs: HEARTBEAT_TIMEOUT_MS,
        };

        super(clientConfig);
    }

    protected override validateMessage(parsed: unknown): parsed is FriendsServerMessage {
        if (typeof parsed !== 'object' || parsed === null) {
            return false;
        }

        const message = parsed as Record<string, unknown>;

        return message['action'] === 'friendOnline' || message['action'] === 'friendOffline';
    }

    protected override onMessage(message: FriendsServerMessage): void {
        this.messagesSubject.next(message);
    }

    protected override onConnectionStateChange(state: ConnectionState): void {
        this.connectionStateSubject.next(state);
    }

    protected override onError(event: WebSocketErrorEvent): void {
        this.errorsSubject.next(event);
    }

    override dispose(): void {
        super.dispose();
        this.messagesSubject.complete();
        this.connectionStateSubject.complete();
        this.errorsSubject.complete();
    }
}

/** Creates a new friends presence client instance. */
export function createFriendsPresenceClient(config: FriendsPresenceConfig): FriendsPresenceClient {
    return new FriendsPresenceClient(config);
}
