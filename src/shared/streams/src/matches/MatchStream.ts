/**
 * Reactive stream facade for real-time match data.
 *
 * Wraps an {@link IMatchesRealtimeClient} and maintains a live, observable
 * cache of match state using RxJS BehaviorSubjects. Consumers observe
 * match state changes via typed Observables and delegate write operations
 * (subscribe, unsubscribe, update) through the stream to the underlying
 * WebSocket client.
 *
 * This module owns no transport concerns — it never calls connect/disconnect
 * on the client. Connection lifecycle is the consumer's responsibility.
 *
 * @module @armoury/streams/matches/MatchStream
 */

import { BehaviorSubject, map, distinctUntilChanged, type Observable, type Subscription } from 'rxjs';
import type {
    IMatchesRealtimeClient,
    Match,
    UpdateMatchFields,
    MatchesServerMessage,
    ConnectionState,
} from '@armoury/clients-matches';
import type { IMatchStream } from '@streams/types.js';

/**
 * @requirements
 * 1. Must accept an IMatchesRealtimeClient as a constructor dependency.
 * 2. Must subscribe to the client's messages$ on construction and update internal state.
 * 3. Must maintain a BehaviorSubject<ReadonlyMap<string, Match>> for tracked matches.
 * 4. Must set/replace match entries on 'matchState' messages (full state from server on subscribe).
 * 5. Must set/replace match entries on 'matchUpdated' messages (broadcast when another client updates).
 * 6. Must expose matches$ as a read-only Observable of the current map.
 * 7. Must expose match$(matchId) that emits Match | undefined for a specific match via distinctUntilChanged.
 * 8. Must expose connectionState$ proxied from the underlying client's connectionState$.
 * 9. Must delegate subscribeMatch(matchId) to the underlying client's subscribeMatch method.
 * 10. Must delegate unsubscribeMatch(matchId) to the underlying client and remove the match from the local cache.
 * 11. Must delegate sendMatchUpdate(matchId, data) to the underlying client's sendMatchUpdate method.
 * 12. Must unsubscribe from client messages$ and complete all subjects on dispose().
 * 13. Must be idempotent on dispose — calling dispose() twice must not throw.
 * 14. Must NOT call connect/disconnect on the client — lifecycle is the consumer's responsibility.
 */

/**
 * Reactive facade for real-time match data.
 *
 * Maintains a live cache of match state derived from WebSocket messages
 * received through an {@link IMatchesRealtimeClient}. Provides typed
 * Observables for reading match state and delegate methods for writing
 * match subscriptions and updates.
 *
 * @example
 * ```ts
 * const stream = createMatchStream(realtimeClient);
 * stream.matches$.subscribe(matches => console.log(matches.size));
 * stream.subscribeMatch('match-1');
 * // Later...
 * stream.dispose();
 * ```
 */
export class MatchStream implements IMatchStream {
    /** Internal BehaviorSubject holding the current match cache. */
    private readonly matchesSubject: BehaviorSubject<ReadonlyMap<string, Match>>;

    /** Subscription to the client's messages$ observable. */
    private readonly messagesSubscription: Subscription;

    /** Reference to the underlying WebSocket client for delegation. */
    private readonly client: IMatchesRealtimeClient;

    /** Flag to prevent double-disposal errors. */
    private disposed = false;

    /** Observable map of all tracked matches, keyed by match ID. */
    readonly matches$: Observable<ReadonlyMap<string, Match>>;

    /** Observable of the underlying WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState>;

    /**
     * Creates a new MatchStream.
     *
     * Subscribes to the client's messages$ immediately and begins updating
     * internal state for matchState and matchUpdated messages. The client
     * must already be connected or will be connected by the consumer — this
     * class does not manage connection lifecycle.
     *
     * @param client - The real-time WebSocket client to wrap.
     */
    constructor(client: IMatchesRealtimeClient) {
        this.client = client;
        this.matchesSubject = new BehaviorSubject<ReadonlyMap<string, Match>>(new Map());
        this.matches$ = this.matchesSubject.asObservable();
        this.connectionState$ = this.client.connectionState$;

        this.messagesSubscription = this.client.messages$.subscribe((msg: MatchesServerMessage) => {
            this.handleMessage(msg);
        });
    }

    /**
     * Observable of a specific match's state.
     *
     * Emits the full {@link Match} whenever it is updated, or `undefined` if
     * the match is not currently tracked. Uses `distinctUntilChanged` to
     * suppress duplicate emissions when other matches change.
     *
     * @param matchId - The match ID to observe.
     * @returns Observable emitting the match or undefined.
     */
    match$(matchId: string): Observable<Match | undefined> {
        return this.matchesSubject.pipe(
            map((m) => m.get(matchId)),
            distinctUntilChanged(),
        );
    }

    /**
     * Subscribes to real-time updates for a match on the server.
     *
     * Delegates to the underlying client's subscribeMatch method. The server
     * responds with a full matchState message, which populates the local cache.
     *
     * @param matchId - The match ID to subscribe to.
     */
    subscribeMatch(matchId: string): void {
        this.client.subscribeMatch(matchId);
    }

    /**
     * Unsubscribes from real-time updates for a match on the server
     * and removes the match from the local cache.
     *
     * Delegates unsubscription to the underlying client and then removes
     * the match entry from the internal BehaviorSubject map.
     *
     * @param matchId - The match ID to unsubscribe from.
     */
    unsubscribeMatch(matchId: string): void {
        this.client.unsubscribeMatch(matchId);

        const current = this.matchesSubject.getValue();
        const next = new Map(current);
        next.delete(matchId);
        this.matchesSubject.next(next);
    }

    /**
     * Sends a match update to the server via the underlying WebSocket client.
     *
     * @param matchId - The match ID to update.
     * @param data - The fields to update.
     */
    sendMatchUpdate(matchId: string, data: UpdateMatchFields): void {
        this.client.sendMatchUpdate(matchId, data);
    }

    /**
     * Disposes of all internal subscriptions and completes all subjects.
     *
     * Unsubscribes from the client's messages$ observable and completes
     * the internal BehaviorSubject. The stream cannot be reused after disposal.
     * This method is idempotent — calling it multiple times does not throw.
     */
    dispose(): void {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.messagesSubscription.unsubscribe();
        this.matchesSubject.complete();
    }

    /**
     * Handles incoming server messages by updating the internal match cache.
     *
     * For both 'matchState' and 'matchUpdated' messages, creates a new Map
     * with the match entry set/replaced and emits it on the BehaviorSubject.
     *
     * @param msg - The server message to handle.
     */
    private handleMessage(msg: MatchesServerMessage): void {
        if (msg.action === 'matchState' || msg.action === 'matchUpdated') {
            const current = this.matchesSubject.getValue();
            const next = new Map(current);
            next.set(msg.matchId, msg.data);
            this.matchesSubject.next(next);
        }
    }
}

/**
 * Factory function to create a new {@link MatchStream} instance.
 *
 * @param client - The real-time WebSocket client to wrap.
 * @returns A new MatchStream instance subscribed to the client's messages.
 */
export function createMatchStream(client: IMatchesRealtimeClient): MatchStream {
    return new MatchStream(client);
}
