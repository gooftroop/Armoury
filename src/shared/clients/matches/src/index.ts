/**
 * Matches client package for real-time and REST match management.
 *
 * Provides a bidirectional WebSocket client, React Query query/mutation options
 * factories, query key builders, typed entities, error classes, and type guards.
 */

// Realtime client
export { MatchesRealtimeClient, createMatchesRealtimeClient } from './realtime.ts';

// Types
export type {
    MatchDataBase,
    MatchPlayer,
    MatchTurn,
    MatchScoreEvent,
    MatchScore,
    MatchStatus,
    PlayerResult,
    MatchOutcome,
    Match,
    CreateMatchRequest,
    UpdateMatchRequest,
    UpdateMatchFields,
    SubscribeMatchMessage,
    UnsubscribeMatchMessage,
    UpdateMatchMessage,
    MatchesClientMessage,
    MatchStateMessage,
    MatchUpdatedMessage,
    MatchesServerMessage,
    MatchesWsConfig,
    ConnectionState,
    IMatchesRealtimeClient,
    MatchParams,
} from './types.ts';

// Error classes and type guards
export { MatchesApiError, MatchesNetworkError, isMatchesApiError, isMatchesNetworkError } from './types.ts';

// Config constants
export { MATCHES_BASE_URL, DEFAULT_MATCHES_WS_URL, MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY_MS } from './config.ts';

// Queries
export { buildQueryMatchesKey, queryMatches } from './queries/queryMatches.ts';
export { buildQueryMatchKey, queryMatch } from './queries/queryMatch.ts';

// Mutations
export { mutationCreateMatch } from './mutations/mutationCreateMatch.ts';
export { mutationUpdateMatch } from './mutations/mutationUpdateMatch.ts';
export { mutationDeleteMatch } from './mutations/mutationDeleteMatch.ts';
