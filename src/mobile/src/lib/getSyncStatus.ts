/**
 * Sync-state lookup helpers for mobile landing system tiles.
 *
 * @requirements
 * 1. Must export getSyncStatus as a named function.
 * 2. Must return idle when a system has no sync-state entry.
 * 3. Must preserve DataContext sync status typing.
 *
 * @module get-sync-status
 */

import type { SystemSyncStatus } from '@/providers/DataContextProvider.js';

/**
 * Derives the sync status for a given system from the DataContext sync state map.
 *
 * @param systemId - The game-system identifier to look up.
 * @param syncStates - Current per-system sync states.
 * @returns The sync status, or `idle` when absent.
 */
export function getSyncStatus(
    systemId: string,
    syncStates: Record<string, { status: SystemSyncStatus; error?: string }>,
): SystemSyncStatus {
    return syncStates[systemId]?.status ?? 'idle';
}
