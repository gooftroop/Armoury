/**
 * Game system resolver utility.
 *
 * Dynamically resolves a GameSystem implementation from a manifest ID to avoid
 * bundling all system packages into the initial client bundle.
 *
 * @requirements
 * 1. Must resolve known system IDs to concrete GameSystem instances.
 * 2. Must return null for unknown systems.
 * 3. Must use dynamic imports.
 * 4. Must expose the list of known system IDs for sync-state probing.
 *
 * @module resolveGameSystem
 */

import type { GameSystem } from '@armoury/data-dao';

/**
 * All game system IDs that this application can resolve.
 *
 * Used by the DataContextProvider to discover which systems have synced data
 * in the database without hardcoding file-key-to-system mappings. When a new
 * game system is added, add its ID here AND add a case to {@link resolveGameSystem}.
 */
const KNOWN_SYSTEM_IDS: readonly string[] = ['wh40k10e'] as const;

/**
 * Returns the list of all game system IDs that this application supports.
 *
 * @returns Readonly array of known system IDs.
 */
export function getKnownSystemIds(): readonly string[] {
    return KNOWN_SYSTEM_IDS;
}

/**
 * Resolves a GameSystem implementation for the provided manifest identifier.
 *
 * @param manifestId - The game system manifest identifier.
 * @returns The resolved GameSystem, or null when unsupported.
 */
export async function resolveGameSystem(manifestId: string): Promise<GameSystem | null> {
    switch (manifestId) {
        case 'wh40k10e': {
            const { wh40k10eSystem } = await import('@armoury/wh40k10e/system');

            return wh40k10eSystem;
        }

        default:
            return null;
    }
}
