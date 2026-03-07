/**
 * Global plugin registry for game system plugins.
 * Provides lookup by plugin id for DataManager builders and factories.
 */

import type { GameSystem } from '@data/types.js';

/**
 * Internal storage for registered plugins keyed by id.
 */
const pluginRegistry = new Map<string, GameSystem>();

/**
 * Registry API for managing game system plugins.
 */
export const PluginRegistry = {
    /**
     * Registers a plugin instance under its id.
     * @param plugin - Plugin to register
     */
    register(plugin: GameSystem): void {
        pluginRegistry.set(plugin.id, plugin);
    },

    /**
     * Retrieves a registered plugin by id.
     * @param id - Plugin id to retrieve
     * @returns The plugin if found, otherwise undefined
     */
    get(id: string): GameSystem | undefined {
        return pluginRegistry.get(id);
    },

    /**
     * Returns all registered plugin ids.
     * @returns Array of registered ids
     */
    ids(): string[] {
        return Array.from(pluginRegistry.keys());
    },

    /**
     * Clears all registered plugins (useful in tests).
     */
    clear(): void {
        pluginRegistry.clear();
    },
};
