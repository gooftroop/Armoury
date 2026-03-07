/**
 * Reactive presence stream facade over the FriendsPresenceClient.
 *
 * Subscribes to the WebSocket client's message stream and maintains a live,
 * observable map of online friends using RxJS BehaviorSubjects. Consumers
 * observe the derived state (online friends map, individual online status,
 * online count) without directly interacting with the WebSocket client.
 *
 * This class does NOT own the client lifecycle — it never calls connect()
 * or disconnect(). The consumer is responsible for managing the client
 * connection before and after constructing a PresenceStream.
 *
 * @module @armoury/streams/presence/PresenceStream
 */

import { BehaviorSubject, Subscription } from 'rxjs';
import type { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import type { IFriendsPresenceClient, FriendsServerMessage } from '@armoury/clients-friends';
import type { OnlineFriend, IPresenceStream } from '@streams/types.js';

/**
 * @requirements
 * 1. Must accept an IFriendsPresenceClient as a constructor dependency.
 * 2. Must subscribe to the client's messages$ on construction and update internal state.
 * 3. Must maintain a BehaviorSubject<ReadonlyMap<string, OnlineFriend>> for online friends.
 * 4. Must add entries to the map on 'friendOnline' messages (keyed by userId, value: { userId, name }).
 * 5. Must remove entries from the map on 'friendOffline' messages.
 * 6. Must expose onlineFriends$ as a read-only Observable of the current map.
 * 7. Must expose isOnline$(userId) that emits boolean derived from the map via distinctUntilChanged.
 * 8. Must expose onlineCount$ that emits the count of online friends via distinctUntilChanged.
 * 9. Must expose connectionState$ proxied from the underlying client's connectionState$.
 * 10. Must unsubscribe from client messages$ and complete all subjects on dispose().
 * 11. Must be idempotent on dispose — calling dispose() twice must not throw.
 * 12. Must NOT call connect/disconnect on the client — lifecycle is the consumer's responsibility.
 */

/**
 * Reactive facade for friend presence data.
 *
 * Wraps an {@link IFriendsPresenceClient} and projects its raw WebSocket
 * messages into a typed, observable map of online friends. Derived observables
 * provide individual online checks and aggregate counts.
 *
 * @example
 * ```ts
 * const client = createFriendsPresenceClient({ wsUrl, getToken });
 * const stream = createPresenceStream(client);
 *
 * client.connect();
 * stream.onlineFriends$.subscribe(friends => console.log(friends.size));
 * stream.isOnline$('user-123').subscribe(online => console.log(online));
 *
 * // Teardown
 * stream.dispose();
 * client.disconnect();
 * ```
 */
export class PresenceStream implements IPresenceStream {
    /**
     * Internal BehaviorSubject holding the current map of online friends.
     * Keyed by userId, value is the {@link OnlineFriend} snapshot.
     */
    private readonly onlineFriendsSubject = new BehaviorSubject<ReadonlyMap<string, OnlineFriend>>(new Map());

    /**
     * Subscription to the underlying client's messages$ stream.
     * Stored so it can be unsubscribed in {@link dispose}.
     */
    private readonly messagesSubscription: Subscription;

    /** Whether this stream has been disposed. Guards against double-dispose. */
    private disposed = false;

    /** Observable map of currently online friends, keyed by userId. */
    readonly onlineFriends$: Observable<ReadonlyMap<string, OnlineFriend>> = this.onlineFriendsSubject.asObservable();

    /**
     * Observable of the count of currently online friends.
     * Emits a new value only when the count actually changes.
     */
    readonly onlineCount$: Observable<number> = this.onlineFriendsSubject.pipe(
        map((m) => m.size),
        distinctUntilChanged(),
    );

    /**
     * Observable of the underlying WebSocket connection state.
     * Proxied directly from the client — no transformation applied.
     */
    readonly connectionState$: Observable<import('@streams/types.js').ConnectionState>;

    /**
     * Creates a new PresenceStream.
     *
     * Immediately subscribes to the client's messages$ to begin tracking
     * friend online/offline events. The client must already be connected
     * (or will be connected later by the consumer) — this class does not
     * manage the client lifecycle.
     *
     * @param client - The friends presence WebSocket client to observe.
     */
    constructor(client: IFriendsPresenceClient) {
        this.connectionState$ = client.connectionState$;

        this.messagesSubscription = client.messages$.subscribe((message: FriendsServerMessage) => {
            this.handleMessage(message);
        });
    }

    /**
     * Returns an observable of whether a specific friend is currently online.
     *
     * Derived from the internal online friends map. Emits `true` when the
     * friend appears in the map and `false` when they do not. Uses
     * `distinctUntilChanged` to suppress duplicate emissions.
     *
     * @param userId - The user ID of the friend to observe.
     * @returns An Observable that emits boolean online status for the given user.
     */
    isOnline$(userId: string): Observable<boolean> {
        return this.onlineFriendsSubject.pipe(
            map((m) => m.has(userId)),
            distinctUntilChanged(),
        );
    }

    /**
     * Disposes of all internal subscriptions and completes all subjects.
     *
     * Unsubscribes from the client's messages$ stream and completes the
     * internal BehaviorSubject. The stream cannot be reused after disposal.
     * This method is idempotent — calling it multiple times is safe.
     */
    dispose(): void {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.messagesSubscription.unsubscribe();
        this.onlineFriendsSubject.complete();
    }

    /**
     * Processes an incoming server message and updates the online friends map.
     *
     * For 'friendOnline' messages, adds the friend to the map keyed by userId.
     * For 'friendOffline' messages, removes the friend from the map.
     * After each mutation, emits the new map on the BehaviorSubject.
     *
     * @param message - The typed server message from the presence WebSocket.
     */
    private handleMessage(message: FriendsServerMessage): void {
        const currentMap = this.onlineFriendsSubject.getValue();
        const nextMap = new Map(currentMap);

        switch (message.action) {
            case 'friendOnline':
                nextMap.set(message.userId, {
                    userId: message.userId,
                    name: message.name,
                });
                break;

            case 'friendOffline':
                nextMap.delete(message.userId);
                break;
        }

        this.onlineFriendsSubject.next(nextMap);
    }
}

/**
 * Factory function to create a new PresenceStream instance.
 *
 * Provides a convenient way to instantiate a PresenceStream without using
 * the `new` keyword directly. This is the recommended way to create
 * presence streams.
 *
 * @param client - The friends presence WebSocket client to observe.
 * @returns A new PresenceStream instance subscribed to the client's messages.
 */
export function createPresenceStream(client: IFriendsPresenceClient): PresenceStream {
    return new PresenceStream(client);
}
