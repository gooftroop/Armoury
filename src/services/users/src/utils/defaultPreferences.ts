/**
 * @requirements
 * - Standalone module for DEFAULT_PREFERENCES to avoid circular import between
 *   `routes/users.ts` and `utils/resolveUser.ts`.
 */

/** Default preferences applied when auto-creating an account on first login. */
export const DEFAULT_PREFERENCES = {
    theme: 'auto' as const,
    language: 'en',
    notificationsEnabled: false,
};
