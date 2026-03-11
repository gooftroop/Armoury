/**
 * Test Plan for PresenceStream.ts
 *
 * Source: src/shared/streams/src/presence/PresenceStream.ts
 *
 * Requirement 1: Constructor dependency injection
 *   - Test: accepts an IFriendsPresenceClient and constructs without error
 *
 * Requirement 2: Subscribes to client messages$ on construction
 *   - Test: subscribes to messages$ immediately on construction
 *   - Test: updates internal state when messages are emitted
 *
 * Requirement 3: Maintains BehaviorSubject<ReadonlyMap<string, OnlineFriend>>
 *   - Test: initial value of onlineFriends$ is an empty map
 *
 * Requirement 4: Adds entries on 'friendOnline' messages
 *   - Test: adds a single friend to the map on friendOnline message
 *   - Test: adds multiple friends to the map on sequential friendOnline messages
 *   - Test: overwrites existing entry on duplicate friendOnline for same userId
 *
 * Requirement 5: Removes entries on 'friendOffline' messages
 *   - Test: removes a friend from the map on friendOffline message
 *   - Test: handles friendOffline for a userId not in the map without error
 *
 * Requirement 6: Exposes onlineFriends$ as read-only Observable
 *   - Test: onlineFriends$ emits the current map of online friends
 *   - Test: onlineFriends$ emits updated map after online/offline events
 *
 * Requirement 7: isOnline$(userId) with distinctUntilChanged
 *   - Test: isOnline$ emits false initially for an unknown user
 *   - Test: isOnline$ emits true when the user comes online
 *   - Test: isOnline$ emits false when the user goes offline
 *   - Test: isOnline$ does not re-emit when another user comes online (distinct)
 *
 * Requirement 8: onlineCount$ with distinctUntilChanged
 *   - Test: onlineCount$ emits 0 initially
 *   - Test: onlineCount$ emits 1 after one friend comes online
 *   - Test: onlineCount$ emits 0 after the friend goes offline
 *   - Test: onlineCount$ does not re-emit when a duplicate friendOnline arrives (same count)
 *
 * Requirement 9: connectionState$ proxied from client
 *   - Test: connectionState$ emits values from the client's connectionState$
 *   - Test: connectionState$ reflects state changes from the client
 *
 * Requirement 10: dispose() unsubscribes and completes
 *   - Test: dispose() unsubscribes from client messages$
 *   - Test: dispose() completes the onlineFriends$ observable
 *   - Test: dispose() completes the onlineCount$ observable
 *   - Test: dispose() completes the isOnline$ observable
 *
 * Requirement 11: dispose() is idempotent
 *   - Test: calling dispose() twice does not throw
 *
 * Requirement 12: Does not call connect/disconnect on client
 *   - Test: constructor does not call client.connect()
 *   - Test: dispose() does not call client.connect() or client.disconnect()
 *
 * Edge cases:
 *   - Test: concurrent online/offline for multiple users maintains correct state
 *   - Test: messages after dispose do not update state (subscription is dead)
 */

/**
 * Unit tests for the PresenceStream reactive facade.
 *
 * Verifies that PresenceStream correctly projects FriendsPresenceClient
 * WebSocket messages into observable state: an online friends map,
 * individual online checks, and aggregate online counts.
 *
 * @module @armoury/streams/presence/__tests__/PresenceStream.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { take, toArray, skip } from 'rxjs/operators';
import type { FriendsServerMessage, ConnectionState } from '@armoury/clients-friends';
import type { IFriendsPresenceClient } from '@armoury/clients-friends';
import { PresenceStream, createPresenceStream } from '../PresenceStream.js';

/**
 * Creates a mock IFriendsPresenceClient for testing.
 *
 * Returns an object implementing the IFriendsPresenceClient interface
 * with Subject/BehaviorSubject instances that can be driven from tests,
 * plus vi.fn() spies for connect, disconnect, and dispose.
 */
