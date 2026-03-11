import { describe, it, expect } from 'vitest';
import type {
    Campaign,
    CampaignParticipant,
    CampaignPhase,
    CampaignRanking,
    CustomNarrative,
} from '@armoury/models/CampaignModel';
import type {
    CrusadeParticipantData,
    CrusadeUnitProgression,
    CrusadeBattleHonour,
    CrusadeBattleScar,
} from '@/models/CampaignModel.js';

const buildCampaignPhase = (id: string = 'phase-1', order: number = 1): CampaignPhase => ({
    id,
    name: 'Incursion',
    order,
    pointsLimit: 1000,
    matchesRequired: 2,
    notes: 'Phase notes',
    narrative: { schemaVersion: 1, narrative: 'Phase narrative' },
    customRules: ['No Flyers'],
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
});

const buildCampaignRanking = (participantId: string = 'participant-1'): CampaignRanking => ({
    participantId,
    userId: 'auth0|user-1',
    displayName: 'User One',
    rank: 1,
    wins: 2,
    losses: 0,
    draws: 1,
    totalVP: 25,
});

const buildCustomNarrative = (): CustomNarrative => ({
    schemaVersion: 1,
    narrative: '',
});

const buildCampaign = (id: string = 'campaign-1'): Campaign => ({
    id,
    name: 'Armageddon Campaign 2026',
    type: 'wh40k10e-crusade',
    organizerId: 'auth0|user-1',
    narrative: buildCustomNarrative(),
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
    status: 'active',
    phases: [buildCampaignPhase('phase-1', 1), buildCampaignPhase('phase-2', 2)],
    customRules: ['Crusade Points x2'],
    rankings: [buildCampaignRanking('participant-1')],
    participantIds: ['participant-1', 'participant-2'],
    matchIds: ['match-1', 'match-2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
});

const buildBattleHonour = (id: string = 'honour-1'): CrusadeBattleHonour => ({
    id,
    type: 'BattleTrait',
    name: 'Veteran',
    description: 'Improved battle prowess',
    earnedInMatchId: 'match-1',
    earnedAt: '2024-01-01T00:00:00Z',
});

const buildBattleScar = (id: string = 'scar-1'): CrusadeBattleScar => ({
    id,
    name: 'Crippled',
    description: 'Movement reduced',
    gainedInMatchId: 'match-1',
    gainedAt: '2024-01-01T00:00:00Z',
    removed: false,
    removedAt: null,
});

const buildCrusadeUnitProgression = (armyUnitId: string = 'army-unit-1'): CrusadeUnitProgression => ({
    armyUnitId,
    experiencePoints: 10,
    rank: 'Battle-ready',
    battleTally: 2,
    killCount: 5,
    markedForGreatnessCount: 1,
    battleHonours: [buildBattleHonour()],
    battleScars: [buildBattleScar()],
    crusadePoints: 2,
});

const buildCrusadeParticipantData = (): CrusadeParticipantData => ({
    crusadePoints: 10,
    requisitionPoints: 3,
    supplyLimit: 1000,
    unitProgressions: [buildCrusadeUnitProgression()],
});

const buildCampaignParticipant = (id: string = 'participant-1'): CampaignParticipant => ({
    id,
    campaignId: 'campaign-1',
    userId: 'auth0|user-1',
    displayName: 'User One',
    isOrganizer: true,
    armyId: 'army-1',
    armyName: 'Ultramarines Strike Force',
    currentPhaseId: 'phase-1',
    matchesInCurrentPhase: 1,
    participantData: buildCrusadeParticipantData() as unknown as Record<string, unknown>,
    matchIds: ['match-1', 'match-2'],
    joinedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
});

describe('Campaign', () => {
    it('constructs with required fields', () => {
        const campaign = buildCampaign();
        expect(campaign.id).toBe('campaign-1');
        expect(campaign.name).toBe('Armageddon Campaign 2026');
        expect(campaign.type).toBe('wh40k10e-crusade');
        expect(campaign.organizerId).toBe('auth0|user-1');
        expect(campaign.status).toBe('active');
    });

    it('serializes to JSON with all fields preserved', () => {
        const campaign = buildCampaign();
        const json = JSON.parse(JSON.stringify(campaign)) as Record<string, unknown>;
        expect(json.id).toBe('campaign-1');
        expect(json.name).toBe('Armageddon Campaign 2026');
        expect(json.type).toBe('wh40k10e-crusade');
        expect(json.organizerId).toBe('auth0|user-1');
        expect(json.status).toBe('active');
        expect(json.phases).toBeDefined();
        expect(json.rankings).toBeDefined();
        expect(json.participantIds).toBeDefined();
        expect(json.matchIds).toBeDefined();
        expect(json.createdAt).toBe('2024-01-01T00:00:00Z');
        expect(json.updatedAt).toBe('2024-01-01T12:00:00Z');
    });

    it('hydrates from JSON into a Campaign object', () => {
        const original = buildCampaign();
        const json = JSON.parse(JSON.stringify(original));
        const hydrated = json as Campaign;
        expect(hydrated.id).toBe(original.id);
        expect(hydrated.name).toBe(original.name);
        expect(hydrated.phases.length).toBe(original.phases.length);
        expect(hydrated.rankings.length).toBe(original.rankings.length);
    });

    it('round-trip: Campaign → JSON → Campaign preserves all data', () => {
        const original = buildCampaign();
        const json = JSON.parse(JSON.stringify(original));
        const hydrated = json as Campaign;
        expect(hydrated).toEqual(original);
    });

    it('supports optional fields (endDate, campaignData)', () => {
        const campaign: Campaign = {
            ...buildCampaign(),
            endDate: null,
            campaignData: undefined,
        };
        expect(campaign.endDate).toBeNull();
        expect(campaign.campaignData).toBeUndefined();
        const json = JSON.parse(JSON.stringify(campaign));
        expect(json.endDate).toBeNull();
    });

    it('supports all campaign statuses (upcoming, active, completed, cancelled)', () => {
        const statuses = ['upcoming', 'active', 'completed', 'cancelled'] as const;
        statuses.forEach((status) => {
            const campaign = buildCampaign();
            campaign.status = status;
            const json = JSON.parse(JSON.stringify(campaign));
            expect(json.status).toBe(status);
        });
    });

    it('supports all campaign types (crusade, generic)', () => {
        const types = ['wh40k10e-crusade', 'wh40k10e-generic'] as const;
        types.forEach((type) => {
            const campaign = buildCampaign();
            campaign.type = type;
            const json = JSON.parse(JSON.stringify(campaign));
            expect(json.type).toBe(type);
        });
    });
});

describe('CampaignParticipant', () => {
    it('constructs with required fields', () => {
        const participant = buildCampaignParticipant();
        expect(participant.id).toBe('participant-1');
        expect(participant.campaignId).toBe('campaign-1');
        expect(participant.userId).toBe('auth0|user-1');
        expect(participant.isOrganizer).toBe(true);
    });

    it('serializes to JSON with all fields preserved', () => {
        const participant = buildCampaignParticipant();
        const json = JSON.parse(JSON.stringify(participant)) as Record<string, unknown>;
        expect(json.id).toBe('participant-1');
        expect(json.campaignId).toBe('campaign-1');
        expect(json.userId).toBe('auth0|user-1');
        expect(json.displayName).toBe('User One');
        expect(json.isOrganizer).toBe(true);
        expect(json.armyId).toBe('army-1');
        expect(json.armyName).toBe('Ultramarines Strike Force');
        expect(json.currentPhaseId).toBe('phase-1');
        expect(json.matchesInCurrentPhase).toBe(1);
        expect(json.participantData).toBeDefined();
        expect(json.matchIds).toBeDefined();
        expect(json.joinedAt).toBe('2024-01-01T00:00:00Z');
        expect(json.updatedAt).toBe('2024-01-01T12:00:00Z');
    });

    it('hydrates from JSON into a CampaignParticipant object', () => {
        const original = buildCampaignParticipant();
        const json = JSON.parse(JSON.stringify(original));
        const hydrated = json as CampaignParticipant;
        expect(hydrated.id).toBe(original.id);
        expect(hydrated.campaignId).toBe(original.campaignId);
        expect(hydrated.matchIds.length).toBe(original.matchIds.length);
    });

    it('round-trip: CampaignParticipant → JSON → CampaignParticipant preserves all data', () => {
        const original = buildCampaignParticipant();
        const json = JSON.parse(JSON.stringify(original));
        const hydrated = json as CampaignParticipant;
        expect(hydrated).toEqual(original);
    });

    it('supports optional participantData (null for generic campaigns)', () => {
        const participant: CampaignParticipant = {
            ...buildCampaignParticipant(),
            participantData: null,
        };
        expect(participant.participantData).toBeNull();
        const json = JSON.parse(JSON.stringify(participant));
        expect(json.participantData).toBeNull();
    });

    it('serializes crusade progression with honours and scars', () => {
        const participant = buildCampaignParticipant();
        const json = JSON.parse(JSON.stringify(participant));
        const hydrated = json as CampaignParticipant;
        const crusadeData = hydrated.participantData as CrusadeParticipantData | null;
        expect(crusadeData?.unitProgressions[0]?.battleHonours).toHaveLength(1);
        expect(crusadeData?.unitProgressions[0]?.battleScars).toHaveLength(1);
        expect(crusadeData?.unitProgressions[0]?.rank).toBe('Battle-ready');
    });
});
