/**
 * Unit tests for the matches query builders and key builders.
 *
 * Tests buildQueryMatchesKey, queryMatches, buildQueryMatchKey, and queryMatch
 * to verify correct query key shapes, staleTime, queryFn presence, and custom option spreading.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MatchParams } from '@clients-matches/types.js';

vi.mock('ky', () => ({
    default: {
        get: vi.fn(() => ({ json: vi.fn() })),
        post: vi.fn(() => ({ json: vi.fn() })),
        put: vi.fn(() => ({ json: vi.fn() })),
        delete: vi.fn(() => Promise.resolve()),
    },
}));

import { buildQueryMatchesKey, queryMatches } from '@clients-matches/queries/queryMatches.js';
import { buildQueryMatchKey, queryMatch } from '@clients-matches/queries/queryMatch.js';

const TEST_AUTH = 'Bearer test-token-123';

describe('buildQueryMatchesKey', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns a tuple with "queryMatches" as the first element', () => {
        const key = buildQueryMatchesKey();

        expect(key).toEqual(['queryMatches']);
    });

    it('returns a readonly array', () => {
        const key = buildQueryMatchesKey();

        expect(Array.isArray(key)).toBe(true);
        expect(key).toHaveLength(1);
    });
});

describe('queryMatches', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns an object with queryKey matching buildQueryMatchesKey', () => {
        const result = queryMatches(TEST_AUTH);

        expect(result.queryKey).toEqual(buildQueryMatchesKey());
    });

    it('returns an object with a queryFn function', () => {
        const result = queryMatches(TEST_AUTH);

        expect(result.queryFn).toBeTypeOf('function');
    });

    it('sets staleTime to 3_600_000', () => {
        const result = queryMatches(TEST_AUTH);

        expect(result.staleTime).toBe(3_600_000);
    });

    it('spreads custom options into the result', () => {
        const result = queryMatches(TEST_AUTH, { enabled: false });

        expect(result.enabled).toBe(false);
        expect(result.queryKey).toEqual(buildQueryMatchesKey());
        expect(result.queryFn).toBeTypeOf('function');
        expect(result.staleTime).toBe(3_600_000);
    });

    it('allows custom options to override staleTime', () => {
        const result = queryMatches(TEST_AUTH, { staleTime: 0 });

        expect(result.staleTime).toBe(0);
    });
});

describe('buildQueryMatchKey', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: MatchParams = { matchId: 'match-42' };

    it('returns a tuple with "queryMatch" as the first element', () => {
        const key = buildQueryMatchKey(params);

        expect(key[0]).toBe('queryMatch');
    });

    it('includes the params as the second element', () => {
        const key = buildQueryMatchKey(params);

        expect(key[1]).toEqual(params);
    });

    it('returns a two-element array', () => {
        const key = buildQueryMatchKey(params);

        expect(key).toHaveLength(2);
        expect(key).toEqual(['queryMatch', { matchId: 'match-42' }]);
    });
});

describe('queryMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: MatchParams = { matchId: 'match-42' };

    it('returns an object with queryKey matching buildQueryMatchKey', () => {
        const result = queryMatch(TEST_AUTH, params);

        expect(result.queryKey).toEqual(buildQueryMatchKey(params));
    });

    it('returns an object with a queryFn function', () => {
        const result = queryMatch(TEST_AUTH, params);

        expect(result.queryFn).toBeTypeOf('function');
    });

    it('sets staleTime to 3_600_000', () => {
        const result = queryMatch(TEST_AUTH, params);

        expect(result.staleTime).toBe(3_600_000);
    });

    it('spreads custom options into the result', () => {
        const result = queryMatch(TEST_AUTH, params, { enabled: false });

        expect(result.enabled).toBe(false);
        expect(result.queryKey).toEqual(buildQueryMatchKey(params));
        expect(result.queryFn).toBeTypeOf('function');
        expect(result.staleTime).toBe(3_600_000);
    });

    it('allows custom options to override staleTime', () => {
        const result = queryMatch(TEST_AUTH, params, { staleTime: 0 });

        expect(result.staleTime).toBe(0);
    });
});