function createMockClient(): IFriendsPresenceClient & {
    messagesSubject: Subject<FriendsServerMessage>;
    connectionStateSubject: BehaviorSubject<ConnectionState>;
} {
    const messagesSubject = new Subject<FriendsServerMessage>();
    const connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');

    return {
        messagesSubject,
        connectionStateSubject,
        messages$: messagesSubject.asObservable(),
        connectionState$: connectionStateSubject.asObservable(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        dispose: vi.fn(),
    };
}

describe('PresenceStream', () => {
    let client: ReturnType<typeof createMockClient>;
    let stream: PresenceStream;

    beforeEach(() => {
        client = createMockClient();
        stream = new PresenceStream(client);
    });

    // === Requirement 1: Constructor dependency injection ===

    describe('constructor', () => {
        it('accepts an IFriendsPresenceClient and constructs without error', () => {
            expect(stream).toBeInstanceOf(PresenceStream);
        });
    });

    // === Requirement 3: Initial BehaviorSubject state ===

    describe('onlineFriends$', () => {
        it('emits an empty map as initial value', async () => {
            const result = await firstValueFrom(stream.onlineFriends$);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });

        it('emits a map with one entry after a friendOnline message', async () => {
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });

            const result = await firstValueFrom(stream.onlineFriends$);

            expect(result.size).toBe(1);
            expect(result.get('user-1')).toEqual({ userId: 'user-1', name: 'Alice' });
        });

        it('emits a map with multiple entries after sequential friendOnline messages', async () => {
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-2',
                name: 'Bob',
            });

            const result = await firstValueFrom(stream.onlineFriends$);

            expect(result.size).toBe(2);
            expect(result.get('user-1')).toEqual({ userId: 'user-1', name: 'Alice' });
            expect(result.get('user-2')).toEqual({ userId: 'user-2', name: 'Bob' });
        });

        it('overwrites existing entry on duplicate friendOnline for same userId', async () => {
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice Updated',
            });

            const result = await firstValueFrom(stream.onlineFriends$);

            expect(result.size).toBe(1);
            expect(result.get('user-1')).toEqual({ userId: 'user-1', name: 'Alice Updated' });
        });

        it('removes a friend from the map on friendOffline message', async () => {
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-1' });

            const result = await firstValueFrom(stream.onlineFriends$);

            expect(result.size).toBe(0);
        });

        it('handles friendOffline for a userId not in the map without error', async () => {
            client.messagesSubject.next({ action: 'friendOffline', userId: 'unknown' });

            const result = await firstValueFrom(stream.onlineFriends$);

            expect(result.size).toBe(0);
        });

        it('emits updated map after online/offline events', async () => {
            // Collect first 4 emissions: initial + 3 messages
            const promise = firstValueFrom(stream.onlineFriends$.pipe(skip(3), take(1)));

            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-2',
                name: 'Bob',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-1' });

            const result = await promise;

            expect(result.size).toBe(1);
            expect(result.has('user-1')).toBe(false);
            expect(result.get('user-2')).toEqual({ userId: 'user-2', name: 'Bob' });
        });
    });

    // === Requirement 7: isOnline$(userId) ===

    describe('isOnline$', () => {
        it('emits false initially for an unknown user', async () => {
            const result = await firstValueFrom(stream.isOnline$('user-1'));

            expect(result).toBe(false);
        });

        it('emits true when the user comes online', async () => {
            const promise = firstValueFrom(stream.isOnline$('user-1').pipe(skip(1), take(1)));

            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });

            const result = await promise;

            expect(result).toBe(true);
        });

        it('emits false when the user goes offline', async () => {
            const promise = firstValueFrom(stream.isOnline$('user-1').pipe(skip(2), take(1)));

            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-1' });

            const result = await promise;

            expect(result).toBe(false);
        });

        it('does not re-emit when another user comes online (distinctUntilChanged)', async () => {
            const emissions: boolean[] = [];

            // Subscribe to user-1's status
            const sub = stream.isOnline$('user-1').subscribe((online) => {
                emissions.push(online);
            });

            // user-2 comes online — should NOT cause user-1's isOnline$ to re-emit
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-2',
                name: 'Bob',
            });

            // Only the initial false should be emitted
            expect(emissions).toEqual([false]);

            sub.unsubscribe();
        });

        it('emits full lifecycle: false → true → false', async () => {
            const promise = firstValueFrom(stream.isOnline$('user-1').pipe(take(3), toArray()));

            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-1' });

            const result = await promise;

            expect(result).toEqual([false, true, false]);
        });
    });

    // === Requirement 8: onlineCount$ ===

    describe('onlineCount$', () => {
        it('emits 0 initially', async () => {
            const result = await firstValueFrom(stream.onlineCount$);

            expect(result).toBe(0);
        });

        it('emits 1 after one friend comes online', async () => {
            const promise = firstValueFrom(stream.onlineCount$.pipe(skip(1), take(1)));

            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });

            const result = await promise;

            expect(result).toBe(1);
        });

        it('emits 0 after the friend goes offline', async () => {
            const promise = firstValueFrom(stream.onlineCount$.pipe(skip(2), take(1)));

            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-1' });

            const result = await promise;

            expect(result).toBe(0);
        });

        it('does not re-emit when a duplicate friendOnline arrives for same count', async () => {
            const emissions: number[] = [];

            const sub = stream.onlineCount$.subscribe((count) => {
                emissions.push(count);
            });

            // First online — count goes to 1
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });

            // Duplicate online for same user — count stays 1, should not re-emit
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice v2',
            });

            expect(emissions).toEqual([0, 1]);

            sub.unsubscribe();
        });

        it('increments and decrements correctly for multiple users', async () => {
            const promise = firstValueFrom(stream.onlineCount$.pipe(take(5), toArray()));

            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-2',
                name: 'Bob',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-1' });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-2' });

            const result = await promise;

            expect(result).toEqual([0, 1, 2, 1, 0]);
        });
    });

    // === Requirement 9: connectionState$ proxied from client ===

    describe('connectionState$', () => {
        it('emits values from the client connectionState$', async () => {
            const result = await firstValueFrom(stream.connectionState$);

            expect(result).toBe('disconnected');
        });

        it('reflects state changes from the client', async () => {
            const promise = firstValueFrom(stream.connectionState$.pipe(skip(1), take(1)));

            client.connectionStateSubject.next('connected');

            const result = await promise;

            expect(result).toBe('connected');
        });

        it('emits all connection state transitions', async () => {
            const promise = firstValueFrom(stream.connectionState$.pipe(take(4), toArray()));

            client.connectionStateSubject.next('connecting');
            client.connectionStateSubject.next('connected');
            client.connectionStateSubject.next('disconnected');

            const result = await promise;

            expect(result).toEqual(['disconnected', 'connecting', 'connected', 'disconnected']);
        });
    });

    // === Requirement 10: dispose() unsubscribes and completes ===

    describe('dispose', () => {
        it('completes the onlineFriends$ observable', async () => {
            let completed = false;

            stream.onlineFriends$.subscribe({ complete: () => (completed = true) });

            stream.dispose();

            expect(completed).toBe(true);
        });

        it('completes the onlineCount$ observable', async () => {
            let completed = false;

            stream.onlineCount$.subscribe({ complete: () => (completed = true) });

            stream.dispose();

            expect(completed).toBe(true);
        });

        it('completes the isOnline$ observable', async () => {
            let completed = false;

            stream.isOnline$('user-1').subscribe({ complete: () => (completed = true) });

            stream.dispose();

            expect(completed).toBe(true);
        });

        it('unsubscribes from client messages$ — no further state updates', () => {
            stream.dispose();

            // This should not cause any error or state update
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });

            // Since the subject is completed, we check that no update occurred
            // by verifying the stream does not update (subscribe after dispose gets complete)
            let emittedValue: ReadonlyMap<string, { userId: string; name: string }> | undefined;

            stream.onlineFriends$.subscribe((v) => {
                emittedValue = v;
            });

            expect(emittedValue).toBeUndefined();
        });

        it('subscribing to onlineFriends$ after dispose receives complete notification', () => {
            stream.dispose();

            let completed = false;

            stream.onlineFriends$.subscribe({ complete: () => (completed = true) });

            expect(completed).toBe(true);
        });
    });

    // === Requirement 11: dispose() is idempotent ===

    describe('dispose idempotency', () => {
        it('calling dispose() twice does not throw', () => {
            stream.dispose();

            expect(() => stream.dispose()).not.toThrow();
        });
    });

    // === Requirement 12: Does not call connect/disconnect on client ===

    describe('client lifecycle isolation', () => {
        it('constructor does not call client.connect()', () => {
            expect(client.connect).not.toHaveBeenCalled();
        });

        it('constructor does not call client.disconnect()', () => {
            expect(client.disconnect).not.toHaveBeenCalled();
        });

        it('dispose() does not call client.connect() or client.disconnect()', () => {
            stream.dispose();

            expect(client.connect).not.toHaveBeenCalled();
            expect(client.disconnect).not.toHaveBeenCalled();
        });
    });

    // === Edge cases ===

    describe('edge cases', () => {
        it('concurrent online/offline for multiple users maintains correct state', async () => {
            // Simulate rapid interleaved events
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-2',
                name: 'Bob',
            });
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-3',
                name: 'Charlie',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-2' });
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-4',
                name: 'Diana',
            });
            client.messagesSubject.next({ action: 'friendOffline', userId: 'user-1' });

            const result = await firstValueFrom(stream.onlineFriends$);

            expect(result.size).toBe(2);
            expect(result.has('user-1')).toBe(false);
            expect(result.has('user-2')).toBe(false);
            expect(result.get('user-3')).toEqual({ userId: 'user-3', name: 'Charlie' });
            expect(result.get('user-4')).toEqual({ userId: 'user-4', name: 'Diana' });
        });

        it('messages after dispose do not update state', () => {
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-1',
                name: 'Alice',
            });

            stream.dispose();

            // Send more messages after dispose
            client.messagesSubject.next({
                action: 'friendOnline',
                userId: 'user-2',
                name: 'Bob',
            });

            // The subject is completed — new subscriptions should not emit values,
            // only the complete notification. State should reflect pre-dispose state.
            let lastValue: ReadonlyMap<string, { userId: string; name: string }> | undefined;

            stream.onlineFriends$.subscribe((v) => {
                lastValue = v;
            });

            // Since subject is completed, subscribe won't emit values
            expect(lastValue).toBeUndefined();
        });
    });

    // === Factory function ===

    describe('createPresenceStream', () => {
        it('returns a PresenceStream instance', () => {
            const factoryStream = createPresenceStream(client);

            expect(factoryStream).toBeInstanceOf(PresenceStream);

            factoryStream.dispose();
        });
    });
});
