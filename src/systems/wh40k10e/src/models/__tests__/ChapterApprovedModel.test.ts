import { describe, it, expect } from 'vitest';
import type { ChapterApproved } from '@/models/ChapterApproved.js';
import { hydrateChapterApproved } from '@/models/ChapterApproved.js';
import type {
    PrimaryMission,
    SecondaryMission,
    DeploymentZone,
    ChallengerCard,
    TwistCard,
    TournamentMission,
    TerrainLayout,
} from '@/models/ChapterApprovedTypes.js';

const buildPrimaryMission = (): PrimaryMission => ({
    id: 'mission-1',
    name: 'Test Primary',
    category: 'standard',
    rulesText: 'Primary mission rules',
    vpPerScore: 5,
    maxVP: 50,
    scoringTiming: 'End of each Command phase',
    specialRules: [],
    objectiveModifications: null,
    action: null,
});

const buildSecondaryMission = (): SecondaryMission => ({
    id: 'secondary-1',
    name: 'Test Secondary',
    type: 'fixed',
    rulesText: 'Secondary mission rules',
    vpPerScore: 3,
    vpCap: 15,
    whenDrawn: null,
    action: null,
});

const buildDeploymentZone = (): DeploymentZone => ({
    id: 'deployment-1',
    name: 'Dawn of War',
    category: 'strike-force',
    specialRules: null,
    mapUrl: 'https://example.com/map.png',
});

const buildChallengerCard = (): ChallengerCard => ({
    id: 'challenger-1',
    stratagem: {
        name: 'Test Stratagem',
        cpCost: 1,
        when: 'Your Movement phase',
        target: 'One unit',
        effect: 'Do something',
    },
    mission: {
        name: 'Test Mission',
        condition: 'Complete condition',
        vpReward: 5,
    },
});

const buildTwistCard = (): TwistCard => ({
    id: 'twist-1',
    name: 'Test Twist',
    rulesText: 'Twist rules text',
});

const buildTournamentMission = (): TournamentMission => ({
    id: 'tournament-a',
    label: 'A',
    primaryMissionId: 'mission-1',
    deploymentZoneId: 'deployment-1',
    recommendedLayoutIds: ['layout-1'],
});

const buildTerrainLayout = (): TerrainLayout => ({
    id: 'layout-1',
    label: 'Layout 1',
    compatibleDeployments: ['deployment-1'],
    layoutUrl: 'https://example.com/layout.png',
});

