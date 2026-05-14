/**
 * System sync status helper.
 *
 * Reads a system's current sync lifecycle state from the DataContext sync map.
 *
 * @requirements
 * 1. Must return the mapped status for known system IDs.
 * 2. Must default to 'idle' for unknown system IDs.
 * 3. Must be framework-agnostic and avoid app-local type imports.
 *
 * @module getSyncStatus
 */

/**
 * Returns the current sync status for a game system ID.
 *
 * @param systemId - The game system identifier.
 * @param syncStates - Current per-system sync states.
 * @returns The current sync status for the system.
 */
export function getSyncStatus<TStatus extends string>(
    systemId: string,
    syncStates: Record<string, { status: TStatus; error?: string }>,
): TStatus {
    return syncStates[systemId]?.status ?? ('idle' as TStatus);
}
