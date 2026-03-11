import { beforeEach, describe, it, expect, vi } from 'vitest';
import { MatchDAO } from '@/dao/MatchDAO.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import type { Match } from '@armoury/models/MatchModel';

function makeMatch(overrides: Partial<Match> = {}): Match {
    return {
        id: 'match-1',
        systemId: 'wh40k10e',
        players: [
            { playerId: 'user-1', campaignParticipantId: null },
            { playerId: 'user-2', campaignParticipantId: null },
        ],
        turn: { activePlayerId: null, turnOrder: ['user-1', 'user-2'], turnNumber: 0 },
        score: null,
        outcome: { status: 'setup', resultsByPlayerId: {} },
        campaignId: null,
        matchData: null,
        notes: '',
        playedAt: '2025-01-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('MatchDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: MatchDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new MatchDAO(adapter);
    });

    describe('constructor', () => {
        it('creates a MatchDAO instance', () => {
            expect(dao).toBeInstanceOf(MatchDAO);
        });
    });

    describe('listBySystem()', () => {
        it('returns only matches for the specified system', async () => {
            await adapter.put('match', makeMatch({ id: 'm-1', systemId: 'wh40k10e' }));
            await adapter.put('match', makeMatch({ id: 'm-2', systemId: 'aos4' }));
            await adapter.put('match', makeMatch({ id: 'm-3', systemId: 'wh40k10e' }));

            const results = await dao.listBySystem('wh40k10e');

            expect(results).toHaveLength(2);
            expect(results.map((item: Match) => item.id).sort()).toEqual(['m-1', 'm-3']);
        });

        it('returns empty array when no matches for system', async () => {
            await adapter.put('match', makeMatch({ id: 'm-1', systemId: 'wh40k10e' }));

            const results = await dao.listBySystem('aos4');

            expect(results).toEqual([]);
        });
    });

    describe('listByPlayer()', () => {
        it('returns matches that include the player', async () => {
            await adapter.put(
                'match',
                makeMatch({
                    id: 'm-1',
                    players: [
                        { playerId: 'u1', campaignParticipantId: null },
                        { playerId: 'u2', campaignParticipantId: null },
                    ],
                }),
            );
            await adapter.put(
                'match',
                makeMatch({
                    id: 'm-2',
                    players: [
                        { playerId: 'u3', campaignParticipantId: null },
                        { playerId: 'u4', campaignParticipantId: null },
                    ],
                }),
            );
            await adapter.put(
                'match',
                makeMatch({
                    id: 'm-3',
                    players: [
                        { playerId: 'u2', campaignParticipantId: null },
                        { playerId: 'u5', campaignParticipantId: null },
                    ],
                }),
            );

            const results = await dao.listByPlayer('u2');

            expect(results).toHaveLength(2);
            expect(results.map((item: Match) => item.id).sort()).toEqual(['m-1', 'm-3']);
        });

        it('returns empty array when no matches include the player', async () => {
            await adapter.put(
                'match',
                makeMatch({
                    id: 'm-1',
                    players: [
                        { playerId: 'u1', campaignParticipantId: null },
                        { playerId: 'u2', campaignParticipantId: null },
                    ],
                }),
            );

            const results = await dao.listByPlayer('u3');

            expect(results).toEqual([]);
        });
    });

    describe('BaseDAO CRUD operations (inherited)', () => {
        it('get() retrieves a match by ID', async () => {
            const match = makeMatch({ id: 'm-1' });
            await adapter.put('match', match);

            const retrieved = await dao.get('m-1');

            expect(retrieved).toEqual(match);
        });

        it('get() returns null when match does not exist', async () => {
            const retrieved = await dao.get('missing');

            expect(retrieved).toBeNull();
        });

        it('save() persists a match to the store', async () => {
            const match = makeMatch({ id: 'm-2' });

            await dao.save(match);

            const retrieved = await adapter.get('match', 'm-2');
            expect(retrieved).toEqual(match);
        });

        it('list() returns all matches', async () => {
            await adapter.put('match', makeMatch({ id: 'm-1' }));
            await adapter.put('match', makeMatch({ id: 'm-2' }));

            const all = await dao.list();

            expect(all).toHaveLength(2);
        });

        it('delete() removes a match by ID', async () => {
            const match = makeMatch({ id: 'm-1' });
            await adapter.put('match', match);

            await dao.delete('m-1');

            const retrieved = await adapter.get('match', 'm-1');
            expect(retrieved).toBeNull();
        });

        it('deleteAll() removes all matches from the store', async () => {
            await adapter.put('match', makeMatch({ id: 'm-1' }));
            await adapter.put('match', makeMatch({ id: 'm-2' }));

            await dao.deleteAll();

            const all = await dao.list();
            expect(all).toEqual([]);
        });

        it('count() returns the total number of matches', async () => {
            await adapter.put('match', makeMatch({ id: 'm-1' }));
            await adapter.put('match', makeMatch({ id: 'm-2' }));

            const count = await dao.count();

            expect(count).toBe(2);
        });

        it('saveMany() persists multiple matches at once', async () => {
            const matches = [makeMatch({ id: 'm-1' }), makeMatch({ id: 'm-2' }), makeMatch({ id: 'm-3' })];

            await dao.saveMany(matches);

            const all = await dao.list();
            expect(all).toHaveLength(3);
        });
    });

    describe('Edge cases', () => {
        it('listByPlayer() returns empty array when store is empty', async () => {
            const results = await dao.listByPlayer('u1');

            expect(results).toEqual([]);
        });
    });

    describe('Error handling', () => {
        it('listBySystem() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'getByField').mockRejectedValueOnce(error);

            await expect(dao.listBySystem('wh40k10e')).rejects.toThrow('Adapter failure');
        });

        it('listByPlayer() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'getAll').mockRejectedValueOnce(error);

            await expect(dao.listByPlayer('u1')).rejects.toThrow('Adapter failure');
        });
    });
});
