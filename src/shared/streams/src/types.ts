/**
 * Shared types for the @armoury/streams package.
 *
 * Defines the common interfaces and types used by all reactive stream facades.
 * Each stream wraps a WebSocket client and maintains typed, observable state
 * using RxJS BehaviorSubjects. These types provide the contract between
 * the stream implementations and their consumers.
 *
 * @module @armoury/streams/types
 */

import type { Observable } from 'rxjs';

/**
 * @requirements
 * 1. Must define a ConnectionState type matching the WebSocket client connection states.
 * 2. Must define an IStream interface with observable connection state and a dispose method.
 * 3. Must define an IPresenceStream interface for reading friend presence state.
 * 4. Must define an IMatchStream interface for reading and writing match state.
 */

// === Connection State ===

/**
 * The connection state of the underlying WebSocket client.
 *
 * Mirrors the ConnectionState from the client packages so that stream
 * consumers do not need to import client types directly.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// === Presence State ===

/**
 * A snapshot of a single online friend's presence.
 *
 * Derived from `friendOnline` WebSocket messages. The stream maintains
 * a map of these keyed by userId and removes entries on `friendOffline`.
 */
export interface OnlineFriend {
    /** The user ID of the online friend. */
    userId: string;
    /** Display name of the friend, as provided in the friendOnline message. */
    name: string;
}

// === Base Stream Interface ===

/**
 * Base interface for all reactive stream facades.
 *
 * Every stream exposes the underlying WebSocket connection state
 * and a dispose method to tear down subscriptions and complete subjects.
 */
export interface IStream {
    /** Observable of the underlying WebSocket connection state. */
    readonly connectionState$: Observable<ConnectionState>;

    /**
     * Disposes of all internal subscriptions and completes all subjects.
     * The stream cannot be reused after disposal.
     */
    dispose(): void;
}

// === Presence Stream Interface ===

/**
 * Reactive facade for friend presence data.
 *
 * Maintains a live map of online friends derived from the
 * FriendsPresenceClient WebSocket messages. Read-only — the friends
 * presence protocol has no client-to-server messages.
 */
export interface IPresenceStream extends IStream {
    /** Observable map of currently online friends, keyed by userId. */
    readonly onlineFriends$: Observable<ReadonlyMap<string, OnlineFriend>>;

    /**
     * Observable of a specific friend's online status.
     * Emits true when the friend is online, false when offline.
     *
     * @param userId - The user ID to observe.
     */
    isOnline$(userId: string): Observable<boolean>;

    /**
     * Observable of the count of currently online friends.
     * Emits a new value whenever a friend comes online or goes offline.
     */
    readonly onlineCount$: Observable<number>;
}

// === Match Stream Interface ===

/**
 * Reactive facade for real-time match data.
 *
 * Maintains a live cache of match state derived from the
 * MatchesRealtimeClient WebSocket messages. Supports both reading
 * (observing match state) and writing (subscribing to matches,
 * sending updates).
 */
export interface IMatchStream extends IStream {
    /** Observable map of all tracked matches, keyed by match ID. */
    readonly matches$: Observable<ReadonlyMap<string, import('@armoury/clients-matches').Match>>;

    /**
     * Observable of a specific match's state.
     * Emits the full Match whenever it is updated, or undefined if untracked.
     *
     * @param matchId - The match ID to observe.
     */
    match$(matchId: string): Observable<import('@armoury/clients-matches').Match | undefined>;

    /**
     * Subscribes to real-time updates for a match on the server.
     * The server responds with a full matchState message, which populates the cache.
     *
     * @param matchId - The match ID to subscribe to.
     */
    subscribeMatch(matchId: string): void;

    /**
     * Unsubscribes from real-time updates for a match on the server
     * and removes the match from the local cache.
     *
     * @param matchId - The match ID to unsubscribe from.
     */
    unsubscribeMatch(matchId: string): void;

    /**
     * Sends a match update to the server via the underlying WebSocket client.
     *
     * @param matchId - The match ID to update.
     * @param data - The fields to update.
     */
    sendMatchUpdate(matchId: string, data: import('@armoury/clients-matches').UpdateMatchFields): void;
}
