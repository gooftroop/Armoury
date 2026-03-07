/**
 * Account data model for user preferences and game system settings.
 *
 * Stores application-specific preferences linked to a user record.
 * Each user has at most one account.
 *
 * @requirements
 * 1. Must define UserPreferences for app-wide settings (theme, language, notifications).
 * 2. Must define SystemPreferences for per-system state (enabled, sync timestamp).
 * 3. Must define Account linking a user to their preferences and enabled systems.
 */

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
 *
 * Tracks whether the user has enabled a specific game system and
 * the last time that system's data was synchronized.
 */
export interface SystemPreferences {
    /** Whether the user has enabled and downloaded this game system's data. */
    enabled: boolean;
    /** ISO 8601 timestamp of the last successful data sync, or null if never synced. */
    lastSyncedAt: string | null;
}

/**
 * User account containing application-specific preferences.
 * Each user has at most one account.
 */
export interface Account {
    /** Unique identifier for this account record. Auto-generated UUID. */
    id: string;
    /** Foreign key linking this account to the owning User record. */
    userId: string;
    /** Application-specific user preferences (not synced to Auth0). */
    preferences: UserPreferences;
    /**
     * Per-game-system preferences keyed by system ID (e.g., 'wh40k10e').
     * Maps each enabled system to its sync state. Systems absent from this
     * map are considered not enabled.
     */
    systems: Record<string, SystemPreferences>;
    /** Timestamp when the account was created. ISO 8601 */
    createdAt: string;
    /** Timestamp when the account was last updated. ISO 8601 */
    updatedAt: string;
}
