/**
 * User data model for lightweight profile lookups.
 *
 * Complements the Account model which stores auth + preferences.
 * The User model provides the publicly visible profile data that
 * other entities (e.g. friends) reference by userId.
 *
 * @requirements
 * 1. Must define the User interface for cross-service profile lookups.
 * 2. `id` holds the Auth0 subject identifier (e.g. `auth0|123456789`) — not a UUID.
 * 3. Must include `legacyId` as an optional field to hold the pre-migration UUID PK.
 */

/**
 * Lightweight user profile for cross-service lookups.
 *
 * Used by the friends service to resolve display names and
 * profile pictures without duplicating data in the friend record.
 */
export interface User {
    /**
     * Primary key for the user record.
     *
     * Holds the Auth0 subject identifier (e.g. `auth0|123456789`).
     * This value is the same as the `sub` claim in Auth0 JWTs.
     */
    id: string;

    /** User email address. */
    email: string;

    /** User display name. */
    name: string;

    /** URL to the user's profile picture, or null if none set. */
    picture: string | null;

    /** Account identifier linking this user to their Account, or null if no account exists. */
    accountId: string | null;

    /**
     * Pre-migration UUID primary key, retained as a safety net during the Auth0 migration
     * window. Populated by the data migration (Task 15) and null once migration is complete.
     */
    legacyId?: string;

    /** Timestamp when the user was created. ISO 8601. */
    createdAt: string;

    /** Timestamp when the user was last updated. ISO 8601. */
    updatedAt: string;
}
