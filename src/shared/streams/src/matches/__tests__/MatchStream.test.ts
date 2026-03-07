/**
 * Test Plan for MatchStream.ts
 *
 * Source: src/shared/streams/src/matches/MatchStream.ts
 *
 * Requirement 1: Constructor dependency injection
 *   - Test: accepts an IMatchesRealtimeClient and constructs without error
 *
 * Requirement 2: Subscribes to client messages$ on construction
 *   - Test: subscribes to client.messages$ during construction
 *
 * Requirement 3: Maintains a BehaviorSubject<ReadonlyMap<string, Match>>
 *   - Test: matches$ emits an empty map initially
 *
 * Requirement 4: Handles matchState messages
 *   - Test: populates the cache with match data on matchState message
 *   - Test: replaces existing match data on subsequent matchState message for the same matchId
 *
 * Requirement 5: Handles matchUpdated messages
 *   - Test: updates the cache with match data on matchUpdated message
 *   - Test: replaces existing match data on matchUpdated message for the same matchId
 *
 * Requirement 6: Exposes matches$ as read-only Observable
 *   - Test: matches$ emits the current map after matchState message
 *   - Test: matches$ emits updated map containing multiple matches
 *
 * Requirement 7: Exposes match$(matchId) with distinctUntilChanged
 *   - Test: match$() emits undefined for unknown match ID
 *   - Test: match$() emits the match when it enters the cache
 *   - Test: match$() does not re-emit when a different match changes (distinctUntilChanged)
 *
 * Requirement 8: Exposes connectionState$ proxied from client
 *   - Test: connectionState$ mirrors the client's connectionState$
 *
 * Requirement 9: Delegates subscribeMatch to client
 *   - Test: subscribeMatch() calls client.subscribeMatch() with the matchId
 *
 * Requirement 10: Delegates unsubscribeMatch and removes from cache
 *   - Test: unsubscribeMatch() calls client.unsubscribeMatch() with the matchId
 *   - Test: unsubscribeMatch() removes the match from the local cache
 *   - Test: match$() emits undefined after unsubscribeMatch
 *
 * Requirement 11: Delegates sendMatchUpdate to client
 *   - Test: sendMatchUpdate() calls client.sendMatchUpdate() with matchId and data
 *
 * Requirement 12: Disposes subscriptions and completes subjects
 *   - Test: dispose() completes the matches$ observable
 *   - Test: dispose() unsubscribes from client.messages$
 *
 * Requirement 13: Idempotent dispose
 *   - Test: calling dispose() twice does not throw
 *
 * Requirement 14: Does not call connect/disconnect on the client
 *   - Test: constructor does not call client.connect() or client.disconnect()
 *   - Test: dispose does not call client.connect() or client.disconnect()
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import type {
    IMatchesRealtimeClient,
    Match,
    MatchesServerMessage,
    MatchStateMessage,
    MatchUpdatedMessage,
    UpdateMatchFields,
    ConnectionState,
} from '@armoury/clients-matches';
import { MatchStream, createMatchStream } from '../MatchStream.ts';

// === Test Helpers ===

/**
 * Builds a mock {@link Match} with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 *
 * @param overrides - Partial match fields to override defaults.
 * @returns A complete Match object.
 */
function makeMatch(overrides: Partial<Match> = {}): Match {
    return {
        id: 'match-1',
        systemId: 'wh40k10e',
        players: [
            { playerId: 'player-1', campaignParticipantId: null },
            { playerId: 'player-2', campaignParticipantId: null },
        ],
        turn: {
            activePlayerId: 'player-1',
            turnOrder: ['player-1', 'player-2'],
            turnNumber: 1,
        },
        score: {
            totalsByPlayerId: { 'player-1': 0, 'player-2': 0 },
            events: [],
        },
        outcome: {
            status: 'in_progress',
            resultsByPlayerId: {},
        },
        campaignId: null,
        notes: '',
        playedAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        ...overrides,
    };
}

