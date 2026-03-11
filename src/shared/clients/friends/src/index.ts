/**
 * Friends client package.
 *
 * Provides React Query query/mutation options factories, query key builders,
 * a WebSocket presence client for real-time friend online/offline notifications,
 * and all friend entity types for the friends REST API.
 */

// === Presence Client ===

export { FriendsPresenceClient, createFriendsPresenceClient } from './presence.ts';
export type { IFriendsPresenceClient } from './presence.ts';

// === Types ===

export type {
    FriendStatus,
    Friend,
    SendFriendRequestPayload,
    UpdateFriendRequest,
    FriendParams,
    PresenceStatus,
    UserPresence,
    FriendOnlineMessage,
    FriendOfflineMessage,
    FriendsServerMessage,
    FriendsPresenceConfig,
    ConnectionState,
} from './types.ts';

// === Error Classes ===

export { FriendsApiError, FriendsNetworkError } from './types.ts';
export { isFriendsApiError, isFriendsNetworkError } from './types.ts';

// === Config ===

export { FRIENDS_BASE_URL, DEFAULT_FRIENDS_WS_URL, MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY_MS } from './config.ts';

// === Queries ===

export { buildQueryFriendsKey, queryFriends } from './queries/queryFriends.ts';
export { buildQueryFriendKey, queryFriend } from './queries/queryFriend.ts';

// === Mutations ===

export { mutationSendFriendRequest } from './mutations/mutationSendFriendRequest.ts';
export { mutationUpdateFriend } from './mutations/mutationUpdateFriend.ts';
export { mutationDeleteFriend } from './mutations/mutationDeleteFriend.ts';
