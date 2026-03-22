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
 *
 * @module resolveGameSystem
 */

import type { GameSystem } from '@armoury/data-dao';

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
