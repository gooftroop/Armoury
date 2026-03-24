/**
 * Matches client package for real-time and REST match management.
 *
 * Provides a bidirectional WebSocket client, React Query query/mutation options
 * factories, query key builders, typed entities, error classes, and type guards.
 */

// Realtime client
export { MatchesRealtimeClient, createMatchesRealtimeClient } from '@/realtime.js';

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
    MatchesServerMessage,
    MatchesWsConfig,
    ConnectionState,
    IMatchesRealtimeClient,
    MatchParams,
    WebSocketErrorEvent,
    WebSocketErrorSource,
} from '@/types.js';

// Error classes and type guards
export { MatchesApiError, MatchesNetworkError, isMatchesApiError, isMatchesNetworkError } from '@/types.js';

// Config constants
export { MATCHES_BASE_URL, DEFAULT_MATCHES_WS_URL, MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY_MS } from '@/config.js';

// Queries
export { buildQueryMatchesKey, queryMatches } from '@/queries/queryMatches.js';
export { buildQueryMatchKey, queryMatch } from '@/queries/queryMatch.js';

// Mutations
export { mutationCreateMatch } from '@/mutations/mutationCreateMatch.js';
export { mutationUpdateMatch } from '@/mutations/mutationUpdateMatch.js';
export { mutationDeleteMatch } from '@/mutations/mutationDeleteMatch.js';
