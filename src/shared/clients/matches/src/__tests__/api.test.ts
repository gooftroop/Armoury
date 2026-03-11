/**
 * Unit tests for the matches REST API functions.
 *
 * Tests all 5 API functions (getMatches, getMatch, postMatch, putMatch, deleteMatch)
 * to verify correct ky method calls, URL paths, prefixUrl, authorization headers,
 * and JSON body handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Match, CreateMatchRequest, MatchParams, UpdateMatchRequest } from './../types.ts';

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

import { getMatches } from './../api/getMatches.ts';
import { getMatch } from './../api/getMatch.ts';
import { postMatch } from './../api/postMatch.ts';
import { putMatch } from './../api/putMatch.ts';
import { deleteMatch } from './../api/deleteMatch.ts';

const TEST_AUTH = 'Bearer test-token-123';

const mockMatch: Match = {
    id: 'match-1',
    systemId: 'system-1',
    players: [],
    turn: { activePlayerId: null, turnOrder: [], turnNumber: 1 },
    score: null,
    outcome: { status: 'setup', resultsByPlayerId: {} },
    campaignId: null,
    matchData: null,
    notes: '',
    playedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

describe('getMatches', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls ky.get with the correct URL path', async () => {
        mockJson.mockResolvedValueOnce([mockMatch]);

        await getMatches(TEST_AUTH);

        expect(mockGet).toHaveBeenCalledWith('matches', expect.any(Object));
    });

    it('sets prefixUrl to a truthy value', async () => {
        mockJson.mockResolvedValueOnce([mockMatch]);

        await getMatches(TEST_AUTH);

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce([mockMatch]);

        await getMatches(TEST_AUTH);

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.headers).toEqual({ Authorization: TEST_AUTH });
    });

    it('returns the parsed JSON response', async () => {
        mockJson.mockResolvedValueOnce([mockMatch]);

        const result = await getMatches(TEST_AUTH);

        expect(result).toEqual([mockMatch]);
    });
});

describe('getMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: MatchParams = { matchId: 'match-42' };

    it('calls ky.get with the correct URL path including matchId', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await getMatch(TEST_AUTH, params);

        expect(mockGet).toHaveBeenCalledWith('matches/match-42', expect.any(Object));
    });

    it('sets prefixUrl to a truthy value', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await getMatch(TEST_AUTH, params);

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await getMatch(TEST_AUTH, params);

        const options = (mockGet.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.headers).toEqual({ Authorization: TEST_AUTH });
    });

    it('returns the parsed JSON response', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        const result = await getMatch(TEST_AUTH, params);

        expect(result).toEqual(mockMatch);
    });
});

describe('postMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: CreateMatchRequest = {
        systemId: 'system-1',
        players: [{ playerId: 'player-1', campaignParticipantId: null }],
    };

    it('calls ky.post with the correct URL path', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await postMatch(TEST_AUTH, params);

        expect(mockPost).toHaveBeenCalledWith('matches', expect.any(Object));
    });

    it('sets prefixUrl to a truthy value', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await postMatch(TEST_AUTH, params);

        const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await postMatch(TEST_AUTH, params);

        const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.headers).toEqual({ Authorization: TEST_AUTH });
    });

    it('passes the json body correctly', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await postMatch(TEST_AUTH, params);

        const options = (mockPost.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.json).toEqual(params);
    });

    it('returns the parsed JSON response', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        const result = await postMatch(TEST_AUTH, params);

        expect(result).toEqual(mockMatch);
    });
});

describe('putMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: MatchParams & UpdateMatchRequest = {
        matchId: 'match-42',
        notes: 'updated notes',
        players: [{ playerId: 'player-1', campaignParticipantId: null }],
    };

    it('calls ky.put with the correct URL path including matchId', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await putMatch(TEST_AUTH, params);

        expect(mockPut).toHaveBeenCalledWith('matches/match-42', expect.any(Object));
    });

    it('sets prefixUrl to a truthy value', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await putMatch(TEST_AUTH, params);

        const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await putMatch(TEST_AUTH, params);

        const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.headers).toEqual({ Authorization: TEST_AUTH });
    });

    it('passes the json body without matchId', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        await putMatch(TEST_AUTH, params);

        const options = (mockPut.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        const body = options.json as Record<string, unknown>;
        expect(body).toEqual({ notes: 'updated notes', players: params.players });
        expect(body).not.toHaveProperty('matchId');
    });

    it('returns the parsed JSON response', async () => {
        mockJson.mockResolvedValueOnce(mockMatch);

        const result = await putMatch(TEST_AUTH, params);

        expect(result).toEqual(mockMatch);
    });
});

describe('deleteMatch', () => {
    beforeEach(() => vi.clearAllMocks());

    const params: MatchParams = { matchId: 'match-42' };

    it('calls ky.delete with the correct URL path including matchId', async () => {
        await deleteMatch(TEST_AUTH, params);

        expect(mockDelete).toHaveBeenCalledWith('matches/match-42', expect.any(Object));
    });

    it('sets prefixUrl to a truthy value', async () => {
        await deleteMatch(TEST_AUTH, params);

        const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.prefixUrl).toBeTruthy();
    });

    it('passes the Authorization header', async () => {
        await deleteMatch(TEST_AUTH, params);

        const options = (mockDelete.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
        expect(options.headers).toEqual({ Authorization: TEST_AUTH });
    });

    it('returns void', async () => {
        const result = await deleteMatch(TEST_AUTH, params);

        expect(result).toBeUndefined();
    });
});
