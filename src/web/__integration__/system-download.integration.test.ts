/**
 * Integration test for the system download/sync chain.
 *
 * Exercises the full path that the web DataContextProvider follows when a user
 * enables a game system:
 *
 *   DataContextBuilder.builder() → system(stub) → adapter(mock) → build()
 *     └── gameSystem.register()
 *     └── adapter.initialize()
 *     └── gameSystem.createGameContext()
 *     └── gameContext.sync()          ← failure injected here
 *
 * The test verifies that a sync failure propagates out of `build()` as a
 * rejected promise so that the DataContextProvider catch block can surface
 * it to the UI.
 *
 * @requirements
 * 1. When gameContext.sync() returns partial failures, build() must resolve and expose syncResult.
 * 2. When gameContext.sync() reports total failure, build() must reject with complete failure details.
 * 3. When gameContext.sync() resolves successfully, build() must resolve with a valid DataContext.
 * 4. When gameContext.sync is undefined, build() must resolve normally (no-op sync).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataContextBuilder } from '@armoury/data-context';
import type {
    GameSystem,
    GameContextResult,
    SyncResult,
    ArmyDAO,
    CampaignDAO,
    DatabaseAdapter,
    FileSyncStatus,
    QueryOptions,
    EntityMap,
    EntityType,
} from '@armoury/data-dao';
import {
    Platform,
    clearSchemaExtensions,
    clearCodecRegistry,
    clearHydrationRegistry,
    PluginRegistry,
} from '@armoury/data-dao';

/**
 * Minimal in-memory mock adapter for integration tests.
 * Self-contained — does not import from internal package paths.
 */
class MockDatabaseAdapter implements DatabaseAdapter {
    readonly platform = Platform.SQLite;
    private store = new Map<string, Map<string, unknown>>();
    private syncStore = new Map<string, FileSyncStatus>();
    initialized = false;

    async initialize(): Promise<void> {
        this.initialized = true;
    }

    async close(): Promise<void> {
        this.initialized = false;
    }

    async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        return (this.store.get(store)?.get(id) as EntityMap[T]) ?? null;
    }

    async getAll<T extends EntityType>(_store: T, _options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]> {
        return [];
    }

    async getByField<T extends EntityType>(
        _store: T,
        _field: keyof EntityMap[T],
        _value: string,
        _options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]> {
        return [];
    }

    async count<T extends EntityType>(_store: T, _field?: keyof EntityMap[T], _value?: string): Promise<number> {
        return 0;
    }

    async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        if (!this.store.has(store)) {
            this.store.set(store, new Map());
        }

        this.store.get(store)!.set((entity as { id: string }).id, entity);
    }

    async putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void> {
        for (const entity of entities) {
            await this.put(store, entity);
        }
    }

    async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        this.store.get(store)?.delete(id);
    }

    async deleteAll<T extends EntityType>(store: T): Promise<void> {
        this.store.delete(store);
    }

    async deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void> {
        const items = await this.getByField(store, field, value);

        for (const item of items) {
            await this.delete(store, (item as { id: string }).id);
        }
    }

    async transaction<R>(fn: () => Promise<R>): Promise<R> {
        return fn();
    }

    async getSyncStatus(fileKey: string): Promise<FileSyncStatus | null> {
        return this.syncStore.get(fileKey) ?? null;
    }

    async setSyncStatus(fileKey: string, sha: string, etag?: string, lastModified?: string): Promise<void> {
        this.syncStore.set(fileKey, { fileKey, sha, lastSynced: new Date(), etag, lastModified });
    }

    async deleteSyncStatus(fileKey: string): Promise<void> {
        this.syncStore.delete(fileKey);
    }

    async getAllSyncStatuses(): Promise<FileSyncStatus[]> {
        return Array.from(this.syncStore.values());
    }
}

/**
 * Creates a stub ArmyDAO with vi.fn() methods.
 * Mirrors the shape required by DataContext.
 */
function createStubArmyDAO(): ArmyDAO {
    return {
        save: vi.fn(),
        saveMany: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        listByOwner: vi.fn(),
        listByFaction: vi.fn(),
        delete: vi.fn(),
        deleteAll: vi.fn(),
        count: vi.fn(),
    };
}

/**
 * Creates a stub CampaignDAO with vi.fn() methods.
 * Mirrors the shape required by DataContext.
 */
function createStubCampaignDAO(): CampaignDAO {
    return {
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
    };
}

function makeSyncResult(overrides: Partial<SyncResult> = {}): SyncResult {
    const success = overrides.success ?? true;

    return {
        success,
        total: overrides.total ?? 40,
        succeeded: overrides.succeeded ?? (success ? ['CoreRules'] : []),
        failures: overrides.failures ?? [],
        timestamp: overrides.timestamp ?? new Date().toISOString(),
    };
}

/**
 * Creates a stub GameSystem whose sync() behaviour is controllable via the returned
 * `syncFn` mock. This allows each test to decide whether sync resolves or rejects.
 */
function createStubGameSystem(syncFn?: () => Promise<SyncResult>): {
    system: GameSystem;
    gameContext: GameContextResult;
} {
    const gameContext: GameContextResult = {
        armies: createStubArmyDAO(),
        campaigns: createStubCampaignDAO(),
        game: {},
        sync: syncFn ?? vi.fn().mockResolvedValue(makeSyncResult()),
    };

    const system: GameSystem = {
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
        getSyncFileKeyPrefixes: vi.fn(() => []),
    };

    return { system, gameContext };
}

