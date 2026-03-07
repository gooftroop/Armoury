/**
 * Unit tests for DataContextBuilder.
 * Tests builder validation, lifecycle method calls, and proper DataContext assembly.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataContextBuilder } from '@data/DataContextBuilder.js';
import { MockDatabaseAdapter } from '@wh40k10e/__mocks__/MockDatabaseAdapter.js';
import type { GameSystem } from '@data/types.js';
import type { IGitHubClient } from '@clients-github/types.js';
import type { GameContextResult } from '@data/types.js';
import { clearSchemaExtensions } from '@data/schema.js';
import { clearCodecRegistry } from '@data/codec.js';
import { clearHydrationRegistry } from '@data/hydration.js';
import { PluginRegistry } from '@data/pluginRegistry.js';

/** Creates a stub GameSystem with vi.fn() methods for testing. */
function createStubGameSystem(): GameSystem {
    const gameContext = {
        armies: {
            save: vi.fn(),
            saveMany: vi.fn(),
            get: vi.fn(),
            list: vi.fn(),
            listByOwner: vi.fn(),
            listByFaction: vi.fn(),
            delete: vi.fn(),
            deleteAll: vi.fn(),
            count: vi.fn(),
        },
        campaigns: {
            save: vi.fn(),
            saveMany: vi.fn(),
            get: vi.fn(),
            list: vi.fn(),
            listByOrganizer: vi.fn(),
            listByStatus: vi.fn(),
            listByType: vi.fn(),
            delete: vi.fn(),
            deleteAll: vi.fn(),
            count: vi.fn(),
        },
        matches: {
            save: vi.fn(),
            saveMany: vi.fn(),
            get: vi.fn(),
            list: vi.fn(),
            listByPlayer: vi.fn(),
            listByCampaign: vi.fn(),
            delete: vi.fn(),
            deleteAll: vi.fn(),
            count: vi.fn(),
        },
        game: {},
        sync: vi.fn(),
    };

    return {
        id: 'test-system',
        name: 'Test System',
        version: '1.0.0',
        dataSource: {
            type: 'github',
            owner: 'test-owner',
            repo: 'test-repo',
            coreFile: 'core.gst',
            description: 'Test data source',
            licenseStatus: 'MIT',
        },
        entityKinds: [],
        validationRules: [],
        getHydrators: vi.fn(() => new Map()),
        getSchemaExtension: vi.fn(() => ({})),
        register: vi.fn(),
        createGameContext: vi.fn(() => gameContext),
    };
}

/** Creates a stub GitHub client for testing. */
function createStubGitHubClient(): IGitHubClient {
    return {
        listFiles: vi.fn(),
        getFileSha: vi.fn(),
        downloadFile: vi.fn(),
        checkForUpdates: vi.fn(),
    };
}

