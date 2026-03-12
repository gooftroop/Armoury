import type { Match } from '@armoury/models';

/** Creates a minimal core Match fixture. */
export function makeMatch(overrides: Partial<Match> = {}): Match {
    return {
        id: 'match-1',
        systemId: 'wh40k10e',
        players: [
            { playerId: 'auth0|user-1', campaignParticipantId: null },
            { playerId: 'auth0|user-2', campaignParticipantId: null },
        ],
        turn: { activePlayerId: null, turnOrder: ['auth0|user-1', 'auth0|user-2'], turnNumber: 0 },
        score: null,
        outcome: { status: 'setup', resultsByPlayerId: {} },
        campaignId: null,
        matchData: null,
        notes: '',
        playedAt: '2025-06-15T14:00:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        ...overrides,
    };
}
