/**
 * Unit tests for query option builders and their corresponding key builders.
 *
 * Tests the 4 query builders (queryCampaigns, queryCampaign, queryParticipants, queryParticipant)
 * and their key builder functions for:
 * - Correct query key array shape
 * - Returned object has queryKey, queryFn (function), and staleTime of 3_600_000
 * - Custom options are spread into the returned object
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampaignParams, ParticipantParams } from '@clients-campaigns/types.js';

vi.mock('ky', () => ({
    default: {
        get: vi.fn(() => ({ json: vi.fn() })),
        post: vi.fn(() => ({ json: vi.fn() })),
        put: vi.fn(() => ({ json: vi.fn() })),
        delete: vi.fn(() => Promise.resolve()),
    },
}));

import { buildQueryCampaignsKey, queryCampaigns } from '@clients-campaigns/queries/queryCampaigns.js';
import { buildQueryCampaignKey, queryCampaign } from '@clients-campaigns/queries/queryCampaign.js';
import { buildQueryParticipantsKey, queryParticipants } from '@clients-campaigns/queries/queryParticipants.js';
import { buildQueryParticipantKey, queryParticipant } from '@clients-campaigns/queries/queryParticipant.js';

const AUTH = 'Bearer test-token';
const campaignParams: CampaignParams = { campaignId: 'camp-1' };
const participantParams: ParticipantParams = { campaignId: 'camp-1', participantId: 'part-1' };

beforeEach(() => {
    vi.clearAllMocks();
});

describe('queryCampaigns', () => {
    describe('buildQueryCampaignsKey', () => {
        it('returns the expected query key array', () => {
            const key = buildQueryCampaignsKey();

            expect(key).toEqual(['queryCampaigns']);
        });
    });

    describe('queryCampaigns()', () => {
        it('returns an object with queryKey, queryFn, and staleTime', () => {
            const result = queryCampaigns(AUTH);

            expect(result.queryKey).toEqual(['queryCampaigns']);
            expect(result.queryFn).toBeTypeOf('function');
            expect(result.staleTime).toBe(3_600_000);
        });

        it('spreads custom options into the result', () => {
            const result = queryCampaigns(AUTH, { enabled: false });

            expect(result.enabled).toBe(false);
            expect(result.queryKey).toEqual(['queryCampaigns']);
            expect(result.staleTime).toBe(3_600_000);
        });
    });
});

describe('queryCampaign', () => {
    describe('buildQueryCampaignKey', () => {
        it('returns the expected query key array with params', () => {
            const key = buildQueryCampaignKey(campaignParams);

            expect(key).toEqual(['queryCampaign', campaignParams]);
        });
    });

    describe('queryCampaign()', () => {
        it('returns an object with queryKey, queryFn, and staleTime', () => {
            const result = queryCampaign(AUTH, campaignParams);

            expect(result.queryKey).toEqual(['queryCampaign', campaignParams]);
            expect(result.queryFn).toBeTypeOf('function');
            expect(result.staleTime).toBe(3_600_000);
        });

        it('spreads custom options into the result', () => {
            const result = queryCampaign(AUTH, campaignParams, { enabled: false });

            expect(result.enabled).toBe(false);
            expect(result.queryKey).toEqual(['queryCampaign', campaignParams]);
            expect(result.staleTime).toBe(3_600_000);
        });
    });
});

describe('queryParticipants', () => {
    describe('buildQueryParticipantsKey', () => {
        it('returns the expected query key array with params', () => {
            const key = buildQueryParticipantsKey(campaignParams);

            expect(key).toEqual(['queryParticipants', campaignParams]);
        });
    });

    describe('queryParticipants()', () => {
        it('returns an object with queryKey, queryFn, and staleTime', () => {
            const result = queryParticipants(AUTH, campaignParams);

            expect(result.queryKey).toEqual(['queryParticipants', campaignParams]);
            expect(result.queryFn).toBeTypeOf('function');
            expect(result.staleTime).toBe(3_600_000);
        });

        it('spreads custom options into the result', () => {
            const result = queryParticipants(AUTH, campaignParams, { enabled: false });

            expect(result.enabled).toBe(false);
            expect(result.queryKey).toEqual(['queryParticipants', campaignParams]);
            expect(result.staleTime).toBe(3_600_000);
        });
    });
});

describe('queryParticipant', () => {
    describe('buildQueryParticipantKey', () => {
        it('returns the expected query key array with params', () => {
            const key = buildQueryParticipantKey(participantParams);

            expect(key).toEqual(['queryParticipant', participantParams]);
        });
    });

    describe('queryParticipant()', () => {
        it('returns an object with queryKey, queryFn, and staleTime', () => {
            const result = queryParticipant(AUTH, participantParams);

            expect(result.queryKey).toEqual(['queryParticipant', participantParams]);
            expect(result.queryFn).toBeTypeOf('function');
            expect(result.staleTime).toBe(3_600_000);
        });

        it('spreads custom options into the result', () => {
            const result = queryParticipant(AUTH, participantParams, { enabled: false });

            expect(result.enabled).toBe(false);
            expect(result.queryKey).toEqual(['queryParticipant', participantParams]);
            expect(result.staleTime).toBe(3_600_000);
        });
    });
});
