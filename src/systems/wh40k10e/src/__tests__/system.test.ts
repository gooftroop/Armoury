import { describe, it, expect, beforeEach } from 'vitest';
import { wh40k10eSystem, EntityKind } from '@/system.js';
import { hasEntityCodec, clearCodecRegistry } from '@armoury/data-dao';
import { hasHydrator, clearHydrationRegistry } from '@armoury/data-dao';
import { getSchemaExtensions, clearSchemaExtensions } from '@armoury/data-dao';
import { PluginRegistry } from '@armoury/data-dao';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { MockGitHubClient } from '@/__mocks__/MockGitHubClient.js';

/**
 * System test suite for wh40k10e GameSystem registration.
 * Tests registration of entity codecs, hydrators, schema extensions,
 * and GameContext creation with all DAOs and game data.
 */
describe('wh40k10eSystem', () => {
    /**
     * Clear all global registries before each test to ensure test isolation.
     */
    beforeEach(() => {
        clearCodecRegistry();
        clearHydrationRegistry();
        clearSchemaExtensions();
        PluginRegistry.clear();
    });

    /**
     * register() method tests.
     */
    describe('register()', () => {
        /**
         * Test: register() registers entity codecs for all codec-enabled entity kinds.
         */
        it('registers entity codecs for factionData, coreRules, and chapterApproved', () => {
            wh40k10eSystem.register();

            expect(hasEntityCodec('factionData')).toBe(true);
            expect(hasEntityCodec('coreRules')).toBe(true);
            expect(hasEntityCodec('chapterApproved')).toBe(true);
        });

        /**
         * Test: register() registers hydrators for all hydrator-enabled entity kinds.
         */
        it('registers hydrators for factionData, coreRules, and chapterApproved', () => {
            wh40k10eSystem.register();

            expect(hasHydrator('factionData')).toBe(true);
            expect(hasHydrator('coreRules')).toBe(true);
            expect(hasHydrator('chapterApproved')).toBe(true);
        });

        /**
         * Test: register() registers a schema extension in the global schema registry.
         */
        it('registers a schema extension in the global schema registry', () => {
            // Clear extensions first to isolate this test
            clearSchemaExtensions();

            wh40k10eSystem.register();

            // getSchemaExtensions() returns at least the core schema (auto-registered) + wh40k10e schema
            const extensions = getSchemaExtensions();
            expect(extensions.length).toBeGreaterThan(0);
        });

        /**
         * Test: register() does not throw.
         */
        it('does not throw when called', () => {
            expect(() => wh40k10eSystem.register()).not.toThrow();
        });
    });

    /**
     * createGameContext() method tests.
     */
    describe('createGameContext()', () => {
        function createClientsMap(githubClient: MockGitHubClient): Map<string, unknown> {
            return new Map<string, unknown>([['github', githubClient]]);
        }

        /**
         * Test: createGameContext() returns an object with armies DAO.
         */
        it('returns an object with armies DAO', () => {
            const adapter = new MockDatabaseAdapter();
            const githubClient = new MockGitHubClient();

            const context = wh40k10eSystem.createGameContext(adapter, createClientsMap(githubClient));

            expect(context.armies).toBeDefined();
            expect(context.armies).toHaveProperty('save');
            expect(context.armies).toHaveProperty('get');
            expect(context.armies).toHaveProperty('list');
            expect(context.armies).toHaveProperty('delete');
        });

        /**
         * Test: createGameContext() returns an object with campaigns DAO.
         */
        it('returns an object with campaigns DAO', () => {
            const adapter = new MockDatabaseAdapter();
            const githubClient = new MockGitHubClient();

            const context = wh40k10eSystem.createGameContext(adapter, createClientsMap(githubClient));

            expect(context.campaigns).toBeDefined();
            expect(context.campaigns).toHaveProperty('save');
            expect(context.campaigns).toHaveProperty('get');
            expect(context.campaigns).toHaveProperty('list');
            expect(context.campaigns).toHaveProperty('delete');
        });

        /**
         * Test: createGameContext() returns an object with a game property containing faction getters.
         */
        it('returns an object with game property containing faction getters', () => {
            const adapter = new MockDatabaseAdapter();
            const githubClient = new MockGitHubClient();

            const context = wh40k10eSystem.createGameContext(adapter, createClientsMap(githubClient));

            expect(context.game).toBeDefined();
            // Verify sample faction getters exist as property descriptors
            const gameDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(context.game!));
            expect(gameDescriptors.spaceMarines).toBeDefined();
            expect(gameDescriptors.bloodAngels).toBeDefined();
            expect(gameDescriptors.necrons).toBeDefined();
            expect(gameDescriptors.tyranids).toBeDefined();
        });

        /**
         * Test: createGameContext() returns game object with coreRules and crusadeRules getters.
         */
        it('returns game object with coreRules and crusadeRules getters', () => {
            const adapter = new MockDatabaseAdapter();
            const githubClient = new MockGitHubClient();

            const context = wh40k10eSystem.createGameContext(adapter, createClientsMap(githubClient));

            expect(context.game).toBeDefined();
            const gameDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(context.game!));
            expect(gameDescriptors.coreRules).toBeDefined();
            expect(gameDescriptors.crusadeRules).toBeDefined();
        });

        /**
         * Test: createGameContext() returns game object with sync() method.
         */
        it('returns game object with sync() method', () => {
            const adapter = new MockDatabaseAdapter();
            const githubClient = new MockGitHubClient();

            const context = wh40k10eSystem.createGameContext(adapter, createClientsMap(githubClient));

            expect(context.game).toBeDefined();
            expect(context.game).toHaveProperty('sync');
            expect(typeof (context.game as { sync: () => Promise<void> }).sync).toBe('function');
        });

        /**
         * Test: createGameContext() returns an object with a sync function at the context level.
         */
        it('returns an object with a sync function at the context level', () => {
            const adapter = new MockDatabaseAdapter();
            const githubClient = new MockGitHubClient();

            const context = wh40k10eSystem.createGameContext(adapter, createClientsMap(githubClient));

            expect(context.sync).toBeDefined();
            expect(typeof context.sync).toBe('function');
        });
    });

    /**
     * EntityKind enum tests.
     */
    describe('EntityKind enum', () => {
        /**
         * Test: EntityKind enum values match expected store names.
         */
        it('enum values match expected store names', () => {
            expect(EntityKind.Unit).toBe('unit');
            expect(EntityKind.Weapon).toBe('weapon');
            expect(EntityKind.Ability).toBe('ability');
            expect(EntityKind.Stratagem).toBe('stratagem');
            expect(EntityKind.Detachment).toBe('detachment');
            expect(EntityKind.Faction).toBe('faction');
            expect(EntityKind.FactionData).toBe('factionData');
            expect(EntityKind.CoreRules).toBe('coreRules');
            expect(EntityKind.CrusadeRules).toBe('crusadeRules');
            expect(EntityKind.Army).toBe('army');
            expect(EntityKind.ChapterApproved).toBe('chapterApproved');
        });

        /**
         * Test: EntityKind enum contains all expected entity kinds.
         */
        it('enum contains all expected entity kinds', () => {
            const expectedKinds = [
                'unit',
                'weapon',
                'ability',
                'stratagem',
                'detachment',
                'faction',
                'factionData',
                'coreRules',
                'crusadeRules',
                'army',
                'chapterApproved',
            ];

            const enumValues = Object.values(EntityKind);

            for (const kind of expectedKinds) {
                expect(enumValues).toContain(kind);
            }
        });
    });
});
