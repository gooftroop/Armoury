/**
 * Type definitions for the users service.
 *
 * Defines the User entity, database adapter interface, route handler
 * signatures, and request/response payload shapes.
 */

/**
 * Authenticated user context extracted from API Gateway authorizer.
 */
export interface UserContext {
    /** Internal user identifier from the Auth0 custom claim. */
    userId: string;

    /** User email address from the identity provider (may be absent from access tokens). */
    email?: string;

    /** User display name from the identity provider (may be absent from access tokens). */
    name?: string;
}

/**
 * Route path parameters extracted from API Gateway.
 */
export interface PathParameters {
    /** User identifier parameter. */
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
 * User entity — core user profile model.
 *
 * Each row represents a registered user in the system with their
 * identity provider details and profile information.
 *
 * Table: users
 * | Column     | Type | Constraints |
 * |------------|------|-------------|
 * | id         | TEXT | PRIMARY KEY |
 * | sub        | TEXT | NOT NULL    |
 * | email      | TEXT | NOT NULL    |
 * | name       | TEXT | NOT NULL    |
 * | picture    | TEXT |             |
 * | account_id | TEXT |             |
 * | created_at | TEXT | NOT NULL    |
 * | updated_at | TEXT | NOT NULL    |
 */
export interface User {
    /** Unique identifier for this user record. */
    id: string;

    /** User subject identifier from the identity provider. */
    sub: string;

    /** User email address. */
    email: string;

    /** User display name. */
    name: string;

    /** User profile picture URL, or null if not set. */
    picture: string | null;

    /** Account identifier linking this user to their Account, or null if no account exists. */
    accountId: string | null;

    /** Timestamp when the user was created. ISO 8601. */
    createdAt: string;

    /** Timestamp when the user was last updated. ISO 8601. */
    updatedAt: string;
}

/**
 * User preferences for the application.
 * Stores user-specific settings that are not synced to Auth0.
 */
export interface UserPreferences {
    /** The UI theme preference (light, dark, or auto-detect based on system). */
    theme: 'light' | 'dark' | 'auto';
    /** The preferred language code (e.g. "en", "es", "fr"). */
    language: string;
    /** Whether push notifications are enabled for this user. */
    notificationsEnabled: boolean;
}

/**
 * Per-game-system preferences for a user.
 */
export interface SystemPreferences {
    /** Whether the user has enabled and downloaded this game system's data. */
    enabled: boolean;

    /** ISO 8601 timestamp of the last successful data sync, or null if never synced. */
    lastSyncedAt: string | null;
}

/**
 * Account entity — user preferences record.
 *
 * Each user has at most one account. The account stores
 * application-specific user preferences.
 *
 * Table: accounts
 * | Column       | Type | Constraints |
 * |--------------|------|-------------|
 * | id           | TEXT | PRIMARY KEY |
 * | user_id      | TEXT | NOT NULL    |
 * | preferences  | TEXT | NOT NULL    |
 * | created_at   | TEXT | NOT NULL    |
 * | updated_at   | TEXT | NOT NULL    |
 */
export interface Account {
    /** Unique identifier for this account record. Auto-generated UUID. */
    id: string;

    /** Foreign key linking this account to the owning User record. */
    userId: string;

    /** Application-specific user preferences (not synced to Auth0). */
    preferences: UserPreferences;

    /** Game system preferences (enabled/disabled per system). */
    systems: Record<string, unknown>;

    /** Timestamp when the account was created. ISO 8601. */
    createdAt: string;

    /** Timestamp when the account was last updated. ISO 8601. */
    updatedAt: string;
}

/**
 * Supported entity type names for the adapter.
 */
export type EntityType = 'user' | 'account';

/**
 * Entity map for adapter operations.
 */
export type EntityMap = {
    /** User profile entity. */
    user: User;
    /** Account entity (1:1 with user). */
    account: Account;
};

/**
 * Database adapter for user entities.
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
 * Route handler signature for users service endpoints.
 */
export type RouteHandler = (
    adapter: DatabaseAdapter,
    body: unknown | null,
    pathParameters: PathParameters | null | undefined,
    userContext: UserContext,
) => Promise<ApiResponse>;

/**
 * Request body for creating a new user.
 */
export interface CreateUserPayload {
    /** User subject identifier from the identity provider. */
    sub: string;

    /** User email address. */
    email: string;

    /** User display name. */
    name: string;

    /** User profile picture URL, or null if not set. */
    picture: string | null;
}

/**
 * Request body for updating an existing user.
 */
export interface UpdateUserPayload {
    /** Optional updated email address. */
    email?: string;

    /** Optional updated display name. */
    name?: string;

    /** Optional updated profile picture URL, or null to remove. */
    picture?: string | null;
}

/**
 * Request body for creating an account for a user.
 */
export interface CreateAccountPayload {
    /** Application-specific user preferences. */
    preferences: UserPreferences;
}

/**
 * Request body for updating an existing account.
 */
export interface UpdateAccountPayload {
    /** Optional updated user preferences. */
    preferences?: UserPreferences;

    /** Optional updated per-game-system preferences keyed by system ID. */
    systems?: Record<string, SystemPreferences>;
}
