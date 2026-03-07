/**
 * Matches client package for real-time and REST match management.
 *
 * Provides a bidirectional WebSocket client, React Query query/mutation options
 * factories, query key builders, typed entities, error classes, and type guards.
 */

// Realtime client
export { MatchesRealtimeClient, createMatchesRealtimeClient } from '@clients-matches/realtime.js';

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
} from '@clients-matches/types.js';

// Error classes and type guards
export {
    MatchesApiError,
    MatchesNetworkError,
    isMatchesApiError,
    isMatchesNetworkError,
} from '@clients-matches/types.js';

// Config constants
export {
    MATCHES_BASE_URL,
    DEFAULT_MATCHES_WS_URL,
    MAX_RECONNECT_ATTEMPTS,
    BASE_RECONNECT_DELAY_MS,
} from '@clients-matches/config.js';

// Queries
export { buildQueryMatchesKey, queryMatches } from '@clients-matches/queries/queryMatches.js';
export { buildQueryMatchKey, queryMatch } from '@clients-matches/queries/queryMatch.js';

// Mutations
export { mutationCreateMatch } from '@clients-matches/mutations/mutationCreateMatch.js';
export { mutationUpdateMatch } from '@clients-matches/mutations/mutationUpdateMatch.js';
export { mutationDeleteMatch } from '@clients-matches/mutations/mutationDeleteMatch.js';
