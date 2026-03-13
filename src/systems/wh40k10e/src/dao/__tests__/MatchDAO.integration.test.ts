import { describe, it, expect, beforeEach } from 'vitest';
import { MatchDAO } from '@/dao/MatchDAO.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { makeMatch } from '../../../e2e/__fixtures__/makeMatch.js';
import type { Match as CoreMatch, MatchOutcome, MatchPlayer, MatchScore, MatchTurn } from '@armoury/models';
import type { MatchData } from '@/models/MatchData.js';
import { Match } from '@/models/Match.js';

function makeMatchPlayers(overrides: Partial<MatchPlayer> = {}): MatchPlayer[] {
    return [
        {
            playerId: 'auth0|user-1',
            campaignParticipantId: null,
            ...overrides,
        },
        {
            playerId: 'auth0|user-2',
            campaignParticipantId: null,
        },
    ];
}

function makeMatchTurn(overrides: Partial<MatchTurn> = {}): MatchTurn {
    return {
        activePlayerId: null,
        turnOrder: ['auth0|user-1', 'auth0|user-2'],
        turnNumber: 0,
        ...overrides,
    };
}

function makeMatchOutcome(overrides: Partial<MatchOutcome> = {}): MatchOutcome {
    return {
        status: 'setup',
        resultsByPlayerId: {},
        ...overrides,
    };
}

function makeMatchScore(overrides: Partial<MatchScore> = {}): MatchScore {
    return {
        totalsByPlayerId: { 'auth0|user-1': 5, 'auth0|user-2': 3 },
        events: [
            {
                playerId: 'auth0|user-1',
                points: 5,
                reason: 'primary',
                recordedAt: '2025-06-15T14:10:00Z',
            },
        ],
        ...overrides,
    };
}

function makeMatchData(overrides: Partial<MatchData> = {}): MatchData {
    return {
        systemId: 'wh40k10e',
        schemaVersion: 1,
        config: {
            battleSize: 'StrikeForce',
            pointsLimit: 2000,
            missionId: 'mission-1',
            deploymentTypeId: 'deployment-1',
            gambitByPlayerId: {
                'auth0|user-1': 'gambit-1',
                'auth0|user-2': 'gambit-2',
            },
            secondariesByPlayerId: {
                'auth0|user-1': {
                    type: 'fixed',
                    missions: [
                        {
                            id: 'sec-1',
                            name: 'Behind Enemy Lines',
                            scored: false,
                            vpEarned: 0,
                        },
                    ],
                },
                'auth0|user-2': {
                    type: 'tactical',
                    missions: [],
                },
            },
        },
        gameState: {
            round: 1,
            phase: 'Command',
            activePlayerId: 'auth0|user-1',
            deployment: {
                deploymentOrder: ['auth0|user-1', 'auth0|user-2'],
                activeDeployerIndex: 0,
                complete: false,
            },
            gameEnded: false,
        },
        playerStateById: {
            'auth0|user-1': {
                isAttacker: true,
                commandPoints: 1,
                secondaries: {
                    type: 'fixed',
                    missions: [
                        {
                            id: 'sec-1',
                            name: 'Behind Enemy Lines',
                            scored: false,
                            vpEarned: 0,
                        },
                    ],
                },
                armyProjection: {
                    armyId: 'army-1',
                    factionId: 'space-marines',
                    detachmentId: 'gladius-task-force',
                    unitsByArmyUnitId: {
                        'unit-1': {
                            unitId: 'datasheet-1',
                            modelWounds: { Sergeant: 2 },
                            kills: 1,
                            flags: {
                                battleShocked: false,
                                advanced: false,
                                fellBack: false,
                                moved: false,
                                inDeepStrike: false,
                                inStrategicReserve: false,
                                performingAction: false,
                                hasShot: false,
                                hasCharged: false,
                                hasFought: false,
                                engaged: false,
                            },
                        },
                    },
                },
            },
            'auth0|user-2': {
                isAttacker: false,
                commandPoints: 2,
                secondaries: {
                    type: 'tactical',
                    missions: [],
                },
                armyProjection: {
                    armyId: 'army-2',
                    factionId: 'necrons',
                    detachmentId: null,
                    unitsByArmyUnitId: {},
                },
            },
        },
        ...overrides,
    };
}

