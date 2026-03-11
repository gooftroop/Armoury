import type { Campaign } from '@armoury/models/CampaignModel';

export function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
    return {
        id: 'campaign-1',
        name: 'Crusade of Fire',
        type: 'wh40k10e-crusade',
        status: 'active',
        organizerId: 'auth0|user-1',
        startDate: '2025-06-01',
        endDate: null,
        phases: [],
        customRules: [],
        rankings: [],
        participantIds: ['auth0|user-1'],
        matchIds: [],
        narrative: { schemaVersion: 1, narrative: '' },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}
