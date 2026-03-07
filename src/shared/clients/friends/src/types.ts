/**
 * Friends client types, error classes, and type guards.
 *
 * Contains all client-side type definitions for the friends REST API
 * and WebSocket presence service.
 */

// === Friend Entity Types ===

/** The status of a friend relationship between two users. */
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

/**
 * A friend relationship record from the join table.
 *
 * Each user in a friendship has their own row. The ownerId identifies whose
 * friend list this record belongs to, and userId identifies the friend.
 * User profile data (name, picture) is resolved from the user service by userId.
 *
 * @property id - Unique identifier for this friend record.
 * @property ownerId - The user whose friend list this record belongs to.
 * @property userId - The friend's user ID. Look up profile data from the user service.
 * @property status - Current status of the friend relationship.
 * @property canShareArmyLists - Whether the friend can view shared army lists.
 * @property canViewMatchHistory - Whether the friend can view match history.
 * @property createdAt - When the friend request was created. ISO 8601.
 * @property updatedAt - When the friend relationship was last updated. ISO 8601.
 */
export interface Friend {
    /** Unique identifier for this friend record. */
    id: string;
    /** The user whose friend list this record belongs to. */
    ownerId: string;
    /** The friend's user ID. Look up profile data from the user service. */
    userId: string;
    /** Current status of the friend relationship. */
    status: FriendStatus;
    /** Whether the friend can view shared army lists. */
    canShareArmyLists: boolean;
    /** Whether the friend can view match history. */
    canViewMatchHistory: boolean;
    /** When the friend request was created. ISO 8601. */
    createdAt: string;
    /** When the friend relationship was last updated. ISO 8601. */
    updatedAt: string;
}

// === Request Types ===

/**
 * Payload for sending a new friend request.
 *
 * @property userId - The user ID of the person to send the request to.
 */
export interface SendFriendRequestPayload {
    /** The user ID of the person to send the request to. */
    userId: string;
}

/**
 * Payload for updating an existing friend relationship.
 *
 * All fields are optional; only provided fields will be updated.
 *
 * @property status - New status for the friend relationship.
 * @property canShareArmyLists - Whether the friend can view shared army lists.
 * @property canViewMatchHistory - Whether the friend can view match history.
 */
export interface UpdateFriendRequest {
    /** New status for the friend relationship. */
    status?: FriendStatus;
    /** Whether the friend can view shared army lists. */
    canShareArmyLists?: boolean;
    /** Whether the friend can view match history. */
    canViewMatchHistory?: boolean;
}

// === Param Interfaces ===

/** Parameters for operations on a single friend relationship. */
export interface FriendParams {
    /** Unique identifier of the friend relationship. */
    friendId: string;
}


// === Presence Types ===

/** The online status of a user in the presence system. */
export type PresenceStatus = 'online' | 'offline' | 'away' | 'invisible';

/**
 * Presence information for a single user.
 *
 * @property userId - The user's unique identifier.
 * @property status - Current online status of the user.
 * @property connectionId - The WebSocket connection ID, or null if offline.
 * @property lastActiveAt - When the user was last active. ISO 8601.
 */
export interface UserPresence {
    /** The user's unique identifier. */
    userId: string;
    /** Current online status of the user. */
    status: PresenceStatus;
    /** The WebSocket connection ID, or null if offline. */
    connectionId: string | null;
    /** When the user was last active. ISO 8601. */
    lastActiveAt: string;
}

// === WebSocket Server Messages ===

/**
 * Message received when a friend comes online.
 *
 * @property action - Discriminator field, always 'friendOnline'.
 * @property userId - The user ID of the friend who came online.
 * @property name - Display name of the friend who came online.
 */
export interface FriendOnlineMessage {
    /** Discriminator field, always 'friendOnline'. */
    action: 'friendOnline';
    /** The user ID of the friend who came online. */
    userId: string;
    /** Display name of the friend who came online. */
    name: string;
}

/**
 * Message received when a friend goes offline.
 *
 * @property action - Discriminator field, always 'friendOffline'.
 * @property userId - The user ID of the friend who went offline.
 */
export interface FriendOfflineMessage {
    /** Discriminator field, always 'friendOffline'. */
    action: 'friendOffline';
    /** The user ID of the friend who went offline. */
    userId: string;
}

/** Union of all possible messages received from the friends WebSocket server. */
export type FriendsServerMessage = FriendOnlineMessage | FriendOfflineMessage;


/**
 * Configuration for the friends WebSocket presence client.
 *
 * @property wsUrl - WebSocket URL for the friends presence service (e.g., 'ws://localhost:3005').
 * @property getToken - Async or sync function that returns a valid authentication token.
 */
export interface FriendsPresenceConfig {
    /** WebSocket URL for the friends presence service (e.g., 'ws://localhost:3005'). */
    wsUrl: string;
    /** Async or sync function that returns a valid authentication token. */
    getToken: () => Promise<string> | string;
}

/** The connection state of the WebSocket presence client. */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// === Error Classes ===

/**
 * Error thrown when the friends REST API returns an HTTP error response.
 * Includes the HTTP status code for debugging and error handling.
 */
export class FriendsApiError extends Error {
    /** HTTP status code returned by the friends API (e.g., 400, 404, 500). */
    readonly statusCode: number;

    /**
     * Creates a new FriendsApiError.
     *
     * @param message - Human-readable error description.
     * @param statusCode - HTTP status code from the failed request.
     */
    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'FriendsApiError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, FriendsApiError.prototype);
    }
}

/**
 * Error thrown when a network-level failure occurs while communicating
 * with the friends REST API. Wraps the underlying cause error for debugging.
 */
export class FriendsNetworkError extends Error {
    /** The underlying error that caused the network failure (if available). */
    override readonly cause: Error | undefined;

    /**
     * Creates a new FriendsNetworkError.
     *
     * @param message - Human-readable error description.
     * @param cause - Optional underlying error that caused the network failure.
     */
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'FriendsNetworkError';
        this.cause = cause;
        Object.setPrototypeOf(this, FriendsNetworkError.prototype);
    }
}

// === Type Guards ===

/**
 * Type guard to narrow an unknown error to FriendsApiError.
 *
 * @param error - The error to check.
 * @returns True if error is a FriendsApiError instance.
 */
export function isFriendsApiError(error: unknown): error is FriendsApiError {
    return error instanceof FriendsApiError;
}

/**
 * Type guard to narrow an unknown error to FriendsNetworkError.
 *
 * @param error - The error to check.
 * @returns True if error is a FriendsNetworkError instance.
 */
export function isFriendsNetworkError(error: unknown): error is FriendsNetworkError {
    return error instanceof FriendsNetworkError;
}