function makeCoreMatch(overrides: Partial<CoreMatch<MatchData>> = {}): CoreMatch<MatchData> {
    return makeMatch({
        matchData: makeMatchData() as unknown as CoreMatch['matchData'],
        players: makeMatchPlayers(),
        turn: makeMatchTurn(),
        score: makeMatchScore(),
        outcome: makeMatchOutcome(),
        ...(overrides as Partial<CoreMatch>),
    }) as unknown as CoreMatch<MatchData>;
}

describe('MatchDAO integration tests', () => {
    let adapter: MockDatabaseAdapter;
    let dao: MatchDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new MatchDAO(adapter);
    });

    it('should save and get a match', async () => {
        const match = makeCoreMatch({ id: 'match-1' });
        await dao.save(match);

        const result = await dao.get(match.id);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(match.id);
        expect(result!.systemId).toBe('wh40k10e');
    });

    it('should list all matches', async () => {
        await dao.save(makeCoreMatch({ id: 'match-1' }));
        await dao.save(makeCoreMatch({ id: 'match-2' }));

        const results = await dao.list();
        expect(results).toHaveLength(2);
    });

    it('should delete a match', async () => {
        await dao.save(makeCoreMatch({ id: 'match-delete' }));
        await dao.delete('match-delete');

        const result = await dao.get('match-delete');
        expect(result).toBeNull();
    });

    it('should return a typed Match instance from getTyped', async () => {
        const match = makeCoreMatch({ id: 'match-typed' });
        await dao.save(match);

        const result = await dao.getTyped('match-typed');
        expect(result).toBeInstanceOf(Match);
        expect(result!.id).toBe('match-typed');
        expect(result!.data.systemId).toBe('wh40k10e');
    });

    it('should list typed matches filtered by systemId', async () => {
        await dao.save(makeCoreMatch({ id: 'match-1' }));
        const otherMatch = makeMatch({
            id: 'match-2',
            systemId: 'other-system',
            matchData: null,
        }) as unknown as CoreMatch<MatchData>;
        await dao.save(otherMatch);
        await dao.save(makeCoreMatch({ id: 'match-3' }));

        const results = await dao.listTyped();
        expect(results).toHaveLength(2);
        expect(results.every((item) => item.data.systemId === 'wh40k10e')).toBe(true);
    });

    it('should list matches by player', async () => {
        await dao.save(makeCoreMatch({ id: 'match-1', players: makeMatchPlayers() }));
        await dao.save(
            makeCoreMatch({
                id: 'match-2',
                players: makeMatchPlayers({ playerId: 'auth0|user-3' }),
            }),
        );

        const results = await dao.listByPlayer('auth0|user-1');
        expect(results).toHaveLength(1);
        expect(results[0]!.id).toBe('match-1');
    });

    it('should list matches by campaign', async () => {
        await dao.save(makeCoreMatch({ id: 'match-1', campaignId: 'campaign-1' }));
        await dao.save(makeCoreMatch({ id: 'match-2', campaignId: 'campaign-2' }));
        await dao.save(makeCoreMatch({ id: 'match-3', campaignId: 'campaign-1' }));

        const results = await dao.listByCampaign('campaign-1');
        expect(results).toHaveLength(2);
    });

    it('should preserve JSONB fields through round-trip', async () => {
        const match = makeCoreMatch({
            players: makeMatchPlayers({ campaignParticipantId: 'participant-1' }),
            turn: makeMatchTurn({ activePlayerId: 'auth0|user-1', turnNumber: 3 }),
            score: makeMatchScore({
                totalsByPlayerId: { 'auth0|user-1': 12, 'auth0|user-2': 8 },
            }),
            outcome: makeMatchOutcome({ status: 'in_progress' }),
            matchData: makeMatchData({
                gameState: {
                    round: 2,
                    phase: 'Shooting',
                    activePlayerId: 'auth0|user-1',
                    deployment: {
                        deploymentOrder: ['auth0|user-1', 'auth0|user-2'],
                        activeDeployerIndex: 1,
                        complete: true,
                    },
                    gameEnded: false,
                },
            }),
        });
        await dao.save(match);

        const result = await dao.get(match.id);
        expect(result!.players).toEqual(match.players);
        expect(result!.turn).toEqual(match.turn);
        expect(result!.score).toEqual(match.score);
        expect(result!.outcome).toEqual(match.outcome);
        expect(result!.matchData).toEqual(match.matchData);
    });
});
