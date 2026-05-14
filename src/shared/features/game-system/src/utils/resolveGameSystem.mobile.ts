/**
 * Resolves game-system implementations for mobile manifest selections.
 *
 * @requirements
 * 1. Must export resolveGameSystem as a named async function.
 * 2. Must dynamically import system implementations to avoid eager bundle loading.
 * 3. Must return null for unknown manifest IDs.
 *
 * @module resolve-game-system
 */

import type { GameSystem } from '@armoury/data-dao';

/**
 * Resolves a GameSystem implementation for the given manifest ID.
 *
 * @param manifestId - The system identifier from the manifest (for example `wh40k10e`).
 * @returns The resolved GameSystem, or null when the system is unknown.
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
