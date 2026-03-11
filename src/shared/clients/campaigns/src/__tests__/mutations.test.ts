/**
 * Unit tests for all 6 mutation option builders.
 *
 * Tests the mutation builders (mutationCreateCampaign, mutationUpdateCampaign,
 * mutationDeleteCampaign, mutationJoinCampaign, mutationUpdateParticipant,
 * mutationDeleteParticipant) for:
 * - Returned object has mutationFn (function) and NO mutationKey
 * - Custom options are spread into the returned object
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    CampaignParams,
    CreateCampaignRequest,
    JoinCampaignRequest,
    ParticipantParams,
    UpdateCampaignRequest,
    UpdateParticipantRequest,
} from './../types.ts';

vi.mock('ky', () => ({
    default: {
        get: vi.fn(() => ({ json: vi.fn() })),
        post: vi.fn(() => ({ json: vi.fn() })),
        put: vi.fn(() => ({ json: vi.fn() })),
        delete: vi.fn(() => Promise.resolve()),
    },
}));

import { mutationCreateCampaign } from './../mutations/mutationCreateCampaign.ts';
import { mutationUpdateCampaign } from './../mutations/mutationUpdateCampaign.ts';
import { mutationDeleteCampaign } from './../mutations/mutationDeleteCampaign.ts';
import { mutationJoinCampaign } from './../mutations/mutationJoinCampaign.ts';
import { mutationUpdateParticipant } from './../mutations/mutationUpdateParticipant.ts';
import { mutationDeleteParticipant } from './../mutations/mutationDeleteParticipant.ts';

const AUTH = 'Bearer test-token';

const createParams: CreateCampaignRequest = {
    name: 'New Campaign',
    type: 'type-1',
    narrative: { schemaVersion: 1, narrative: '' },
    startDate: '2025-01-01T00:00:00Z',
    endDate: null,
    status: 'upcoming',
};

const updateCampaignParams: CampaignParams & UpdateCampaignRequest = {
    campaignId: 'camp-1',
    name: 'Updated Campaign',
    type: 'type-1',
    narrative: { schemaVersion: 1, narrative: '' },
    startDate: '2025-01-01T00:00:00Z',
    endDate: null,
    status: 'active',
};

const deleteCampaignParams: CampaignParams = { campaignId: 'camp-1' };

const joinParams: CampaignParams & JoinCampaignRequest = {
    campaignId: 'camp-1',
    displayName: 'Player One',
    armyId: 'army-1',
    armyName: 'Space Marines',
    currentPhaseId: 'phase-1',
};

const updateParticipantParams: ParticipantParams & UpdateParticipantRequest = {
    campaignId: 'camp-1',
    participantId: 'part-1',
    displayName: 'Updated Player',
    armyId: 'army-2',
    armyName: 'Orks',
    currentPhaseId: 'phase-2',
    matchesInCurrentPhase: 5,
};

const deleteParticipantParams: ParticipantParams = {
    campaignId: 'camp-1',
    participantId: 'part-1',
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('mutationCreateCampaign', () => {
    it('returns an object with mutationFn and no mutationKey', () => {
        const result = mutationCreateCampaign(AUTH, createParams);

        expect(result.mutationFn).toBeTypeOf('function');
        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationCreateCampaign(AUTH, createParams, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});

describe('mutationUpdateCampaign', () => {
    it('returns an object with mutationFn and no mutationKey', () => {
        const result = mutationUpdateCampaign(AUTH, updateCampaignParams);

        expect(result.mutationFn).toBeTypeOf('function');
        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationUpdateCampaign(AUTH, updateCampaignParams, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});

describe('mutationDeleteCampaign', () => {
    it('returns an object with mutationFn and no mutationKey', () => {
        const result = mutationDeleteCampaign(AUTH, deleteCampaignParams);

        expect(result.mutationFn).toBeTypeOf('function');
        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationDeleteCampaign(AUTH, deleteCampaignParams, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});

describe('mutationJoinCampaign', () => {
    it('returns an object with mutationFn and no mutationKey', () => {
        const result = mutationJoinCampaign(AUTH, joinParams);

        expect(result.mutationFn).toBeTypeOf('function');
        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationJoinCampaign(AUTH, joinParams, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});

describe('mutationUpdateParticipant', () => {
    it('returns an object with mutationFn and no mutationKey', () => {
        const result = mutationUpdateParticipant(AUTH, updateParticipantParams);

        expect(result.mutationFn).toBeTypeOf('function');
        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationUpdateParticipant(AUTH, updateParticipantParams, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});

describe('mutationDeleteParticipant', () => {
    it('returns an object with mutationFn and no mutationKey', () => {
        const result = mutationDeleteParticipant(AUTH, deleteParticipantParams);

        expect(result.mutationFn).toBeTypeOf('function');
        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationDeleteParticipant(AUTH, deleteParticipantParams, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});
