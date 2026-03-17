/**
 * Unit tests for DataContextBuilder.
 * Tests builder validation, lifecycle method calls, and proper DataContext assembly.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataContextBuilder } from '@/DataContextBuilder.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import type { GameSystem } from '@armoury/data-dao';
import type { GameContextResult } from '@armoury/data-dao';
import type { SyncResult } from '@armoury/data-dao';
import { clearSchemaExtensions } from '@armoury/data-dao';
import { clearCodecRegistry } from '@armoury/data-dao';
import { clearHydrationRegistry } from '@armoury/data-dao';
import { PluginRegistry } from '@armoury/data-dao';

/** Creates a stub GameSystem with vi.fn() methods for testing. */
function createStubGameSystem(): GameSystem {
    const successfulSyncResult: SyncResult = makeSyncResult({ success: true, failures: [] });

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
        sync: vi.fn().mockResolvedValue(successfulSyncResult),
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

function makeSyncResult(overrides: Partial<SyncResult>): SyncResult {
    const defaultSucceeded = overrides.success === false ? [] : ['CoreRules'];

    return {
        success: true,
        total: 40,
        succeeded: defaultSucceeded,
        failures: [],
        timestamp: new Date().toISOString(),
        ...overrides,
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
            expect(stubSystem.createGameContext).toHaveBeenCalledWith(mockAdapter, expect.any(Map));
        });

        it('passes registered clients map to createGameContext', async () => {
            const mockClient = { listFiles: vi.fn() };

            await new DataContextBuilder()
                .system(stubSystem)
                .adapter(mockAdapter)
                .register('github', mockClient)
                .build();

            const passedMap = vi.mocked(stubSystem.createGameContext).mock.calls[0]?.[1] as unknown as Map<
                string,
                unknown
            >;
            expect(passedMap).toBeInstanceOf(Map);
            expect(passedMap.get('github')).toBe(mockClient);
        });

        it('calls gameContext.sync() if sync method exists', async () => {
            await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            const gameContext = vi.mocked(stubSystem.createGameContext).mock.results[0]?.value as GameContextResult;
            expect(gameContext.sync).toHaveBeenCalledOnce();
        });

        it('stores syncResult when sync has partial failures', async () => {
            const partialFailureResult = makeSyncResult({
                success: false,
                succeeded: ['CoreRules'],
                failures: [{ dao: 'Aeldari', error: 'Mock DAO failure' }],
            });
            const syncFn = vi.fn().mockResolvedValue(partialFailureResult);
            const gameContext = {
                ...vi.mocked(stubSystem.createGameContext).mock.results[0]?.value,
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
                game: {},
                sync: syncFn,
            } as GameContextResult;

            vi.mocked(stubSystem.createGameContext).mockReturnValue(gameContext);

            const dc = await new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build();

            expect(dc.syncResult).toEqual(partialFailureResult);
        });

        it('throws complete sync failure when all DAOs fail', async () => {
            const totalFailureResult = makeSyncResult({
                success: false,
                succeeded: [],
                failures: [
                    { dao: 'CoreRules', error: 'core failed' },
                    { dao: 'Aeldari', error: 'aeldari failed' },
                ],
                total: 2,
            });
            const syncFn = vi.fn().mockResolvedValue(totalFailureResult);
            const baseGameContext = {
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
                game: {},
            };
            vi.mocked(stubSystem.createGameContext).mockReturnValue({
                ...baseGameContext,
                sync: syncFn,
            });

            await expect(new DataContextBuilder().system(stubSystem).adapter(mockAdapter).build()).rejects.toThrow(
                'Complete sync failure: all 2 DAOs failed. Failed: CoreRules, Aeldari',
            );
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
