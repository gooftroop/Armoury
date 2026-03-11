import type {
    CreateMatchRequest,
    SubscribeMatchMessage,
    UnsubscribeMatchMessage,
    UpdateMatchFields,
    UpdateMatchMessage,
    UpdateMatchRequest,
} from '../types.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isMatchPlayerArray(value: unknown): boolean {
    if (!Array.isArray(value)) {
        return false;
    }

    return value.every(
        (item) =>
            isRecord(item) &&
            isString(item['playerId']) &&
            (item['campaignParticipantId'] === null ||
                item['campaignParticipantId'] === undefined ||
                isString(item['campaignParticipantId'])),
    );
}

export function parseCreateMatchRequest(body: unknown | null): CreateMatchRequest | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const systemId = body['systemId'];
    const players = body['players'];
    const turnOrder = body['turnOrder'];
    const campaignId = body['campaignId'];
    const matchData = body['matchData'];
    const notes = body['notes'];
    const playedAt = body['playedAt'];

    if (!isString(systemId)) {
        return new Error('Missing required field: systemId');
    }

    if (!isMatchPlayerArray(players)) {
        return new Error('Missing or invalid field: players');
    }

    if (turnOrder !== undefined && !isStringArray(turnOrder)) {
        return new Error('Invalid turnOrder value');
    }

    if (campaignId !== undefined && campaignId !== null && !isString(campaignId)) {
        return new Error('Invalid campaignId value');
    }

    if (matchData !== undefined && matchData !== null && !isRecord(matchData)) {
        return new Error('Invalid matchData value');
    }

    if (notes !== undefined && !isString(notes)) {
        return new Error('Invalid notes value');
    }

    if (playedAt !== undefined && playedAt !== null && !isString(playedAt)) {
        return new Error('Invalid playedAt value');
    }

    return {
        systemId,
        players: players as CreateMatchRequest['players'],
        turnOrder: turnOrder as string[] | undefined,
        campaignId: campaignId as string | null | undefined,
        matchData: matchData as CreateMatchRequest['matchData'],
        notes: notes as string | undefined,
        playedAt: playedAt as string | null | undefined,
    };
}

export function parseUpdateMatchRequest(body: unknown | null): UpdateMatchRequest | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const players = body['players'];
    const turn = body['turn'];
    const score = body['score'];
    const outcome = body['outcome'];
    const campaignId = body['campaignId'];
    const matchData = body['matchData'];
    const notes = body['notes'];
    const playedAt = body['playedAt'];

    if (players !== undefined && !isMatchPlayerArray(players)) {
        return new Error('Invalid players value');
    }

    if (turn !== undefined && !isRecord(turn)) {
        return new Error('Invalid turn value');
    }

    if (score !== undefined && score !== null && !isRecord(score)) {
        return new Error('Invalid score value');
    }

    if (outcome !== undefined && !isRecord(outcome)) {
        return new Error('Invalid outcome value');
    }

    if (campaignId !== undefined && campaignId !== null && !isString(campaignId)) {
        return new Error('Invalid campaignId value');
    }

    if (matchData !== undefined && matchData !== null && !isRecord(matchData)) {
        return new Error('Invalid matchData value');
    }

    if (notes !== undefined && !isString(notes)) {
        return new Error('Invalid notes value');
    }

    if (playedAt !== undefined && playedAt !== null && !isString(playedAt)) {
        return new Error('Invalid playedAt value');
    }

    return {
        players: players as UpdateMatchRequest['players'],
        turn: turn as UpdateMatchRequest['turn'],
        score: score as UpdateMatchRequest['score'],
        outcome: outcome as UpdateMatchRequest['outcome'],
        campaignId: campaignId as UpdateMatchRequest['campaignId'],
        matchData: matchData as UpdateMatchRequest['matchData'],
        notes: notes as UpdateMatchRequest['notes'],
        playedAt: playedAt as UpdateMatchRequest['playedAt'],
    };
}

export function parseUpdateMatchMessage(body: unknown): UpdateMatchMessage | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const action = body['action'];
    const matchId = body['matchId'];
    const data = body['data'];

    if (action !== 'updateMatch') {
        return new Error('Invalid action value');
    }

    if (!isString(matchId)) {
        return new Error('Missing matchId');
    }

    if (!data || !isRecord(data)) {
        return new Error('Missing update data');
    }

    const turn = data['turn'];
    const score = data['score'];
    const outcome = data['outcome'];
    const matchData = data['matchData'];
    const notes = data['notes'];

    if (turn !== undefined && !isRecord(turn)) {
        return new Error('Invalid turn value');
    }

    if (score !== undefined && score !== null && !isRecord(score)) {
        return new Error('Invalid score value');
    }

    if (outcome !== undefined && !isRecord(outcome)) {
        return new Error('Invalid outcome value');
    }

    if (matchData !== undefined && matchData !== null && !isRecord(matchData)) {
        return new Error('Invalid matchData value');
    }

    if (notes !== undefined && !isString(notes)) {
        return new Error('Invalid notes value');
    }

    const updateFields: UpdateMatchFields = {
        ...(turn !== undefined ? { turn: turn as unknown as UpdateMatchFields['turn'] } : {}),
        ...(score !== undefined ? { score: score as UpdateMatchFields['score'] } : {}),
        ...(outcome !== undefined ? { outcome: outcome as unknown as UpdateMatchFields['outcome'] } : {}),
        ...(matchData !== undefined ? { matchData: matchData as UpdateMatchFields['matchData'] } : {}),
        ...(notes !== undefined ? { notes: notes as string } : {}),
    };

    return { action, matchId, data: updateFields };
}

export function parseSubscribeMatchMessage(body: unknown): SubscribeMatchMessage | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const action = body['action'];
    const matchId = body['matchId'];

    if (action !== 'subscribeMatch') {
        return new Error('Invalid action value');
    }

    if (!isString(matchId)) {
        return new Error('Missing matchId');
    }

    return { action, matchId };
}

export function parseUnsubscribeMatchMessage(body: unknown): UnsubscribeMatchMessage | Error {
    if (!body || !isRecord(body)) {
        return new Error('Request body is required');
    }

    const action = body['action'];
    const matchId = body['matchId'];

    if (action !== 'unsubscribeMatch') {
        return new Error('Invalid action value');
    }

    if (!isString(matchId)) {
        return new Error('Missing matchId');
    }

    return { action, matchId };
}
