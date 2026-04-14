import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from '@/pluginRegistry.js';
import type { GameSystem } from '@/types.js';

function createTestPlugin(id: string, name: string = `Test Plugin ${id}`): GameSystem {
    return {
        id,
        name,
        version: '1.0.0',
        dataSource: { type: 'github', owner: 'test', repo: 'test', coreFile: '', description: '', licenseStatus: '' },
        entityKinds: [],
        validationRules: [],
        getHydrators: () => new Map(),
        getSchemaExtension: () => ({}),
        register: () => {},
        createGameContext: () => ({ gameData: {} }),
        getSyncFileKeyPrefixes: () => [],
    } as GameSystem;
}

describe('PluginRegistry', () => {
    beforeEach(() => {
        PluginRegistry.clear();
    });

    describe('register', () => {
        it('registers a game system plugin', () => {
            const plugin = createTestPlugin('wh40k-10e');

            PluginRegistry.register(plugin);

            expect(PluginRegistry.get('wh40k-10e')).toBe(plugin);
        });

        it('overwrites previous plugin when duplicate ID is registered', () => {
            const firstPlugin = createTestPlugin('wh40k-10e', 'First Plugin');
            const secondPlugin = createTestPlugin('wh40k-10e', 'Second Plugin');

            PluginRegistry.register(firstPlugin);
            PluginRegistry.register(secondPlugin);

            const retrieved = PluginRegistry.get('wh40k-10e');
            expect(retrieved).toBe(secondPlugin);
            expect(retrieved?.name).toBe('Second Plugin');
        });

        it('allows registering multiple different plugins', () => {
            const pluginA = createTestPlugin('wh40k-10e');
            const pluginB = createTestPlugin('aos-4e');

            PluginRegistry.register(pluginA);
            PluginRegistry.register(pluginB);

            expect(PluginRegistry.get('wh40k-10e')).toBe(pluginA);
            expect(PluginRegistry.get('aos-4e')).toBe(pluginB);
        });
    });

    describe('get', () => {
        it('returns undefined for unregistered plugin ID', () => {
            expect(PluginRegistry.get('nonexistent')).toBeUndefined();
        });

        it('retrieves registered plugin by ID', () => {
            const plugin = createTestPlugin('wh40k-10e');

            PluginRegistry.register(plugin);

            const retrieved = PluginRegistry.get('wh40k-10e');
            expect(retrieved).toBe(plugin);
            expect(retrieved?.id).toBe('wh40k-10e');
        });
    });

    describe('ids', () => {
        it('returns empty array when no plugins are registered', () => {
            expect(PluginRegistry.ids()).toEqual([]);
        });

        it('returns array of all registered plugin IDs', () => {
            const pluginA = createTestPlugin('wh40k-10e');
            const pluginB = createTestPlugin('aos-4e');
            const pluginC = createTestPlugin('horus-heresy');

            PluginRegistry.register(pluginA);
            PluginRegistry.register(pluginB);
            PluginRegistry.register(pluginC);

            const ids = PluginRegistry.ids();
            expect(ids).toHaveLength(3);
            expect(ids).toContain('wh40k-10e');
            expect(ids).toContain('aos-4e');
            expect(ids).toContain('horus-heresy');
        });

        it('reflects updates after new plugins are registered', () => {
            const pluginA = createTestPlugin('wh40k-10e');

            PluginRegistry.register(pluginA);
            expect(PluginRegistry.ids()).toEqual(['wh40k-10e']);

            const pluginB = createTestPlugin('aos-4e');

            PluginRegistry.register(pluginB);
            expect(PluginRegistry.ids()).toHaveLength(2);
        });
    });

    describe('clear', () => {
        it('removes all registered plugins', () => {
            const pluginA = createTestPlugin('wh40k-10e');
            const pluginB = createTestPlugin('aos-4e');

            PluginRegistry.register(pluginA);
            PluginRegistry.register(pluginB);

            expect(PluginRegistry.ids()).toHaveLength(2);

            PluginRegistry.clear();

            expect(PluginRegistry.ids()).toEqual([]);
            expect(PluginRegistry.get('wh40k-10e')).toBeUndefined();
            expect(PluginRegistry.get('aos-4e')).toBeUndefined();
        });

        it('allows re-registering after clear', () => {
            const plugin = createTestPlugin('wh40k-10e');

            PluginRegistry.register(plugin);
            PluginRegistry.clear();

            const newPlugin = createTestPlugin('wh40k-10e', 'New Plugin');

            PluginRegistry.register(newPlugin);

            expect(PluginRegistry.ids()).toEqual(['wh40k-10e']);
            expect(PluginRegistry.get('wh40k-10e')?.name).toBe('New Plugin');
        });
    });
});