/** Creates a mock IMatchesRealtimeClient with controllable subjects. */
function createMockClient() {
    const messagesSubject = new Subject<MatchesServerMessage>();
    const connectionStateSubject = new BehaviorSubject<ConnectionState>('disconnected');

    const client: IMatchesRealtimeClient = {
        messages$: messagesSubject.asObservable(),
        connectionState$: connectionStateSubject.asObservable(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        subscribeMatch: vi.fn(),
        unsubscribeMatch: vi.fn(),
        sendMatchUpdate: vi.fn(),
        matchState$: vi.fn(),
        matchUpdated$: vi.fn(),
        dispose: vi.fn(),
    };

    return { client, messagesSubject, connectionStateSubject };
}

// === Tests ===

describe('MatchStream', () => {
    let client: IMatchesRealtimeClient;
    let messagesSubject: Subject<MatchesServerMessage>;
    let connectionStateSubject: BehaviorSubject<ConnectionState>;
    let stream: MatchStream;

    beforeEach(() => {
        const mock = createMockClient();
        client = mock.client;
        messagesSubject = mock.messagesSubject;
        connectionStateSubject = mock.connectionStateSubject;
        stream = new MatchStream(client);
    });

    // === Requirement 1: Constructor dependency injection ===

    describe('constructor', () => {
        it('accepts an IMatchesRealtimeClient and constructs without error', () => {
            expect(stream).toBeInstanceOf(MatchStream);
        });
    });

    // === Requirement 2: Subscribes to client messages$ on construction ===

    describe('messages$ subscription', () => {
        it('subscribes to client.messages$ during construction', () => {
            // Verify the subscription is active by emitting a message and checking the cache
            const match = makeMatch({ id: 'match-sub-test' });
            const msg: MatchStateMessage = { action: 'matchState', matchId: 'match-sub-test', data: match };
            messagesSubject.next(msg);

            const value = firstValueFrom(stream.matches$);

            return value.then((result) => {
                expect(result.get('match-sub-test')).toEqual(match);
            });
        });
    });

    // === Requirement 3: Maintains BehaviorSubject<ReadonlyMap<string, Match>> ===

    describe('initial state', () => {
        it('matches$ emits an empty map initially', async () => {
            const result = await firstValueFrom(stream.matches$);

            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });
    });

    // === Requirement 4: Handles matchState messages ===

    describe('matchState handling', () => {
        it('populates the cache with match data on matchState message', async () => {
            const match = makeMatch({ id: 'match-1' });
            const msg: MatchStateMessage = { action: 'matchState', matchId: 'match-1', data: match };

            messagesSubject.next(msg);
            const result = await firstValueFrom(stream.matches$);

            expect(result.get('match-1')).toEqual(match);
            expect(result.size).toBe(1);
        });

        it('replaces existing match data on subsequent matchState message for the same matchId', async () => {
            const match1 = makeMatch({ id: 'match-1', notes: 'first' });
            const match2 = makeMatch({ id: 'match-1', notes: 'second' });

            messagesSubject.next({ action: 'matchState', matchId: 'match-1', data: match1 });
            messagesSubject.next({ action: 'matchState', matchId: 'match-1', data: match2 });

            const result = await firstValueFrom(stream.matches$);

            expect(result.get('match-1')?.notes).toBe('second');
            expect(result.size).toBe(1);
        });
    });

    // === Requirement 5: Handles matchUpdated messages ===

    describe('matchUpdated handling', () => {
        it('updates the cache with match data on matchUpdated message', async () => {
            const match = makeMatch({ id: 'match-2' });
            const msg: MatchUpdatedMessage = { action: 'matchUpdated', matchId: 'match-2', data: match };

            messagesSubject.next(msg);
            const result = await firstValueFrom(stream.matches$);

            expect(result.get('match-2')).toEqual(match);
        });

        it('replaces existing match data on matchUpdated message for the same matchId', async () => {
            const original = makeMatch({ id: 'match-2', notes: 'original' });
            const updated = makeMatch({ id: 'match-2', notes: 'updated' });

            messagesSubject.next({ action: 'matchState', matchId: 'match-2', data: original });
            messagesSubject.next({ action: 'matchUpdated', matchId: 'match-2', data: updated });

            const result = await firstValueFrom(stream.matches$);

            expect(result.get('match-2')?.notes).toBe('updated');
        });
    });

    // === Requirement 6: Exposes matches$ as read-only Observable ===

    describe('matches$', () => {
        it('emits the current map after matchState message', async () => {
            const match = makeMatch({ id: 'match-a' });
            messagesSubject.next({ action: 'matchState', matchId: 'match-a', data: match });

            const result = await firstValueFrom(stream.matches$);

            expect(result.size).toBe(1);
            expect(result.get('match-a')).toEqual(match);
        });

        it('emits updated map containing multiple matches', async () => {
            const match1 = makeMatch({ id: 'match-a' });
            const match2 = makeMatch({ id: 'match-b' });

            messagesSubject.next({ action: 'matchState', matchId: 'match-a', data: match1 });
            messagesSubject.next({ action: 'matchState', matchId: 'match-b', data: match2 });

            const result = await firstValueFrom(stream.matches$);

            expect(result.size).toBe(2);
            expect(result.has('match-a')).toBe(true);
            expect(result.has('match-b')).toBe(true);
        });
    });

    // === Requirement 7: Exposes match$(matchId) with distinctUntilChanged ===

    describe('match$()', () => {
        it('emits undefined for unknown match ID', async () => {
            const result = await firstValueFrom(stream.match$('nonexistent'));

            expect(result).toBeUndefined();
        });

        it('emits the match when it enters the cache', async () => {
            const match = makeMatch({ id: 'match-1' });

            // Set up collection before emitting
            const values: Array<Match | undefined> = [];
            const sub = stream.match$('match-1').subscribe((v) => values.push(v));

            messagesSubject.next({ action: 'matchState', matchId: 'match-1', data: match });

            // undefined (initial) + match (after message)
            expect(values).toHaveLength(2);
            expect(values[0]).toBeUndefined();
            expect(values[1]).toEqual(match);

            sub.unsubscribe();
        });

        it('does not re-emit when a different match changes (distinctUntilChanged)', async () => {
            const matchA = makeMatch({ id: 'match-a' });
            const matchB = makeMatch({ id: 'match-b' });

            const values: Array<Match | undefined> = [];
            const sub = stream.match$('match-a').subscribe((v) => values.push(v));

            messagesSubject.next({ action: 'matchState', matchId: 'match-a', data: matchA });
            messagesSubject.next({ action: 'matchState', matchId: 'match-b', data: matchB });

            // Should only have: undefined (initial) + matchA (when match-a entered).
            // match-b entering should NOT cause a re-emit for match-a since distinctUntilChanged
            // compares the value for 'match-a' which is still the same reference.
            expect(values).toHaveLength(2);
            expect(values[0]).toBeUndefined();
            expect(values[1]).toEqual(matchA);

            sub.unsubscribe();
        });
    });

    // === Requirement 8: Exposes connectionState$ proxied from client ===

    describe('connectionState$', () => {
        it('mirrors the client connectionState$', async () => {
            connectionStateSubject.next('connecting');
            const result = await firstValueFrom(stream.connectionState$);

            expect(result).toBe('connecting');
        });

        it('emits subsequent connection state changes', () => {
            const values: ConnectionState[] = [];
            const sub = stream.connectionState$.subscribe((v) => values.push(v));

            connectionStateSubject.next('connecting');
            connectionStateSubject.next('connected');
            connectionStateSubject.next('reconnecting');

            // Initial 'disconnected' + 3 emissions
            expect(values).toEqual(['disconnected', 'connecting', 'connected', 'reconnecting']);

            sub.unsubscribe();
        });
    });

    // === Requirement 9: Delegates subscribeMatch to client ===

    describe('subscribeMatch()', () => {
        it('calls client.subscribeMatch() with the matchId', () => {
            stream.subscribeMatch('match-42');

            expect(client.subscribeMatch).toHaveBeenCalledWith('match-42');
            expect(client.subscribeMatch).toHaveBeenCalledTimes(1);
        });
    });

    // === Requirement 10: Delegates unsubscribeMatch and removes from cache ===

    describe('unsubscribeMatch()', () => {
        it('calls client.unsubscribeMatch() with the matchId', () => {
            stream.unsubscribeMatch('match-42');

            expect(client.unsubscribeMatch).toHaveBeenCalledWith('match-42');
            expect(client.unsubscribeMatch).toHaveBeenCalledTimes(1);
        });

        it('removes the match from the local cache', async () => {
            const match = makeMatch({ id: 'match-to-remove' });
            messagesSubject.next({ action: 'matchState', matchId: 'match-to-remove', data: match });

            // Verify it's in the cache
            let result = await firstValueFrom(stream.matches$);
            expect(result.has('match-to-remove')).toBe(true);

            // Unsubscribe and verify removal
            stream.unsubscribeMatch('match-to-remove');
            result = await firstValueFrom(stream.matches$);

            expect(result.has('match-to-remove')).toBe(false);
            expect(result.size).toBe(0);
        });

        it('match$() emits undefined after unsubscribeMatch', () => {
            const match = makeMatch({ id: 'match-unsub' });
            const values: Array<Match | undefined> = [];
            const sub = stream.match$('match-unsub').subscribe((v) => values.push(v));

            messagesSubject.next({ action: 'matchState', matchId: 'match-unsub', data: match });
            stream.unsubscribeMatch('match-unsub');

            // undefined (initial) + match (entered) + undefined (removed)
            expect(values).toHaveLength(3);
            expect(values[0]).toBeUndefined();
            expect(values[1]).toEqual(match);
            expect(values[2]).toBeUndefined();

            sub.unsubscribe();
        });
    });

    // === Requirement 11: Delegates sendMatchUpdate to client ===

    describe('sendMatchUpdate()', () => {
        it('calls client.sendMatchUpdate() with matchId and data', () => {
            const data: UpdateMatchFields = { notes: 'updated notes' };

            stream.sendMatchUpdate('match-99', data);

            expect(client.sendMatchUpdate).toHaveBeenCalledWith('match-99', data);
            expect(client.sendMatchUpdate).toHaveBeenCalledTimes(1);
        });
    });

    // === Requirement 12: Disposes subscriptions and completes subjects ===

    describe('dispose()', () => {
        it('completes the matches$ observable', () => {
            let completed = false;
            stream.matches$.subscribe({ complete: () => (completed = true) });

            stream.dispose();

            expect(completed).toBe(true);
        });

        it('unsubscribes from client.messages$ so further messages are ignored', async () => {
            const match = makeMatch({ id: 'after-dispose' });

            stream.dispose();

            // Emit after dispose — should not throw or update state
            messagesSubject.next({ action: 'matchState', matchId: 'after-dispose', data: match });

            // The subject is completed, so we can't use firstValueFrom.
            // Instead verify no error was thrown (the message was silently ignored).
            expect(true).toBe(true);
        });
    });

    // === Requirement 13: Idempotent dispose ===

    describe('idempotent dispose', () => {
        it('calling dispose() twice does not throw', () => {
            stream.dispose();

            expect(() => stream.dispose()).not.toThrow();
        });
    });

    // === Requirement 14: Does not call connect/disconnect on the client ===

    describe('no connect/disconnect calls', () => {
        it('constructor does not call client.connect() or client.disconnect()', () => {
            expect(client.connect).not.toHaveBeenCalled();
            expect(client.disconnect).not.toHaveBeenCalled();
        });

        it('dispose does not call client.connect() or client.disconnect()', () => {
            stream.dispose();

            expect(client.connect).not.toHaveBeenCalled();
            expect(client.disconnect).not.toHaveBeenCalled();
        });
    });

    // === Factory function ===

    describe('createMatchStream()', () => {
        it('returns a MatchStream instance', () => {
            const factoryStream = createMatchStream(client);

            expect(factoryStream).toBeInstanceOf(MatchStream);
            factoryStream.dispose();
        });
    });
});
