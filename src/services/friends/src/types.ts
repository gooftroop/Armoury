/**
 * Authenticated user context extracted from API Gateway authorizer.
 */
export interface UserContext {
    /** User subject identifier from the identity provider. */
    sub: string;

    /** User email address from the identity provider. */
    email: string;

    /** User display name from the identity provider. */
    name: string;
}

/**
 * Route path parameters extracted from API Gateway.
 */
export interface PathParameters {
    /** Friend identifier parameter. */
    id?: string;
}

/**
 * API Gateway proxy response type alias.
 */
export interface ApiResponse {
    /** HTTP status code for the response. */
    statusCode: number;

    /** Optional HTTP response headers. */
    headers?: Record<string, string>;

    /** Stringified response body payload. */
    body: string;
}

/**
 * Friend request status discriminator.
 */
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

/**
 * Friend relationship entity — join table model.
 *
 * Each row represents one side of a friendship. When user A befriends user B,
 * two rows are created: one owned by A (userId = B) and one owned by B (userId = A).
 * User profile data (name, picture) is looked up from the user service by userId.
 *
 * Table: friends
 * | Column                 | Type    | Constraints |
 * |------------------------|---------|-------------|
 * | id                     | TEXT    | PRIMARY KEY |
 * | owner_id               | TEXT    | NOT NULL    |
 * | user_id                | TEXT    | NOT NULL    |
 * | status                 | TEXT    | NOT NULL    |
 * | can_share_army_lists   | BOOLEAN | NOT NULL    |
 * | can_view_match_history | BOOLEAN | NOT NULL    |
 * | created_at             | TEXT    | NOT NULL    |
 * | updated_at             | TEXT    | NOT NULL    |
 */
export interface Friend {
    /** Unique identifier for this friend record. */
    id: string;

    /** The user whose friend list this record belongs to. */
    ownerId: string;

    /** The friend's user ID. Look up profile data from the user service. */
    userId: string;

    /** Current status of the friendship. */
    status: FriendStatus;

    /** Whether the friend can share army lists with this user. */
    canShareArmyLists: boolean;

    /** Whether the friend can view this user's match history. */
    canViewMatchHistory: boolean;

    /** Timestamp when the friend relationship was created. ISO 8601. */
    createdAt: string;

    /** Timestamp when the friend relationship was last updated. ISO 8601. */
    updatedAt: string;
}

/**
 * Database adapter for friend entities.
 */
export interface DatabaseAdapter {
    /** Initializes the adapter. */
    initialize(): Promise<void>;

    /** Retrieves an entity by ID. */
    get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null>;

    /** Retrieves all entities of a type. */
    getAll<T extends EntityType>(store: T): Promise<EntityMap[T][]>;

    /** Retrieves entities by matching a field value. */
    getByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<EntityMap[T][]>;

    /** Stores an entity. */
    put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void>;

    /** Deletes an entity by ID. */
    delete<T extends EntityType>(store: T, id: string): Promise<void>;

    /** Deletes entities by field match. */
    deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void>;

    /** Executes a transactional operation. */
    transaction<R>(fn: () => Promise<R>): Promise<R>;
}

/**
 * Supported entity type names for the adapter.
 */
export type EntityType = 'friend' | 'userPresence';

/**
 * Entity map for adapter operations.
 */
export type EntityMap = {
    /** Friend relationship entity. */
    friend: Friend;

    /** User presence tracking entity. */
    userPresence: UserPresence;
};

/**
 * Route handler signature for friends service endpoints.
 */
export type RouteHandler = (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
) => Promise<ApiResponse>;

/**
 * Request body for sending a friend request.
 */
export interface SendFriendRequestPayload {
    /** The user ID of the person to send the friend request to. */
    userId: string;
}

/**
 * Request body for updating a friend request.
 */
export interface UpdateFriendRequest {
    /** Optional friend status update. */
    status?: FriendStatus;

    /** Optional toggle for sharing army lists. */
    canShareArmyLists?: boolean;

    /** Optional toggle for viewing match history. */
    canViewMatchHistory?: boolean;
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

/**
 * User presence status discriminator.
 */
export type PresenceStatus = 'online' | 'offline' | 'away' | 'invisible';

/**
 * User presence record stored in the user_presence table.
 *
 * Table: user_presence
 * | Column         | Type | Constraints |
 * |----------------|------|-------------|
 * | user_id        | TEXT | PRIMARY KEY |
 * | status         | TEXT | NOT NULL    |
 * | connection_id  | TEXT |             |
 * | last_active_at | TEXT | NOT NULL    |
 */
export interface UserPresence {
    /** User identifier (primary key). */
    userId: string;

    /** Current presence status. */
    status: PresenceStatus;

    /** Active WebSocket connection ID, or null when offline. */
    connectionId: string | null;

    /** Timestamp of last activity. ISO 8601. */
    lastActiveAt: string;
}

// ---------------------------------------------------------------------------
// WebSocket types
// ---------------------------------------------------------------------------

/**
 * API Gateway WebSocket event.
 */
export interface WebSocketEvent {
    /** Request context from API Gateway. */
    requestContext: {
        /** Route key matching the WebSocket route. */
        routeKey: string;

        /** Unique connection identifier assigned by API Gateway. */
        connectionId: string;

        /** Domain name of the WebSocket API. */
        domainName: string;

        /** Deployment stage name. */
        stage: string;

        /** Authorizer context, present on $connect events. */
        authorizer?: Record<string, unknown>;

        /** Type of WebSocket event. */
        eventType: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
    };

    /** Query string parameters, present on $connect events. */
    queryStringParameters?: Record<string, string | undefined> | null;

    /** Raw message body, present on MESSAGE events. */
    body: string | null;
}

/**
 * WebSocket Lambda response.
 */
export interface WebSocketResponse {
    /** HTTP status code for the WebSocket response. */
    statusCode: number;

    /** Optional response body. */
    body?: string;
}

/**
 * WebSocket route handler signature.
 */
export type WsRouteHandler = (
    event: WebSocketEvent,
    adapter: DatabaseAdapter,
    userContext: UserContext | null,
) => Promise<WebSocketResponse>;
