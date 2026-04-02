import { randomUUID } from 'crypto';

import type { ApiResponse, DatabaseAdapter, Match, PathParameters, RouteHandler, UserContext } from '@/types.js';
import { errorResponse, jsonResponse } from '@/utils/response.js';
import { parseCreateMatchRequest, parseUpdateMatchRequest } from '@/utils/validation.js';

export const createMatch: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const request = parseCreateMatchRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const now = new Date().toISOString();
    const playerIds = request.players.map((p) => p.playerId);

    if (!playerIds.includes(userContext.userId)) {
        return errorResponse(403, 'Forbidden', 'Authenticated user must be a player in the match');
    }

    const match: Match = {
        id: randomUUID(),
        systemId: request.systemId,
        players: request.players,
        turn: {
            activePlayerId: null,
            turnOrder: request.turnOrder ?? playerIds,
            turnNumber: 0,
        },
        score: null,
        outcome: { status: 'setup', resultsByPlayerId: {} },
        campaignId: request.campaignId ?? null,
        matchData: request.matchData ?? null,
        notes: request.notes ?? '',
        playedAt: request.playedAt ?? null,
        createdAt: now,
        updatedAt: now,
    };

    await adapter.put('match', match);

    return jsonResponse(201, match);
};

export const listMatches: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    _pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
): Promise<ApiResponse> => {
    const allMatches = await adapter.getAll('match');
    const userMatches = (allMatches as Match[]).filter((m) => m.players.some((p) => p.playerId === userContext.userId));

    return jsonResponse(200, userMatches);
};

export const getMatch: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const matchId = pathParameters?.id;

    if (!matchId) {
        return errorResponse(400, 'ValidationError', 'Missing match id');
    }

    const match = await adapter.get('match', matchId);

    if (!match) {
        return errorResponse(404, 'NotFound', 'Match not found');
    }

    return jsonResponse(200, match);
};

export const updateMatch: RouteHandler = async (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const matchId = pathParameters?.id;

    if (!matchId) {
        return errorResponse(400, 'ValidationError', 'Missing match id');
    }

    const request = parseUpdateMatchRequest(body);

    if (request instanceof Error) {
        return errorResponse(400, 'ValidationError', request.message);
    }

    const existing = await adapter.get('match', matchId);

    if (!existing) {
        return errorResponse(404, 'NotFound', 'Match not found');
    }

    const existingMatch = existing as Match;
    const updated: Match = {
        ...existingMatch,
        players: request.players ?? existingMatch.players,
        turn: request.turn ?? existingMatch.turn,
        score: request.score !== undefined ? request.score : existingMatch.score,
        outcome: request.outcome ?? existingMatch.outcome,
        campaignId: request.campaignId !== undefined ? request.campaignId : existingMatch.campaignId,
        matchData: request.matchData !== undefined ? request.matchData : existingMatch.matchData,
        notes: request.notes ?? existingMatch.notes,
        playedAt: request.playedAt !== undefined ? request.playedAt : existingMatch.playedAt,
        updatedAt: new Date().toISOString(),
    };

    await adapter.put('match', updated);

    return jsonResponse(200, updated);
};

export const deleteMatch: RouteHandler = async (
    adapter: DatabaseAdapter,
    _body: unknown | null,
    pathParameters: PathParameters | null | undefined,
): Promise<ApiResponse> => {
    const matchId = pathParameters?.id;

    if (!matchId) {
        return errorResponse(400, 'ValidationError', 'Missing match id');
    }

    const existing = await adapter.get('match', matchId);

    if (!existing) {
        return errorResponse(404, 'NotFound', 'Match not found');
    }

    await adapter.delete('match', matchId);

    return {
        statusCode: 204,
        headers: {
            'Content-Type': 'application/json',
        },
        body: '',
    };
};
