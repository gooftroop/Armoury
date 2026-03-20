/**
 * Shared constants for the silent Auth0 authentication check.
 *
 * The sessionStorage key is used by SilentAuthCheck (to mark that a redirect was
 * attempted) and by ProfileTileContainer (to decide whether to show a skeleton
 * while the silent auth redirect is in flight).
 *
 * @module silent-auth-constants
 */

/**
 * sessionStorage key that tracks whether the one-time silent auth redirect
 * has been attempted in the current browser session.
 */
export const SILENT_AUTH_ATTEMPTED_KEY = 'armoury:silent-auth-attempted';
