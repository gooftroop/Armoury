import { describe, it, expect } from 'vitest';
import type { Account } from '@models/AccountModel.js';
import type { Army, ArmyUnit, ArmyVersion } from '@wh40k10e/models/ArmyModel.js';
import type { Friend } from '@models/FriendModel.js';
import type { Match } from '@models/MatchModel.js';
import type { Campaign, CampaignParticipant } from '@models/CampaignModel.js';
import type { CrusadeRules } from '@wh40k10e/models/CrusadeRulesModel.js';
import type { CrusadeParticipantData } from '@wh40k10e/models/CampaignModel.js';

const buildAccount = (): Account => ({
    id: 'auth0|user-1',
    userId: 'auth0|user-1',
    preferences: {
        theme: 'dark',
        language: 'en',
        notificationsEnabled: true,
    },
    systems: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const buildArmyUnit = (): ArmyUnit => ({
    id: 'army-unit-1',
    unitId: 'unit-1',
    modelCount: 5,
    totalPoints: 100,
    modelConfigs: [],
    wargearSelections: [],
    enhancement: null,
    leadingUnitId: null,
});

const buildArmyVersion = (): ArmyVersion => ({
    version: 1,
    savedAt: '2024-01-01T00:00:00Z',
    units: [buildArmyUnit()],
    totalPoints: 100,
});

const buildArmy = (): Army => ({
    id: 'army-1',
    ownerId: 'auth0|user-1',
    name: 'Test Army',
    factionId: 'necrons',
    detachmentId: null,
    warlordUnitId: 'army-unit-1',
    battleSize: 'StrikeForce',
    pointsLimit: 2000,
    units: [buildArmyUnit()],
    totalPoints: 100,
    notes: 'Test notes',
    versions: [buildArmyVersion()],
    currentVersion: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const buildFriend = (): Friend => ({
    id: 'friend-1',
    ownerId: 'auth0|user-1',
    userId: 'auth0|user-2',
    status: 'pending',
    canShareArmyLists: true,
    canViewMatchHistory: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const buildMatch = (): Match => ({
    id: 'match-1',
    systemId: 'wh40k10e',
    players: [
        { playerId: 'auth0|user-1', campaignParticipantId: null },
        { playerId: 'auth0|user-2', campaignParticipantId: null },
    ],
    turn: { activePlayerId: 'auth0|user-1', turnOrder: ['auth0|user-1', 'auth0|user-2'], turnNumber: 1 },
    score: {
        totalsByPlayerId: { 'auth0|user-1': 15, 'auth0|user-2': 10 },
        events: [
            { playerId: 'auth0|user-1', points: 15, reason: 'primary', recordedAt: '2024-01-01T01:00:00Z' },
            { playerId: 'auth0|user-2', points: 10, reason: 'primary', recordedAt: '2024-01-01T01:00:00Z' },
        ],
    },
    outcome: {
        status: 'completed',
        resultsByPlayerId: { 'auth0|user-1': 'win', 'auth0|user-2': 'loss' },
    },
    campaignId: null,
    matchData: null,
    notes: 'Match notes',
    playedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const buildCampaign = (): Campaign => ({
    id: 'campaign-1',
    name: 'Test Campaign',
    type: 'wh40k10e-crusade',
    organizerId: 'auth0|user-1',
    narrative: { schemaVersion: 1, narrative: '' },
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
    status: 'active',
    phases: [
        {
            id: 'phase-1',
            name: 'Incursion',
            order: 1,
            pointsLimit: 1000,
            matchesRequired: 2,
            notes: '',
            customRules: [],
            startDate: '2024-01-01T00:00:00Z',
            endDate: null,
        },
    ],
    customRules: [],
    rankings: [
        {
            participantId: 'participant-1',
            userId: 'auth0|user-1',
            displayName: 'User One',
            rank: 1,
            wins: 1,
            losses: 0,
            draws: 0,
            totalVP: 15,
        },
    ],
    participantIds: ['participant-1'],
    matchIds: ['match-1'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const buildCampaignParticipant = (): CampaignParticipant => ({
    id: 'participant-1',
    campaignId: 'campaign-1',
    userId: 'auth0|user-1',
    displayName: 'User One',
    isOrganizer: true,
    armyId: 'army-1',
    armyName: 'Test Army',
    currentPhaseId: 'phase-1',
    matchesInCurrentPhase: 1,
    participantData: {
        crusadePoints: 5,
        requisitionPoints: 2,
        supplyLimit: 1000,
        unitProgressions: [
            {
                armyUnitId: 'army-unit-1',
                experiencePoints: 5,
                rank: 'Battle-ready',
                battleTally: 1,
                killCount: 2,
                markedForGreatnessCount: 0,
                battleHonours: [],
                battleScars: [],
                crusadePoints: 0,
            },
        ],
    } as Record<string, unknown>,
    matchIds: ['match-1'],
    joinedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const buildCrusadeRules = (): CrusadeRules => ({
    id: 'crusade-rules-1',
    source: 'core',
    name: 'Crusade Core Rules',
    version: '1.0',
    startingSupplyLimit: 1000,
    startingRequisitionPoints: 5,
    rpPerBattle: 1,
    rankThresholds: [{ rank: 'Battle-ready', minXP: 0, battleHonoursAllowed: 0 }],
    xpGainRules: [
        {
            id: 'xp-1',
            name: 'Battle Ready',
            amount: 1,
            description: 'Gain XP after battle.',
            appliesTo: 'allParticipating',
        },
    ],
    requisitions: [
        {
            id: 'req-1',
            name: 'Warlord Trait',
            costRP: 1,
            description: 'Gain a warlord trait.',
            timing: 'anyTime',
            restrictions: [],
        },
    ],
    battleHonours: [
        {
            id: 'honour-1',
            type: 'BattleTrait',
            name: 'Veteran',
            description: 'Improved battle prowess.',
            applicableTo: ['Infantry'],
        },
    ],
    battleScars: [
        {
            id: 'scar-1',
            name: 'Crippled',
            description: 'Movement reduced.',
            effect: 'Move reduced',
            severity: 'mild',
            removable: true,
        },
    ],
    agendas: [
        {
            id: 'agenda-1',
            name: 'Purge',
            category: 'PurgeTheEnemy',
            description: 'Destroy enemy units.',
            xpReward: 2,
        },
    ],
    narrative: 'Narrative text',
    sourceMechanics: {
        armageddon: {
            requisitions: [],
            battleHonours: [],
        },
        blackstone: {
            upgrades: [],
            corruptionRules: 'Corruption rules',
        },
    },
});

describe('Data Models', () => {
    it('supports Account shape', () => {
        const account = buildAccount();
        expect(account.preferences.theme).toBe('dark');
        expect(account.userId).toBe('auth0|user-1');
    });

    it('supports Army shape', () => {
        const army = buildArmy();
        expect(army.units).toHaveLength(1);
        expect(army.battleSize).toBe('StrikeForce');
    });

    it('supports Friend shape', () => {
        const friend = buildFriend();
        expect(friend.status).toBe('pending');
        expect(friend.canShareArmyLists).toBe(true);
    });

    it('supports Match shape', () => {
        const match = buildMatch();
        expect(match.outcome.status).toBe('completed');
        expect(match.score?.totalsByPlayerId['auth0|user-1']).toBe(15);
    });

    it('supports Campaign shape', () => {
        const campaign = buildCampaign();
        expect(campaign.status).toBe('active');
        expect(campaign.phases[0]?.pointsLimit).toBe(1000);
    });

    it('supports CampaignParticipant shape', () => {
        const participant = buildCampaignParticipant();
        expect(participant.isOrganizer).toBe(true);
        const crusadeData = participant.participantData as CrusadeParticipantData | null;
        expect(crusadeData?.unitProgressions[0]?.rank).toBe('Battle-ready');
    });

    it('supports CrusadeRules shape', () => {
        const rules = buildCrusadeRules();
        expect(rules.source).toBe('core');
        expect(rules.rankThresholds[0]?.rank).toBe('Battle-ready');
    });
});
