import { describe, it, expect } from 'vitest';
import type { Match as CoreMatch } from '@armoury/models';
import type { MatchData } from '@/models/MatchData.js';
import { createDefaultUnitFlags, createDefaultGameState } from '@/models/MatchData.js';
import { Match } from '@/models/Match.js';

function buildMatchData(): MatchData {
    return {
        systemId: 'wh40k10e',
        schemaVersion: 1,
        config: {
            battleSize: 'StrikeForce',
            pointsLimit: 2000,
            missionId: 'sites-of-power',
            deploymentTypeId: 'dawn-of-war',
            gambitByPlayerId: {},
            secondariesByPlayerId: {
                'user-1': { type: 'tactical', missions: [] },
                'user-2': { type: 'fixed', missions: [] },
            },
        },
        gameState: {
            round: 1,
            phase: 'Command',
            activePlayerId: 'user-1',
            deployment: { deploymentOrder: ['user-1', 'user-2'], activeDeployerIndex: 0, complete: true },
            gameEnded: false,
        },
        playerStateById: {
            'user-1': {
                isAttacker: true,
                commandPoints: 1,
                secondaries: { type: 'tactical', missions: [] },
                armyProjection: {
                    armyId: 'army-1',
                    factionId: 'space-marines',
                    detachmentId: 'gladius',
                    unitsByArmyUnitId: {
                        'au-1': {
                            unitId: 'intercessors',
                            modelWounds: {
                                Sergeant: 2,
                                'Intercessor 1': 2,
                                'Intercessor 2': 2,
                                'Intercessor 3': 2,
                                'Intercessor 4': 2,
                            },
                            kills: 0,
                            flags: createDefaultUnitFlags(),
                        },
                    },
                },
            },
            'user-2': {
                isAttacker: false,
                commandPoints: 1,
                secondaries: { type: 'fixed', missions: [] },
                armyProjection: {
                    armyId: 'army-2',
                    factionId: 'necrons',
                    detachmentId: 'awakened-dynasty',
                    unitsByArmyUnitId: {
                        'au-2': {
                            unitId: 'warriors',
                            modelWounds: {
                                'Warrior 1': 1,
                                'Warrior 2': 1,
                                'Warrior 3': 1,
                                'Warrior 4': 1,
                                'Warrior 5': 1,
                            },
                            kills: 0,
                            flags: createDefaultUnitFlags(),
                        },
                    },
                },
            },
        },
    };
}

function buildCoreMatch(): CoreMatch<MatchData> {
    return {
        id: 'match-1',
        systemId: 'wh40k10e',
        players: [
            { playerId: 'user-1', campaignParticipantId: null },
            { playerId: 'user-2', campaignParticipantId: null },
        ],
        turn: { activePlayerId: 'user-1', turnOrder: ['user-1', 'user-2'], turnNumber: 1 },
        score: { totalsByPlayerId: { 'user-1': 0, 'user-2': 0 }, events: [] },
        outcome: { status: 'in_progress', resultsByPlayerId: {} },
        campaignId: null,
        matchData: buildMatchData(),
        notes: '',
        playedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
    };
}

describe('MatchData', () => {
    it('round-trips through JSON serialization', () => {
        const data = buildMatchData();
        const json = JSON.parse(JSON.stringify(data));
        expect(json).toEqual(data);
    });

    it('contains all required fields', () => {
        const data = buildMatchData();
        expect(data.systemId).toBe('wh40k10e');
        expect(data.schemaVersion).toBe(1);
        expect(data.config.battleSize).toBe('StrikeForce');
        expect(data.config.missionId).toBe('sites-of-power');
        expect(data.config.deploymentTypeId).toBe('dawn-of-war');
        expect(data.gameState.round).toBe(1);
        expect(data.gameState.phase).toBe('Command');
        expect(Object.keys(data.playerStateById)).toHaveLength(2);
    });

    it('supports all game phases', () => {
        const phases = ['Setup', 'Deployment', 'Command', 'Movement', 'Shooting', 'Charge', 'Fight', 'End'] as const;
        const data = buildMatchData();

        for (const phase of phases) {
            data.gameState.phase = phase;
            expect(data.gameState.phase).toBe(phase);
        }
    });

    it('tracks per-model wounds correctly', () => {
        const data = buildMatchData();
        const unit = data.playerStateById['user-1']!.armyProjection.unitsByArmyUnitId['au-1']!;
        expect(unit.modelWounds).toEqual({
            Sergeant: 2,
            'Intercessor 1': 2,
            'Intercessor 2': 2,
            'Intercessor 3': 2,
            'Intercessor 4': 2,
        });
        expect(unit.kills).toBe(0);
    });
});

