/**
 * Users client types, request/response shapes, and error classes.
 *
 * These are client-side types mirrored from the users service.
 * They represent the shapes the client receives from and sends to the REST API.
 */

// === User Types ===

/** A user entity as returned by the users REST API. */
export interface User {
    /** Unique identifier for the user. */
    id: string;

    /** Auth0 subject identifier for the user. */
    sub: string;

    /** Email address of the user. */
    email: string;

    /** Display name of the user. */
    name: string;

    /** URL to the user's profile picture, or null if none. */
    picture: string | null;

    /** Account identifier linking this user to their Account, or null if no account exists. */
    accountId: string | null;

    /** When this user was created. ISO 8601. */
    createdAt: string;

    /** When this user was last updated. ISO 8601. */
    updatedAt: string;
}

/** User preference settings for display and notifications. */
export interface UserPreferences {
    /** UI theme preference. */
    theme: 'light' | 'dark' | 'auto';

    /** Preferred language code (e.g. 'en', 'fr'). */
    language: string;

    /** Whether push/email notifications are enabled. */
    notificationsEnabled: boolean;
}

/** An account entity linked 1:1 with a user, holding preference data. */
export interface Account {
    /** Unique identifier for this account. Auto-generated UUID. */
    id: string;

    /** Foreign key referencing the associated user. */
    userId: string;

    /** User preference settings. */
    preferences: UserPreferences;

    /** When this account was created. ISO 8601. */
    createdAt: string;

    /** When this account was last updated. ISO 8601. */
    updatedAt: string;
}

// === Param Interfaces ===

/** Parameters for operations on a single user. */
export interface UserParams {
    /** Unique identifier of the user. */
    userId: string;
}

/** Parameters for operations on a user's account (nested under /users/{id}/account). */
export type AccountParams = UserParams;

// === Request Types ===

/** Request body for creating a new user. */
export interface CreateUserRequest {
    /** Auth0 subject identifier for the new user. */
    sub: string;

    /** Email address of the new user. */
    email: string;

    /** Display name of the new user. */
    name: string;

    /** URL to the user's profile picture, or null if none. */
    picture: string | null;
}

/** Request body for updating an existing user. */
export interface UpdateUserRequest {
    /** Updated email address. */
    email?: string;

    /** Updated display name. */
    name?: string;

    /** Updated profile picture URL, or null to remove. */
    picture?: string | null;
}

/** Request body for creating a new account. */
export interface CreateAccountRequest {
    /** Initial preference settings for the account. */
    preferences: UserPreferences;
}

/** Request body for updating an existing account. */
export interface UpdateAccountRequest {
    /** Updated preference settings. */
    preferences?: UserPreferences;
}

// === Error Classes ===

/**
 * Error thrown when a users API call returns an HTTP error response.
 * Includes the HTTP status code for programmatic error handling.
 */
export class UsersApiError extends Error {
    /** HTTP status code returned by the users API (e.g., 400, 404, 500). */
    readonly statusCode: number;

    /**
     * Creates a new UsersApiError.
     *
     * @param message - Human-readable error description
     * @param statusCode - HTTP status code from the failed request
     */
    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'UsersApiError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, UsersApiError.prototype);
    }
}

/**
 * Error thrown when a network failure occurs while communicating with the users API.
 * Includes the underlying cause error for debugging connection issues.
 */
export class UsersNetworkError extends Error {
    /** The underlying error that caused the network failure (if available). */
    override readonly cause: Error | undefined;

    /**
     * Creates a new UsersNetworkError.
     *
     * @param message - Human-readable error description
     * @param cause - Optional underlying error that caused the network failure
     */
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'UsersNetworkError';
        this.cause = cause;
        Object.setPrototypeOf(this, UsersNetworkError.prototype);
    }
}

// === Type Guards ===

/**
 * Type guard to narrow an unknown error to UsersApiError.
 *
 * @param error - The error to check
 * @returns True if error is a UsersApiError instance
 */
export function isUsersApiError(error: unknown): error is UsersApiError {
    return error instanceof UsersApiError;
}

/**
 * Type guard to narrow an unknown error to UsersNetworkError.
 *
 * @param error - The error to check
 * @returns True if error is a UsersNetworkError instance
 */
export function isUsersNetworkError(error: unknown): error is UsersNetworkError {
    return error instanceof UsersNetworkError;
}
