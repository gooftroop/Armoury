import type {
    Campaign,
    CampaignParticipant,
} from '@models/CampaignModel.js';

export function makeCoreCampaign(overrides: Partial<Campaign> = {}): Campaign {
    return {
        id: 'campaign-1',
        name: 'Test Campaign',
        type: 'custom',
        organizerId: 'auth0|organizer-1',
        narrative: { schemaVersion: 1, narrative: '' },
        startDate: '2025-06-01T00:00:00Z',
        endDate: null,
        status: 'upcoming',
        phases: [],
        customRules: [],
        rankings: [],
        participantIds: [],
        matchIds: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

export function makeCampaignParticipant(overrides: Partial<CampaignParticipant> = {}): CampaignParticipant {
    return {
        id: 'campaign-1:auth0|user-1',
        campaignId: 'campaign-1',
        userId: 'auth0|user-1',
        displayName: 'Player One',
        isOrganizer: false,
        armyId: 'army-1',
        armyName: 'Space Marines',
        currentPhaseId: 'phase-1',
        matchesInCurrentPhase: 0,
        participantData: null,
        matchIds: [],
        joinedAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}