describe('createDefaultUnitFlags', () => {
    it('returns all flags as false', () => {
        const flags = createDefaultUnitFlags();

        for (const value of Object.values(flags)) {
            expect(value).toBe(false);
        }
    });
});

describe('createDefaultGameState', () => {
    it('returns Setup phase with round 0', () => {
        const state = createDefaultGameState();
        expect(state.round).toBe(0);
        expect(state.phase).toBe('Setup');
        expect(state.activePlayerId).toBeNull();
        expect(state.gameEnded).toBe(false);
    });
});

describe('Match', () => {
    it('creates from a valid Match<MatchData>', () => {
        const match = Match.fromMatch(buildCoreMatch());
        expect(match.id).toBe('match-1');
        expect(match.config.battleSize).toBe('StrikeForce');
        expect(match.round).toBe(1);
        expect(match.phase).toBe('Command');
    });

    it('throws if matchData is null', () => {
        const coreMatch = { ...buildCoreMatch(), matchData: null as unknown as MatchData };
        expect(() => Match.fromMatch(coreMatch)).toThrow('matchData is null');
    });

    it('throws if systemId is wrong', () => {
        const data = { ...buildMatchData(), systemId: 'wrong' as 'wh40k10e' };
        const coreMatch = { ...buildCoreMatch(), matchData: data };
        expect(() => Match.fromMatch(coreMatch)).toThrow("expected systemId 'wh40k10e'");
    });

    it('applyDamage reduces model wounds', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const updated = wm.applyDamage('user-1', 'au-1', 'Sergeant', 1);
        const unit = updated.getUnitProjection('user-1', 'au-1')!;
        expect(unit.modelWounds['Sergeant']).toBe(1);
    });

    it('applyDamage clamps wounds at 0', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const updated = wm.applyDamage('user-1', 'au-1', 'Sergeant', 99);
        const unit = updated.getUnitProjection('user-1', 'au-1')!;
        expect(unit.modelWounds['Sergeant']).toBe(0);
    });

    it('recordKill increments kill counter', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const updated = wm.recordKill('user-1', 'au-1', 3);
        expect(updated.getUnitProjection('user-1', 'au-1')!.kills).toBe(3);
    });

    it('setUnitFlag sets individual flags', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const updated = wm.setUnitFlag('user-1', 'au-1', 'advanced', true);
        expect(updated.getUnitProjection('user-1', 'au-1')!.flags.advanced).toBe(true);
    });

    it('resetUnitFlags clears all flags', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const withFlags = wm
            .setUnitFlag('user-1', 'au-1', 'advanced', true)
            .setUnitFlag('user-1', 'au-1', 'hasShot', true);
        const reset = withFlags.resetUnitFlags('user-1');
        const flags = reset.getUnitProjection('user-1', 'au-1')!.flags;
        expect(flags.advanced).toBe(false);
        expect(flags.hasShot).toBe(false);
    });

    it('setCommandPoints updates command points', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const updated = wm.setCommandPoints('user-1', 5);
        expect(updated.getCommandPoints('user-1')).toBe(5);
    });

    it('advancePhase moves to next phase', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const moved = wm.advancePhase();
        expect(moved.phase).toBe('Movement');
    });

    it('advancePhase wraps to next player turn after End', () => {
        const coreMatch = buildCoreMatch();
        coreMatch.matchData!.gameState.phase = 'Fight';
        const wm = Match.fromMatch(coreMatch);
        const atEnd = wm.advancePhase();
        expect(atEnd.phase).toBe('End');
        const nextTurn = atEnd.advancePhase();
        expect(nextTurn.phase).toBe('Command');
        expect(nextTurn.gameState.activePlayerId).toBe('user-2');
    });

    it('advancePhase ends the game after round 5', () => {
        const coreMatch = buildCoreMatch();
        coreMatch.matchData!.gameState.round = 5;
        coreMatch.matchData!.gameState.phase = 'Fight';
        coreMatch.matchData!.gameState.activePlayerId = 'user-2';
        coreMatch.turn.turnOrder = ['user-1', 'user-2'];
        const wm = Match.fromMatch(coreMatch);
        const atEnd = wm.advancePhase();
        const ended = atEnd.advancePhase();
        expect(ended.gameState.gameEnded).toBe(true);
    });

    it('mutations are immutable (original unchanged)', () => {
        const wm = Match.fromMatch(buildCoreMatch());
        const updated = wm.applyDamage('user-1', 'au-1', 'Sergeant', 1);
        expect(wm.getUnitProjection('user-1', 'au-1')!.modelWounds['Sergeant']).toBe(2);
        expect(updated.getUnitProjection('user-1', 'au-1')!.modelWounds['Sergeant']).toBe(1);
    });
});