describe('DataContextBuilder', () => {
    let mockAdapter: MockDatabaseAdapter;
    let stubSystem: GameSystem;

    beforeEach(() => {
        // Clear all global registries before each test
        clearSchemaExtensions();
        clearCodecRegistry();
        clearHydrationRegistry();
        PluginRegistry.clear();

        // Create fresh instances
        mockAdapter = new MockDatabaseAdapter();
        stubSystem = createStubGameSystem();
    });

    describe('validation', () => {
        it('throws if no system is provided', async () => {
            await expect(new DataContextBuilder().adapter(mockAdapter).build()).rejects.toThrow(
                'Game system is required to build a DataContext.',
            );
        });

        it('throws if no adapter is provided', async () => {
            await expect(new DataContextBuilder().system(stubSystem).build()).rejects.toThrow(
                'An adapter must be provided to build a DataContext.',
            );
        });
    });

    describe('build lifecycle', () => {
        it('builds a DataContext with pre-built adapter', async () => {
            const dc = await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            expect(dc).toBeDefined();
            expect(dc.accounts).toBeDefined();
            expect(dc.social).toBeDefined();
            expect(dc.armies).toBeDefined();
            expect(dc.campaigns).toBeDefined();
            expect(dc.matches).toBeDefined();
            expect(dc.game).toBeDefined();
            expect(dc.close).toBeDefined();

            await dc.close();
        });

        it('calls gameSystem.register() during build', async () => {
            await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            expect(stubSystem.register).toHaveBeenCalledOnce();
        });

        it('calls adapter.initialize() when using pre-built adapter', async () => {
            const initializeSpy = vi.spyOn(mockAdapter, 'initialize');

            await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            expect(initializeSpy).toHaveBeenCalledOnce();
        });

        it('calls gameSystem.createGameContext() with adapter', async () => {
            await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            expect(stubSystem.createGameContext).toHaveBeenCalledOnce();
            expect(stubSystem.createGameContext).toHaveBeenCalledWith(mockAdapter, expect.any(Object));
        });

        it('passes GitHub client to createGameContext when provided', async () => {
            const githubClient = createStubGitHubClient();

            await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).github(githubClient).build();

            expect(stubSystem.createGameContext).toHaveBeenCalledWith(mockAdapter, githubClient);
        });

        it('calls gameContext.sync() if sync method exists', async () => {
            await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            const gameContext = vi.mocked(stubSystem.createGameContext).mock.results[0]?.value as GameContextResult;
            expect(gameContext.sync).toHaveBeenCalledOnce();
        });

        it('does not throw if sync method does not exist', async () => {
            // Create a game context without sync method
            const gameContextWithoutSync = {
                armies: {
                    save: vi.fn(),
                    saveMany: vi.fn(),
                    get: vi.fn(),
                    list: vi.fn(),
                    listByOwner: vi.fn(),
                    listByFaction: vi.fn(),
                    delete: vi.fn(),
                    deleteAll: vi.fn(),
                    count: vi.fn(),
                },
                campaigns: {
                    save: vi.fn(),
                    saveMany: vi.fn(),
                    get: vi.fn(),
                    list: vi.fn(),
                    listByOrganizer: vi.fn(),
                    listByStatus: vi.fn(),
                    listByType: vi.fn(),
                    delete: vi.fn(),
                    deleteAll: vi.fn(),
                    count: vi.fn(),
                },
                matches: {
                    save: vi.fn(),
                    saveMany: vi.fn(),
                    get: vi.fn(),
                    list: vi.fn(),
                    listByPlayer: vi.fn(),
                    listByCampaign: vi.fn(),
                    delete: vi.fn(),
                    deleteAll: vi.fn(),
                    count: vi.fn(),
                },
                game: {},
            };

            vi.mocked(stubSystem.createGameContext).mockReturnValue(gameContextWithoutSync);

            await expect(
                new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build(),
            ).resolves.toBeDefined();
        });
    });

    describe('DataContext shape', () => {
        it('wires up core DAOs (accounts, social)', async () => {
            const dc = await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            expect(dc.accounts).toBeDefined();
            expect(dc.accounts.get).toBeDefined();
            expect(dc.accounts.save).toBeDefined();
            expect(dc.accounts.delete).toBeDefined();

            expect(dc.social).toBeDefined();
            expect(dc.social.get).toBeDefined();
            expect(dc.social.save).toBeDefined();
            expect(dc.social.list).toBeDefined();
            expect(dc.social.delete).toBeDefined();

            await dc.close();
        });

        it('wires up game-specific DAOs from gameContext', async () => {
            const dc = await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            expect(dc.armies).toBeDefined();
            expect(dc.campaigns).toBeDefined();
            expect(dc.matches).toBeDefined();
            expect(dc.game).toBeDefined();

            await dc.close();
        });

        it('provides close() method that closes the adapter', async () => {
            const closeSpy = vi.spyOn(mockAdapter, 'close');

            const dc = await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            await dc.close();

            expect(closeSpy).toHaveBeenCalledOnce();
        });
    });
});
