/**
 * DataContextManager SyncResult tracking tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-MGR-SR-001 | runSyncJob captures SyncResult and exposes it via snapshot getter. | T1 |
 * | REQ-WEB-MGR-SR-002 | selectLastSyncResult emits null initially and latest SyncResult after sync. | T2 |
 * | REQ-WEB-MGR-SR-003 | runSyncJob preserves throw semantics on error and stores null snapshot. | T3 |
 * | REQ-WEB-MGR-SR-004 | Last SyncResult is tracked per-system and does not cross-emit globally. | T4 |
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { DataContext } from '@armoury/data-context';
import type { DatabaseAdapter, FileSyncStatus, GameSystem, SyncResult } from '@armoury/data-dao';

import { DataContextManager } from '../DataContextManager.js';

const {
    adapterMock,
    createContainerWithModulesMock,
    DataContextBuilderMock,
    getQueryClientMock,
    queryClientToken,
    adapterFactoryToken,
    githubFactoryToken,
    wahapediaFactoryToken,
} = vi.hoisted(() => {
    const adapter = {
        initialize: vi.fn(async () => undefined),
        close: vi.fn(async () => undefined),
        getAllSyncStatuses: vi.fn(async () => [] as FileSyncStatus[]),
        rawQuery: vi.fn(async () => ({ rows: [] as unknown[] })),
    };

    const queryClientTokenValue = Symbol.for('QueryClient');
    const adapterFactoryTokenValue = Symbol.for('AdapterFactory');
    const githubFactoryTokenValue = Symbol.for('GitHubClientFactory');
    const wahapediaFactoryTokenValue = Symbol.for('WahapediaClientFactory');

    const adapterFactory = vi.fn(async () => adapter as unknown as DatabaseAdapter);
    const githubFactory = vi.fn(async () => ({ kind: 'github' }));
    const wahapediaFactory = vi.fn(async () => ({ kind: 'wahapedia' }));

    const bindMock = vi.fn(() => ({ toConstantValue: vi.fn() }));
    const getMock = vi.fn((token: symbol) => {
        if (token === adapterFactoryTokenValue) {
            return adapterFactory;
        }

        if (token === githubFactoryTokenValue) {
            return githubFactory;
        }

        if (token === wahapediaFactoryTokenValue) {
            return wahapediaFactory;
        }

        if (token === queryClientTokenValue) {
            return { id: 'query-client' } as unknown as QueryClient;
        }

        return undefined;
    });

    return {
        adapterMock: adapter,
        createContainerWithModulesMock: vi.fn(() => ({
            bind: bindMock,
            get: getMock,
        })),
        DataContextBuilderMock: {
            builder: vi.fn(),
        },
        getQueryClientMock: vi.fn(() => ({ id: 'query-client' }) as unknown as QueryClient),
        queryClientToken: queryClientTokenValue,
        adapterFactoryToken: adapterFactoryTokenValue,
        githubFactoryToken: githubFactoryTokenValue,
        wahapediaFactoryToken: wahapediaFactoryTokenValue,
    };
});

vi.mock('@armoury/di', () => ({
    createContainerWithModules: createContainerWithModulesMock,
    coreModule: { name: 'core-module' },
    TOKENS: {
        QueryClient: queryClientToken,
        AdapterFactory: adapterFactoryToken,
        GitHubClientFactory: githubFactoryToken,
        WahapediaClientFactory: wahapediaFactoryToken,
    },
}));

vi.mock('@armoury/di/web', () => ({
    webModule: { name: 'web-module' },
}));

vi.mock('@armoury/data-context', () => ({
    DataContextBuilder: DataContextBuilderMock,
}));

vi.mock('@/lib/getQueryClient.js', () => ({
    getQueryClient: getQueryClientMock,
}));

function createSystem(id: string, prefixes: string[] = [`${id}:`]): GameSystem {
    return {
        id,
        name: `System ${id}`,
        version: '1.0.0',
        dataSource: {
            type: 'github',
            owner: 'owner',
            repo: 'repo',
            coreFile: 'core',
            description: 'desc',
            licenseStatus: 'ok',
        },
        entityKinds: [],
        validationRules: [],
        getHydrators: () => new Map(),
        getSchemaExtension: () => ({}),
        register: () => undefined,
        createGameContext: () => ({}),
        getSyncFileKeyPrefixes: () => prefixes,
    };
}

describe('DataContextManager SyncResult tracking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        adapterMock.initialize.mockResolvedValue(undefined);
        adapterMock.close.mockResolvedValue(undefined);
        adapterMock.getAllSyncStatuses.mockResolvedValue([]);
        adapterMock.rawQuery.mockResolvedValue({ rows: [] });
    });

    afterEach(async () => {
        vi.useRealTimers();
    });

    it('T1: captures SyncResult from dataContext.sync()', async () => {
        const syncResult: SyncResult = {
            success: true,
            total: 3,
            succeeded: ['daoA', 'daoB', 'daoC'],
            failures: [],
            timestamp: '2026-04-30T00:00:00.000Z',
        };

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => syncResult),
                    }) as unknown as DataContext,
            ),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));

        await vi.waitFor(() => {
            expect(
                (
                    manager as unknown as { getLastSyncResultSnapshot: (systemId: string) => SyncResult | null }
                ).getLastSyncResultSnapshot('alpha'),
            ).toEqual(syncResult);
        });

        await manager.dispose();
    });

    it('T2: exposes SyncResult via selectLastSyncResult observable', async () => {
        const syncResult: SyncResult = {
            success: true,
            total: 1,
            succeeded: ['daoA'],
            failures: [],
            timestamp: '2026-04-30T00:00:01.000Z',
        };

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => syncResult),
                    }) as unknown as DataContext,
            ),
        });

        const manager = new DataContextManager();
        const emissions: Array<SyncResult | null> = [];
        const subscription = (
            manager as unknown as {
                selectLastSyncResult: (systemId: string) => {
                    subscribe: (cb: (value: SyncResult | null) => void) => { unsubscribe: () => void };
                };
            }
        )
            .selectLastSyncResult('alpha')
            .subscribe((value) => {
                emissions.push(value);
            });

        await manager.enableSystem(createSystem('alpha'));

        await vi.waitFor(() => {
            expect(emissions).toEqual([null, syncResult]);
        });

        subscription.unsubscribe();
        await manager.dispose();
    });

    it('T3: preserves error path semantics', async () => {
        const syncError = new Error('sync failed');

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => Promise.reject(syncError)),
                    }) as unknown as DataContext,
            ),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));

        await expect(
            (manager as unknown as { runSyncJob: (systemId: string) => Promise<void> }).runSyncJob('alpha'),
        ).rejects.toThrow('sync failed');

        expect(
            (
                manager as unknown as { getLastSyncResultSnapshot: (systemId: string) => SyncResult | null }
            ).getLastSyncResultSnapshot('alpha'),
        ).toBeNull();

        await manager.dispose();
    });

    it('T4: result is per-system, not global', async () => {
        const syncBySystem: Record<string, SyncResult | null> = {
            alpha: null,
            beta: {
                success: true,
                total: 2,
                succeeded: ['daoX', 'daoY'],
                failures: [],
                timestamp: '2026-04-30T00:00:02.000Z',
            },
        };

        DataContextBuilderMock.builder.mockImplementation(() => {
            let systemId = 'unknown';

            const chain = {
                system: vi.fn((system: GameSystem) => {
                    systemId = system.id;

                    return chain;
                }),
                adapter: vi.fn(() => chain),
                ownsAdapter: vi.fn(() => chain),
                register: vi.fn(() => chain),
                buildFromCache: vi.fn(
                    async () =>
                        ({
                            close: vi.fn(async () => undefined),
                            sync: vi.fn(async () => syncBySystem[systemId]),
                        }) as unknown as DataContext,
                ),
            };

            return chain;
        });

        const manager = new DataContextManager();
        const alphaEmissions: Array<SyncResult | null> = [];
        const alphaSubscription = (
            manager as unknown as {
                selectLastSyncResult: (systemId: string) => {
                    subscribe: (cb: (value: SyncResult | null) => void) => { unsubscribe: () => void };
                };
            }
        )
            .selectLastSyncResult('alpha')
            .subscribe((value) => {
                alphaEmissions.push(value);
            });

        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('beta'));

        await vi.waitFor(() => {
            expect(manager.getSnapshot().systemSyncStates.beta?.status).toBe('synced');
        });

        expect(alphaEmissions).toEqual([null]);

        alphaSubscription.unsubscribe();
        await manager.dispose();
    });
});
