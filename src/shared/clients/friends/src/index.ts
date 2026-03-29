/**
 * Friends client package.
 *
 * Provides React Query query/mutation options factories, query key builders,
 * a WebSocket presence client for real-time friend online/offline notifications,
 * and all friend entity types for the friends REST API.
 */

// === Presence Client ===

export { FriendsPresenceClient, createFriendsPresenceClient } from '@/presence.js';
export type { IFriendsPresenceClient } from '@/presence.js';

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
    WebSocketErrorEvent,
    WebSocketErrorSource,
} from '@/types.js';

// === Error Classes ===

export { FriendsApiError, FriendsNetworkError } from '@/types.js';
export { isFriendsApiError, isFriendsNetworkError } from '@/types.js';

// === Config ===

export { FRIENDS_BASE_URL, DEFAULT_FRIENDS_WS_URL, MAX_RECONNECT_ATTEMPTS, BASE_RECONNECT_DELAY_MS } from '@/config.js';

// === Queries ===

export { buildQueryFriendsKey, queryFriends } from '@/queries/queryFriends.js';
export { buildQueryFriendKey, queryFriend } from '@/queries/queryFriend.js';

// === Mutations ===

export { mutationSendFriendRequest } from '@/mutations/mutationSendFriendRequest.js';
export { mutationUpdateFriend } from '@/mutations/mutationUpdateFriend.js';
export { mutationDeleteFriend } from '@/mutations/mutationDeleteFriend.js';