describe('System Download Chain Integration', () => {
    let mockAdapter: MockDatabaseAdapter;

    beforeEach(() => {
        // Clear all global registries to prevent cross-test pollution
        clearSchemaExtensions();
        clearCodecRegistry();
        clearHydrationRegistry();
        PluginRegistry.clear();

        mockAdapter = new MockDatabaseAdapter();
    });

    describe('sync failure propagation', () => {
        it('resolves build() and stores syncResult when sync has partial failures', async () => {
            const syncFn = vi.fn().mockResolvedValue(
                makeSyncResult({
                    success: false,
                    total: 40,
                    succeeded: ['CoreRules', 'SpaceMarines'],
                    failures: [
                        { dao: 'ChapterApproved', error: 'Mock DAO failure' },
                        { dao: 'Aeldari', error: 'Mock DAO failure' },
                    ],
                }),
            );
            const { system } = createStubGameSystem(syncFn);

            const dc = (await new DataContextBuilder().system(system).adapter(mockAdapter).build()) as {
                syncResult?: SyncResult;
            };

            expect(dc.syncResult?.success).toBe(false);
            expect(dc.syncResult?.failures).toHaveLength(2);
            expect(dc.syncResult?.failures.map((failure: { dao: string }) => failure.dao)).toEqual(
                expect.arrayContaining(['ChapterApproved', 'Aeldari']),
            );
        });

        it('rejects build() when gameContext.sync() reports complete failure', async () => {
            const syncFn = vi.fn().mockResolvedValue(
                makeSyncResult({
                    success: false,
                    total: 3,
                    succeeded: [],
                    failures: [
                        { dao: 'CoreRules', error: 'Not Found' },
                        { dao: 'ChapterApproved', error: 'Not Found' },
                        { dao: 'Aeldari', error: 'Not Found' },
                    ],
                }),
            );
            const { system } = createStubGameSystem(syncFn);

            await expect(new DataContextBuilder().system(system).adapter(mockAdapter).build()).rejects.toThrow(
                'Complete sync failure: all 3 DAOs failed. Failed: CoreRules, ChapterApproved, Aeldari',
            );
        });
    });

    describe('sync success path', () => {
        it('resolves build() with a valid DataContext when sync succeeds', async () => {
            const syncFn = vi.fn().mockResolvedValue(makeSyncResult({ success: true, failures: [] }));
            const { system } = createStubGameSystem(syncFn);

            const dc = await new DataContextBuilder().system(system).adapter(mockAdapter).build();

            expect(dc).toBeDefined();
            expect(dc.armies).toBeDefined();
            expect(dc.campaigns).toBeDefined();
            expect(dc.game).toBeDefined();
            expect(syncFn).toHaveBeenCalledOnce();
            expect((dc as { syncResult?: SyncResult }).syncResult?.success).toBe(true);
            expect((dc as { syncResult?: SyncResult }).syncResult?.failures).toHaveLength(0);

            await dc.close();
        });

        it('resolves build() when sync is undefined (no-op)', async () => {
            const gameContext: GameContextResult = {
                armies: createStubArmyDAO(),
                campaigns: createStubCampaignDAO(),
                game: {},
                // sync intentionally omitted
            };

            const system: GameSystem = {
                id: 'no-sync-system',
                name: 'No Sync System',
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
                getSyncFileKeyPrefixes: vi.fn(() => []),
            };

            const dc = await new DataContextBuilder().system(system).adapter(mockAdapter).build();

            expect(dc).toBeDefined();

            await dc.close();
        });
    });

    describe('DataContextProvider error surface contract', () => {
        /**
         * Simulates the exact catch path in DataContextProvider.enableSystem().
         * This is the contract the UI depends on — if build() rejects, the catch
         * block must receive a meaningful error message to display.
         */
        it('catch block receives a meaningful error message from sync failure', async () => {
            const syncFn = vi.fn().mockResolvedValue(
                makeSyncResult({
                    success: false,
                    total: 1,
                    succeeded: [],
                    failures: [{ dao: 'ChapterApproved', error: 'Not Found' }],
                }),
            );
            const { system } = createStubGameSystem(syncFn);

            let caughtMessage: string | undefined;

            try {
                await new DataContextBuilder().system(system).adapter(mockAdapter).build();
            } catch (err) {
                caughtMessage = err instanceof Error ? err.message : 'Failed to initialize DataContext';
            }

            expect(caughtMessage).toBe('Complete sync failure: all 1 DAOs failed. Failed: ChapterApproved');
        });

        it('catch block handles non-Error throws gracefully', async () => {
            // Some libraries throw strings or plain objects instead of Errors
            const syncFn = vi.fn().mockRejectedValue('unexpected string error');
            const { system } = createStubGameSystem(syncFn);

            let caughtMessage: string | undefined;

            try {
                await new DataContextBuilder().system(system).adapter(mockAdapter).build();
            } catch (err) {
                // Mirrors DataContextProvider: err instanceof Error ? err.message : fallback
                caughtMessage = err instanceof Error ? err.message : 'Failed to initialize DataContext';
            }

            // Non-Error throws should hit the fallback message path
            expect(caughtMessage).toBe('Failed to initialize DataContext');
        });
    });
});
