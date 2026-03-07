/**
 * Unit tests for all 10 campaigns API functions.
 *
 * Each function is tested for:
 * - Correct ky HTTP method (get/post/put/delete) and URL path
 * - Truthy prefixUrl from CAMPAIGNS_BASE_URL
 * - Authorization header pass-through
 * - POST/PUT json body correctness
 * - Destructured params excluded from the request body where applicable
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Campaign, CampaignParticipant } from '@clients-campaigns/types.js';

const { mockJson, mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => {
    const mockJson = vi.fn();

    return {
        mockJson,
        mockGet: vi.fn(() => ({ json: mockJson })),
        mockPost: vi.fn(() => ({ json: mockJson })),
        mockPut: vi.fn(() => ({ json: mockJson })),
        mockDelete: vi.fn(() => Promise.resolve()),
    };
});

vi.mock('ky', () => ({
    default: {
        get: mockGet,
        post: mockPost,
        put: mockPut,
        delete: mockDelete,
    },
}));

import { getCampaigns } from '@clients-campaigns/api/getCampaigns.js';
import { getCampaign } from '@clients-campaigns/api/getCampaign.js';
import { postCampaign } from '@clients-campaigns/api/postCampaign.js';
import { putCampaign } from '@clients-campaigns/api/putCampaign.js';
import { deleteCampaign } from '@clients-campaigns/api/deleteCampaign.js';
import { getParticipants } from '@clients-campaigns/api/getParticipants.js';
import { getParticipant } from '@clients-campaigns/api/getParticipant.js';
import { postParticipant } from '@clients-campaigns/api/postParticipant.js';
import { putParticipant } from '@clients-campaigns/api/putParticipant.js';
import { deleteParticipant } from '@clients-campaigns/api/deleteParticipant.js';

const AUTH = 'Bearer test-token';

const fakeCampaign: Campaign = {
    id: 'camp-1',
    name: 'Test Campaign',
    type: 'type-1',
    organizerId: 'org-1',
    narrative: { schemaVersion: 1, narrative: '' },
    startDate: '2025-01-01T00:00:00Z',
    endDate: null,
    status: 'active',
    phases: [],
    customRules: [],
    rankings: [],
    participantIds: [],
    matchIds: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const fakeParticipant: CampaignParticipant = {
    id: 'part-1',
    campaignId: 'camp-1',
    userId: 'user-1',
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
};

beforeEach(() => {
    vi.clearAllMocks();
    mockJson.mockResolvedValue(fakeCampaign);
});

describe('getCampaigns', () => {
    it('calls ky.get with correct URL and options', async () => {
        mockJson.mockResolvedValue([fakeCampaign]);

        await getCampaigns(AUTH);

        expect(mockGet).toHaveBeenCalledWith('campaigns', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('has a truthy prefixUrl', async () => {
        await getCampaigns(AUTH);

        const options = (mockGet.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });

    it('returns the json response', async () => {
        mockJson.mockResolvedValue([fakeCampaign]);

        const result = await getCampaigns(AUTH);

        expect(result).toEqual([fakeCampaign]);
    });
});

describe('getCampaign', () => {
    it('calls ky.get with the campaign ID in the URL', async () => {
        await getCampaign(AUTH, { campaignId: 'camp-1' });

        expect(mockGet).toHaveBeenCalledWith('campaigns/camp-1', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('has a truthy prefixUrl', async () => {
        await getCampaign(AUTH, { campaignId: 'camp-1' });

        const options = (mockGet.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });
});

describe('postCampaign', () => {
    const createParams = {
        name: 'New Campaign',
        type: 'type-1',
        narrative: { schemaVersion: 1, narrative: 'A story' },
        startDate: '2025-06-01T00:00:00Z',
        endDate: null,
        status: 'upcoming' as const,
    };

    it('calls ky.post with correct URL and json body', async () => {
        await postCampaign(AUTH, createParams);

        expect(mockPost).toHaveBeenCalledWith('campaigns', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
            json: createParams,
        }));
    });

    it('has a truthy prefixUrl', async () => {
        await postCampaign(AUTH, createParams);

        const options = (mockPost.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });
});

describe('putCampaign', () => {
    const updateParams = {
        campaignId: 'camp-1',
        name: 'Updated Campaign',
        type: 'type-1',
        narrative: { schemaVersion: 1, narrative: 'Updated story' },
        startDate: '2025-06-01T00:00:00Z',
        endDate: null,
        status: 'active' as const,
    };

    it('calls ky.put with the campaign ID in the URL', async () => {
        await putCampaign(AUTH, updateParams);

        expect(mockPut).toHaveBeenCalledWith('campaigns/camp-1', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('passes the request body without campaignId', async () => {
        await putCampaign(AUTH, updateParams);

        const options = (mockPut.mock.calls[0] as unknown[])[1] as { json: Record<string, unknown> };
        expect(options.json).not.toHaveProperty('campaignId');
        expect(options.json).toHaveProperty('name', 'Updated Campaign');
    });

    it('has a truthy prefixUrl', async () => {
        await putCampaign(AUTH, updateParams);

        const options = (mockPut.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });
});

describe('deleteCampaign', () => {
    it('calls ky.delete with the campaign ID in the URL', async () => {
        await deleteCampaign(AUTH, { campaignId: 'camp-1' });

        expect(mockDelete).toHaveBeenCalledWith('campaigns/camp-1', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('has a truthy prefixUrl', async () => {
        await deleteCampaign(AUTH, { campaignId: 'camp-1' });

        const options = (mockDelete.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });

    it('returns void', async () => {
        const result = await deleteCampaign(AUTH, { campaignId: 'camp-1' });

        expect(result).toBeUndefined();
    });
});

describe('getParticipants', () => {
    it('calls ky.get with campaign ID and participants path', async () => {
        mockJson.mockResolvedValue([fakeParticipant]);

        await getParticipants(AUTH, { campaignId: 'camp-1' });

        expect(mockGet).toHaveBeenCalledWith('campaigns/camp-1/participants', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('has a truthy prefixUrl', async () => {
        mockJson.mockResolvedValue([fakeParticipant]);

        await getParticipants(AUTH, { campaignId: 'camp-1' });

        const options = (mockGet.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });
});

describe('getParticipant', () => {
    it('calls ky.get with campaign ID and participant ID in the URL', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await getParticipant(AUTH, { campaignId: 'camp-1', participantId: 'part-1' });

        expect(mockGet).toHaveBeenCalledWith('campaigns/camp-1/participants/part-1', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('has a truthy prefixUrl', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await getParticipant(AUTH, { campaignId: 'camp-1', participantId: 'part-1' });

        const options = (mockGet.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });
});

describe('postParticipant', () => {
    const joinParams = {
        campaignId: 'camp-1',
        displayName: 'Player One',
        armyId: 'army-1',
        armyName: 'Space Marines',
        currentPhaseId: 'phase-1',
    };

    it('calls ky.post with campaign ID in the URL and participants path', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await postParticipant(AUTH, joinParams);

        expect(mockPost).toHaveBeenCalledWith('campaigns/camp-1/participants', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('passes the request body without campaignId', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await postParticipant(AUTH, joinParams);

        const options = (mockPost.mock.calls[0] as unknown[])[1] as { json: Record<string, unknown> };
        expect(options.json).not.toHaveProperty('campaignId');
        expect(options.json).toHaveProperty('displayName', 'Player One');
        expect(options.json).toHaveProperty('armyId', 'army-1');
    });

    it('has a truthy prefixUrl', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await postParticipant(AUTH, joinParams);

        const options = (mockPost.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });
});

describe('putParticipant', () => {
    const updateParams = {
        campaignId: 'camp-1',
        participantId: 'part-1',
        displayName: 'Updated Player',
        armyId: 'army-2',
        armyName: 'Orks',
        currentPhaseId: 'phase-2',
        matchesInCurrentPhase: 3,
    };

    it('calls ky.put with campaign ID and participant ID in the URL', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await putParticipant(AUTH, updateParams);

        expect(mockPut).toHaveBeenCalledWith('campaigns/camp-1/participants/part-1', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('passes the request body without campaignId or participantId', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await putParticipant(AUTH, updateParams);

        const options = (mockPut.mock.calls[0] as unknown[])[1] as { json: Record<string, unknown> };
        expect(options.json).not.toHaveProperty('campaignId');
        expect(options.json).not.toHaveProperty('participantId');
        expect(options.json).toHaveProperty('displayName', 'Updated Player');
        expect(options.json).toHaveProperty('armyId', 'army-2');
    });

    it('has a truthy prefixUrl', async () => {
        mockJson.mockResolvedValue(fakeParticipant);

        await putParticipant(AUTH, updateParams);

        const options = (mockPut.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });
});

describe('deleteParticipant', () => {
    it('calls ky.delete with campaign ID and participant ID in the URL', async () => {
        await deleteParticipant(AUTH, { campaignId: 'camp-1', participantId: 'part-1' });

        expect(mockDelete).toHaveBeenCalledWith('campaigns/camp-1/participants/part-1', expect.objectContaining({
            prefixUrl: expect.anything(),
            headers: { Authorization: AUTH },
        }));
    });

    it('has a truthy prefixUrl', async () => {
        await deleteParticipant(AUTH, { campaignId: 'camp-1', participantId: 'part-1' });

        const options = (mockDelete.mock.calls[0] as unknown[])[1] as { prefixUrl: string };
        expect(options.prefixUrl).toBeTruthy();
    });

    it('returns void', async () => {
        const result = await deleteParticipant(AUTH, { campaignId: 'camp-1', participantId: 'part-1' });

        expect(result).toBeUndefined();
    });
});
