/**
 * DataContextManager unit tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-MGR-001 | enableSystem initializes a shared adapter exactly once. | T1 |
 * | REQ-WEB-MGR-002 | All enabled systems share one adapter and one DI container. | T2 |
 * | REQ-WEB-MGR-003 | disableSystem closes only the target DataContext. | T3 |
 * | REQ-WEB-MGR-004 | dispose closes shared adapter exactly once. | T4 |
 * | REQ-WEB-MGR-005 | Sync queue runs jobs in FIFO order. | T5 |
 * | REQ-WEB-MGR-006 | Queue deduplicates system jobs while queued/running. | T6 |
 * | REQ-WEB-MGR-007 | Queue survives sync job errors and continues processing. | T7 |
 * | REQ-WEB-MGR-008 | Progress stream emits a new collector per sync job. | T8 |
 * | REQ-WEB-MGR-009 | selectSystem emits only for selected system changes. | T9 |
 * | REQ-WEB-MGR-010 | Active DataContext reference remains stable across sync state churn. | T10 |
 * | REQ-WEB-MGR-011 | probeSyncedSystems reuses existing adapter instance. | T11 |
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { DataContext } from '@armoury/data-context';
import type { DatabaseAdapter, FileSyncStatus, GameSystem } from '@armoury/data-dao';

import { DataContextManager } from '../DataContextManager.js';

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
}

type MockDataContext = Pick<DataContext, 'close' | 'sync'>;

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
        containerMock: {
            bindMock,
            getMock,
        },
        DataContextBuilderMock: {
            builder: vi.fn(),
        },
        getQueryClientMock: vi.fn(() => ({ id: 'query-client' }) as unknown as QueryClient),
        adapterFactoryMock: adapterFactory,
        githubFactoryMock: githubFactory,
        wahapediaFactoryMock: wahapediaFactory,
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

function createDeferred<T>(): Deferred<T> {
    let resolve: (value: T) => void = () => undefined;
    let reject: (reason?: unknown) => void = () => undefined;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

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

describe('DataContextManager', () => {
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

    it('T1: enableSystem initializes adapter exactly once across multiple systems', async () => {
        const contextsById: Record<string, MockDataContext> = {
            alpha: { close: vi.fn(async () => undefined), sync: vi.fn(async () => null) },
            beta: { close: vi.fn(async () => undefined), sync: vi.fn(async () => null) },
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
                buildFromCache: vi.fn(async () => contextsById[systemId] as unknown as DataContext),
            };

            return chain;
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('beta'));

        expect(adapterMock.initialize).toHaveBeenCalledTimes(1);

        await manager.dispose();
    });

    it('T2: enabled systems share one adapter and one container', async () => {
        const adapterRefs: unknown[] = [];

        DataContextBuilderMock.builder.mockImplementation(() => {
            const chain = {
                system: vi.fn(() => chain),
                adapter: vi.fn((adapter: unknown) => {
                    adapterRefs.push(adapter);

                    return chain;
                }),
                ownsAdapter: vi.fn(() => chain),
                register: vi.fn(() => chain),
                buildFromCache: vi.fn(
                    async () => ({ close: vi.fn(), sync: vi.fn(async () => null) }) as unknown as DataContext,
                ),
            };

            return chain;
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('beta'));

        expect(createContainerWithModulesMock).toHaveBeenCalledTimes(1);
        expect(adapterRefs).toHaveLength(2);
        expect(adapterRefs[0]).toBe(adapterRefs[1]);

        await manager.dispose();
    });

    it('T3: disableSystem closes its DataContext and leaves adapter open', async () => {
        const closeMock = vi.fn(async () => undefined);
        const syncMock = vi.fn(async () => null);

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(async () => ({ close: closeMock, sync: syncMock }) as unknown as DataContext),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));
        await manager.disableSystem('alpha');

        expect(closeMock).toHaveBeenCalledTimes(1);
        expect(adapterMock.close).not.toHaveBeenCalled();

        await manager.dispose();
    });

    it('T4: dispose closes adapter exactly once', async () => {
        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () => ({ close: vi.fn(), sync: vi.fn(async () => null) }) as unknown as DataContext,
            ),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));
        await manager.dispose();

        expect(adapterMock.close).toHaveBeenCalledTimes(1);
    });

    it('T5: sync jobs run in FIFO order', async () => {
        const startOrder: string[] = [];
        const doneOrder: string[] = [];
        const syncA = createDeferred<null>();
        const syncB = createDeferred<null>();

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
                buildFromCache: vi.fn(async () => {
                    return {
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => {
                            startOrder.push(systemId);

                            if (systemId === 'alpha') {
                                await syncA.promise;
                            } else {
                                await syncB.promise;
                            }

                            doneOrder.push(systemId);

                            return null;
                        }),
                    } as unknown as DataContext;
                }),
            };

            return chain;
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('beta'));

        await vi.waitFor(() => {
            expect(startOrder).toEqual(['alpha']);
        });

        syncA.resolve(null);

        await vi.waitFor(() => {
            expect(startOrder).toEqual(['alpha', 'beta']);
        });

        syncB.resolve(null);

        await vi.waitFor(() => {
            expect(doneOrder).toEqual(['alpha', 'beta']);
        });

        await manager.dispose();
    });

    it('T6: enqueue deduplicates duplicate system while queued/running', async () => {
        const syncDeferred = createDeferred<null>();
        const syncMock = vi.fn(async () => {
            await syncDeferred.promise;

            return null;
        });

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(async () => ({ close: vi.fn(), sync: syncMock }) as unknown as DataContext),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('alpha'));

        await vi.waitFor(() => {
            expect(syncMock).toHaveBeenCalledTimes(1);
        });

        syncDeferred.resolve(null);
        await manager.dispose();
    });

    it('T7: sync job error does not stop queue processing', async () => {
        const executed: string[] = [];

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
                buildFromCache: vi.fn(async () => {
                    return {
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => {
                            executed.push(systemId);

                            if (systemId === 'alpha') {
                                throw new Error('sync failed');
                            }

                            return null;
                        }),
                    } as unknown as DataContext;
                }),
            };

            return chain;
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('beta'));

        await vi.waitFor(() => {
            expect(executed).toEqual(['alpha', 'beta']);
        });

        await manager.dispose();
    });

    it('T8: progress stream emits a new collector reference per sync', async () => {
        const syncA = createDeferred<null>();
        const syncB = createDeferred<null>();

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
                buildFromCache: vi.fn(async () => {
                    return {
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => {
                            if (systemId === 'alpha') {
                                await syncA.promise;
                            } else {
                                await syncB.promise;
                            }

                            return null;
                        }),
                    } as unknown as DataContext;
                }),
            };

            return chain;
        });

        const manager = new DataContextManager();
        const collectors: unknown[] = [];
        const subscription = manager.selectSyncProgress().subscribe((collector) => {
            if (collector) {
                collectors.push(collector);
            }
        });

        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('beta'));

        await vi.waitFor(() => {
            expect(collectors).toHaveLength(1);
        });

        syncA.resolve(null);

        await vi.waitFor(() => {
            expect(collectors).toHaveLength(2);
        });

        expect(collectors[0]).not.toBe(collectors[1]);

        syncB.resolve(null);
        subscription.unsubscribe();
        await manager.dispose();
    });

    it('T9: selectSystem emits only when selected system changes', async () => {
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
                buildFromCache: vi.fn(async () => {
                    return {
                        close: vi.fn(async () => undefined),
                        sync: vi.fn(async () => {
                            if (systemId === 'alpha') {
                                await new Promise((resolve) => {
                                    setTimeout(resolve, 10);
                                });
                            }

                            return null;
                        }),
                    } as unknown as DataContext;
                }),
            };

            return chain;
        });

        const manager = new DataContextManager();
        const states: Array<string | undefined> = [];
        const subscription = manager.selectSystem('alpha').subscribe((state) => {
            states.push(state?.status);
        });

        await manager.enableSystem(createSystem('alpha'));
        await manager.enableSystem(createSystem('beta'));

        await vi.waitFor(() => {
            expect(states).toContain('pending');
            expect(states).toContain('syncing');
            expect(states).toContain('synced');
        });

        const beforeBetaDisable = [...states];
        await manager.disableSystem('beta');
        expect(states).toEqual(beforeBetaDisable);

        subscription.unsubscribe();
        await manager.dispose();
    });

    it('T10: active DataContext reference is stable across sync-state changes', async () => {
        const syncDeferred = createDeferred<null>();
        const dataContextRef = {
            close: vi.fn(async () => undefined),
            sync: vi.fn(async () => {
                await syncDeferred.promise;

                return null;
            }),
        } as unknown as DataContext;

        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(async () => dataContextRef),
        });

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha'));

        const before = manager.getActiveDataContextSnapshot();

        await vi.waitFor(() => {
            expect(manager.getSnapshot().systemSyncStates.alpha?.status).toBe('syncing');
        });

        const during = manager.getActiveDataContextSnapshot();
        syncDeferred.resolve(null);

        await vi.waitFor(() => {
            expect(manager.getSnapshot().systemSyncStates.alpha?.status).toBe('synced');
        });

        const after = manager.getActiveDataContextSnapshot();

        expect(before).toBe(dataContextRef);
        expect(during).toBe(dataContextRef);
        expect(after).toBe(dataContextRef);

        await manager.dispose();
    });

    it('T11: probeSyncedSystems uses existing adapter instance without reinitialize', async () => {
        DataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            ownsAdapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () => ({ close: vi.fn(), sync: vi.fn(async () => null) }) as unknown as DataContext,
            ),
        });

        adapterMock.getAllSyncStatuses.mockResolvedValueOnce([
            {
                fileKey: 'alpha:core',
                sha: 'sha',
                lastSynced: new Date('2026-01-01T00:00:00.000Z'),
            },
        ]);

        const manager = new DataContextManager();
        await manager.enableSystem(createSystem('alpha', ['alpha:']));

        adapterMock.initialize.mockClear();
        const result = await manager.probeSyncedSystems();

        expect(result).toEqual({ alpha: true });
        expect(adapterMock.initialize).not.toHaveBeenCalled();

        await manager.dispose();
    });
});
