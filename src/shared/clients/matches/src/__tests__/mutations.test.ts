/**
 * Unit tests for the matches mutation builders.
 *
 * Tests mutationCreateMatch, mutationUpdateMatch, and mutationDeleteMatch
 * to verify mutationFn presence, absence of mutationKey, and custom option spreading.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CreateMatchRequest, MatchParams, UpdateMatchRequest } from './../types.ts';

vi.mock('ky', () => ({
    default: {
        get: vi.fn(() => ({ json: vi.fn() })),
        post: vi.fn(() => ({ json: vi.fn() })),
        put: vi.fn(() => ({ json: vi.fn() })),
        delete: vi.fn(() => Promise.resolve()),
    },
}));

import { mutationCreateMatch } from './../mutations/mutationCreateMatch.ts';
import { mutationUpdateMatch } from './../mutations/mutationUpdateMatch.ts';
import { mutationDeleteMatch } from './../mutations/mutationDeleteMatch.ts';

const TEST_AUTH = 'Bearer test-token-123';

describe('mutationCreateMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: CreateMatchRequest = {
        systemId: 'system-1',
        players: [{ playerId: 'player-1', campaignParticipantId: null }],
    };

    it('returns an object with a mutationFn function', () => {
        const result = mutationCreateMatch(TEST_AUTH, params);

        expect(result.mutationFn).toBeTypeOf('function');
    });

    it('does not include a mutationKey', () => {
        const result = mutationCreateMatch(TEST_AUTH, params);

        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationCreateMatch(TEST_AUTH, params, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});

describe('mutationUpdateMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: MatchParams & UpdateMatchRequest = {
        matchId: 'match-42',
        notes: 'updated notes',
    };

    it('returns an object with a mutationFn function', () => {
        const result = mutationUpdateMatch(TEST_AUTH, params);

        expect(result.mutationFn).toBeTypeOf('function');
    });

    it('does not include a mutationKey', () => {
        const result = mutationUpdateMatch(TEST_AUTH, params);

        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationUpdateMatch(TEST_AUTH, params, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});

describe('mutationDeleteMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: MatchParams = { matchId: 'match-42' };

    it('returns an object with a mutationFn function', () => {
        const result = mutationDeleteMatch(TEST_AUTH, params);

        expect(result.mutationFn).toBeTypeOf('function');
    });

    it('does not include a mutationKey', () => {
        const result = mutationDeleteMatch(TEST_AUTH, params);

        expect(result).not.toHaveProperty('mutationKey');
    });

    it('spreads custom options into the result', () => {
        const onSuccess = vi.fn();
        const result = mutationDeleteMatch(TEST_AUTH, params, { onSuccess });

        expect(result.onSuccess).toBe(onSuccess);
        expect(result.mutationFn).toBeTypeOf('function');
    });
});
