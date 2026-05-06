/**
 * System sync status helper.
 *
 * Reads a system's current sync lifecycle state from the DataContext sync map.
 *
 * @requirements
 * 1. Must return the mapped status for known system IDs.
 * 2. Must default to 'idle' for unknown system IDs.
 *
 * @module getSyncStatus
 */

import type { SystemSyncStatus } from '@/providers/DataContextProvider.js';

/**
 * Returns the current sync status for a game system ID.
 *
 * @param systemId - The game system identifier.
 * @param syncStates - Current per-system sync states.
 * @returns The current sync status for the system.
 */
export function getSyncStatus(
    systemId: string,
    syncStates: Record<string, { status: SystemSyncStatus; error?: string }>,
): SystemSyncStatus {
    return syncStates[systemId]?.status ?? 'idle';
}