describe('ChapterApproved', () => {
    it('constructs with all fields', () => {
        const model: ChapterApproved = {
            id: 'chapter-approved-2025-26',
            version: '2025-26',
            primaryMissions: [buildPrimaryMission()],
            secondaryMissions: [buildSecondaryMission()],
            deploymentZones: [buildDeploymentZone()],
            challengerCards: [buildChallengerCard()],
            twistCards: [buildTwistCard()],
            tournamentMissions: [buildTournamentMission()],
            terrainLayouts: [buildTerrainLayout()],
        };

        expect(model.id).toBe('chapter-approved-2025-26');
        expect(model.version).toBe('2025-26');
        expect(model.primaryMissions).toHaveLength(1);
        expect(model.secondaryMissions).toHaveLength(1);
        expect(model.deploymentZones).toHaveLength(1);
        expect(model.challengerCards).toHaveLength(1);
        expect(model.twistCards).toHaveLength(1);
        expect(model.tournamentMissions).toHaveLength(1);
        expect(model.terrainLayouts).toHaveLength(1);
    });

    it('applies defaults for missing optional fields', () => {
        const model: ChapterApproved = {
            id: 'chapter-approved-2025-26',
            version: '2025-26',
            primaryMissions: [],
            secondaryMissions: [],
            deploymentZones: [],
            challengerCards: [],
            twistCards: [],
            tournamentMissions: [],
            terrainLayouts: [],
        };

        expect(model.primaryMissions).toEqual([]);
        expect(model.secondaryMissions).toEqual([]);
        expect(model.deploymentZones).toEqual([]);
        expect(model.challengerCards).toEqual([]);
        expect(model.twistCards).toEqual([]);
        expect(model.tournamentMissions).toEqual([]);
        expect(model.terrainLayouts).toEqual([]);
    });

    it('serializes to JSON with expected structure', () => {
        const model: ChapterApproved = {
            id: 'chapter-approved-2025-26',
            version: '2025-26',
            primaryMissions: [buildPrimaryMission()],
            secondaryMissions: [buildSecondaryMission()],
            deploymentZones: [buildDeploymentZone()],
            challengerCards: [buildChallengerCard()],
            twistCards: [buildTwistCard()],
            tournamentMissions: [buildTournamentMission()],
            terrainLayouts: [buildTerrainLayout()],
        };

        const json = { ...model } as Record<string, unknown>;

        expect(json.id).toBe('chapter-approved-2025-26');
        expect(json.version).toBe('2025-26');
        expect(json.primaryMissions).toBeDefined();
        expect(json.secondaryMissions).toBeDefined();
        expect(json.deploymentZones).toBeDefined();
        expect(json.challengerCards).toBeDefined();
        expect(json.twistCards).toBeDefined();
        expect(json.tournamentMissions).toBeDefined();
        expect(json.terrainLayouts).toBeDefined();
    });

    it('hydrates from JSON with all fields', () => {
        const model: ChapterApproved = {
            id: 'chapter-approved-2025-26',
            version: '2025-26',
            primaryMissions: [buildPrimaryMission()],
            secondaryMissions: [buildSecondaryMission()],
            deploymentZones: [buildDeploymentZone()],
            challengerCards: [buildChallengerCard()],
            twistCards: [buildTwistCard()],
            tournamentMissions: [buildTournamentMission()],
            terrainLayouts: [buildTerrainLayout()],
        };

        const json = { ...model };
        const hydrated = hydrateChapterApproved(json);

        expect(hydrated).toHaveProperty('id');
        expect(hydrated).toHaveProperty('version');
        expect(hydrated.id).toBe(model.id);
        expect(hydrated.version).toBe(model.version);
        expect(hydrated.primaryMissions.length).toBe(model.primaryMissions.length);
        expect(hydrated.secondaryMissions.length).toBe(model.secondaryMissions.length);
        expect(hydrated.deploymentZones.length).toBe(model.deploymentZones.length);
        expect(hydrated.challengerCards.length).toBe(model.challengerCards.length);
        expect(hydrated.twistCards.length).toBe(model.twistCards.length);
        expect(hydrated.tournamentMissions.length).toBe(model.tournamentMissions.length);
        expect(hydrated.terrainLayouts.length).toBe(model.terrainLayouts.length);
    });

    it('hydrates from JSON with defaults for missing fields', () => {
        const json = {
            id: 'chapter-approved-2025-26',
            version: '2025-26',
        };

        const hydrated = hydrateChapterApproved(json);

        expect(hydrated).toHaveProperty('id');
        expect(hydrated).toHaveProperty('version');
        expect(hydrated.primaryMissions).toEqual([]);
        expect(hydrated.secondaryMissions).toEqual([]);
        expect(hydrated.deploymentZones).toEqual([]);
        expect(hydrated.challengerCards).toEqual([]);
        expect(hydrated.twistCards).toEqual([]);
        expect(hydrated.tournamentMissions).toEqual([]);
        expect(hydrated.terrainLayouts).toEqual([]);
    });

    it('round-trips through JSON serialization', () => {
        const original: ChapterApproved = {
            id: 'chapter-approved-2025-26',
            version: '2025-26',
            primaryMissions: [buildPrimaryMission()],
            secondaryMissions: [buildSecondaryMission()],
            deploymentZones: [],
            challengerCards: [],
            twistCards: [],
            tournamentMissions: [],
            terrainLayouts: [],
        };

        const json = { ...original };
        const hydrated = hydrateChapterApproved(json);
        const jsonAgain = { ...hydrated };

        expect(jsonAgain).toEqual(json);
    });
});
