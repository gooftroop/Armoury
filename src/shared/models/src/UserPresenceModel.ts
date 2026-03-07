/**
 * User presence data model — tracks online/offline status.
 *
 * Table: user_presence
 * | Column        | Type | Constraints |
 * |---------------|------|-------------|
 * | user_id       | TEXT | PRIMARY KEY |
 * | connection_id | TEXT |             |
 * | status        | TEXT | NOT NULL    |
 * | last_seen     | TEXT | NOT NULL    |
 */

/**
 * Online status for a user.
 * - online: Actively connected via WebSocket
 * - offline: Not connected
 * - away: Connected but idle
 */
export type PresenceStatus = 'online' | 'offline' | 'away';

/**
 * Tracks a user's real-time presence (online/offline) and WebSocket connection.
 */
export interface UserPresence {
    /** User identifier (primary key). */
    userId: string;

    /** Active WebSocket connection ID, or null if offline. */
    connectionId: string | null;

    /** Current presence status. */
    status: PresenceStatus;

    /** Timestamp of last activity. ISO 8601. */
    lastSeen: string;
}
