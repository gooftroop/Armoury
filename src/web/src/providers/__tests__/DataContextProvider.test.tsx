/**
 * DataContextProvider tests (web).
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-DCP-01 | Provider renders children without crashing in idle state. | "renders children without crashing" |
 * | REQ-WEB-DCP-02 | useDataContext returns default context values in idle state. | "returns default context value in idle state" |
 * | REQ-WEB-DCP-03 | useDataContext throws outside DataContextProvider. | "throws when useDataContext is used outside provider" |
 * | REQ-WEB-DCP-04 | enableSystem transitions DataContext status idle -> initializing -> ready and system sync syncing -> synced. | "transitions idle -> initializing -> ready and syncing -> synced when enableSystem succeeds" |
 * | REQ-WEB-DCP-05 | enableSystem composes DI container with core + web modules. | "creates DI container with core + web modules and resolves factories" |
 * | REQ-WEB-DCP-06 | disableSystem closes DataContext and resets provider state. | "disableSystem closes DataContext and resets state" |
 * | REQ-WEB-DCP-07 | Provider unmount closes active DataContext. | "closes DataContext on unmount" |
 * | REQ-WEB-DCP-08 | Partial sync failures set error state. | "sets error state when sync result is partial failure" |
 * | REQ-WEB-DCP-09 | Probe restores discovered systems to pending status first (not synced). | "restores pending state for systems with matching file keys on mount" |
 * | REQ-WEB-DCP-10 | Queue processes systems sequentially (one checking-staleness at a time). | "processes staleness checks sequentially for multiple systems" |
 * | REQ-WEB-DCP-11 | Sync failures retry up to two times before success or error. | "retries sync up to two times before succeeding" |
 * | REQ-WEB-DCP-12 | Exhausted retries set error + hasCache=true when cache exists. | "sets error with hasCache true after retries exhausted for cached system" |
 * | REQ-WEB-DCP-13 | Exhausted retries set error + hasCache=false when cache is absent. | "sets error with hasCache false after retries exhausted for non-cached system" |
 * | REQ-WEB-DCP-14 | checking-staleness status is observable while sync is in flight. | "exposes checking-staleness while sync is in progress" |
 */

import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataContext } from '@armoury/data-context';
import type { GameSystem } from '@armoury/data-dao';
import type { QueryClient } from '@tanstack/react-query';

import { DataContextProvider, useDataContext } from '../DataContextProvider.js';

const {
    createContainerWithModulesMock,
    dataContextBuilderMock,
    getQueryClientMock,
    captureExceptionMock,
    pgliteAdapterMock,
    PGliteAdapterConstructorMock,
    resolveGameSystemMock,
    getKnownSystemIdsMock,
    queryClientToken,
    adapterFactoryToken,
    githubFactoryToken,
    wahapediaFactoryToken,
    databaseAdapterToken,
    githubClientToken,
    wahapediaClientToken,
    coreModuleMock,
    webModuleMock,
} = vi.hoisted(() => {
    return {
        createContainerWithModulesMock: vi.fn(),
        dataContextBuilderMock: { builder: vi.fn() },
        getQueryClientMock: vi.fn(),
        captureExceptionMock: vi.fn(),
        pgliteAdapterMock: {
            initialize: vi.fn().mockResolvedValue(undefined),
            getAllSyncStatuses: vi.fn().mockResolvedValue([]),
            close: vi.fn().mockResolvedValue(undefined),
        },
        PGliteAdapterConstructorMock: vi.fn(),
        resolveGameSystemMock: vi.fn(),
        getKnownSystemIdsMock: vi.fn().mockReturnValue(['wh40k10e']),
        queryClientToken: Symbol.for('QueryClient'),
        adapterFactoryToken: Symbol.for('AdapterFactory'),
        githubFactoryToken: Symbol.for('GitHubClientFactory'),
        wahapediaFactoryToken: Symbol.for('WahapediaClientFactory'),
        databaseAdapterToken: Symbol.for('DatabaseAdapter'),
        githubClientToken: Symbol.for('GitHubClient'),
        wahapediaClientToken: Symbol.for('WahapediaClient'),
        coreModuleMock: { name: 'core-module' },
        webModuleMock: { name: 'web-module' },
    };
});

vi.mock('@armoury/di', () => ({
    createContainerWithModules: createContainerWithModulesMock,
    coreModule: coreModuleMock,
    TOKENS: {
        QueryClient: queryClientToken,
        AdapterFactory: adapterFactoryToken,
        GitHubClientFactory: githubFactoryToken,
        WahapediaClientFactory: wahapediaFactoryToken,
        DatabaseAdapter: databaseAdapterToken,
        GitHubClient: githubClientToken,
        WahapediaClient: wahapediaClientToken,
    },
}));

vi.mock('@armoury/di/web', () => ({
    webModule: webModuleMock,
}));

vi.mock('@armoury/data-context', () => ({
    DataContextBuilder: dataContextBuilderMock,
}));

vi.mock('@/lib/getQueryClient.js', () => ({
    getQueryClient: getQueryClientMock,
}));

vi.mock('@sentry/nextjs', () => ({
    captureException: captureExceptionMock,
}));

vi.mock('@armoury/adapters-pglite', () => ({
    PGliteAdapter: PGliteAdapterConstructorMock,
}));

vi.mock('@/lib/resolveGameSystem.js', () => ({
    resolveGameSystem: resolveGameSystemMock,
    getKnownSystemIds: getKnownSystemIdsMock,
}));

interface HarnessControls {
    readonly statuses: string[];
    readonly syncStatusHistory: Record<string, string[]>;
}

interface HarnessProps {
    readonly systems: ReadonlyArray<{
        id: string;
        getContainerModule?: () => unknown;
    }>;
    readonly controls: HarnessControls;
}

function Harness({ systems, controls }: HarnessProps): ReactElement {
    const ctx = useDataContext();

    useEffect(() => {
        controls.statuses.push(ctx.status);
    }, [ctx.status, controls.statuses]);

    useEffect(() => {
        for (const system of systems) {
            const currentStatus = ctx.systemSyncStates[system.id]?.status ?? 'none';

            if (!controls.syncStatusHistory[system.id]) {
                controls.syncStatusHistory[system.id] = [];
            }

            controls.syncStatusHistory[system.id].push(currentStatus);
        }
    }, [controls.syncStatusHistory, systems, ctx.systemSyncStates]);

    return (
        <div>
            <div>Status: {ctx.status}</div>
            <div>Error: {ctx.error ?? 'none'}</div>
            <div>HasDataContext: {ctx.dataContext ? 'yes' : 'no'}</div>

            {systems.map((system) => {
                const gameSystem = system as unknown as GameSystem;
                const state = ctx.systemSyncStates[system.id];

                return (
                    <div key={system.id}>
                        <div>
                            Sync {system.id}: {state?.status ?? 'none'}
                        </div>
                        <div>
                            SyncError {system.id}: {state?.error ?? 'none'}
                        </div>
                        <div>
                            SyncHasCache {system.id}:{' '}
                            {(state as { hasCache?: boolean } | undefined)?.hasCache === undefined
                                ? 'none'
                                : String((state as { hasCache?: boolean }).hasCache)}
                        </div>
                        <button type="button" onClick={() => void ctx.enableSystem(gameSystem)}>
                            Enable {system.id}
                        </button>
                        <button type="button" onClick={() => void ctx.disableSystem(system.id)}>
                            Disable {system.id}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function OutsideHookConsumer(): ReactElement {
    useDataContext();

    return <div>outside</div>;
}

describe('DataContextProvider (web)', () => {
    const adapter = { rawQuery: vi.fn(), initialize: vi.fn(), close: vi.fn().mockResolvedValue(undefined) };
    const githubClient = { name: 'github-client' };
    const wahapediaClient = { name: 'wahapedia-client' };
    const queryClient = { id: 'query-client' } as unknown as QueryClient;
    const systemModule = { name: 'system-module' };
    const closeMock = vi.fn(async () => {});
    const createAdapterMock = vi.fn(async () => adapter);
    const createGitHubMock = vi.fn(async () => githubClient);
    const createWahapediaMock = vi.fn(async () => wahapediaClient);
    const bindMock = vi.fn(() => ({ toConstantValue: vi.fn() }));
    const getMock = vi.fn((token: symbol) => {
        if (token === adapterFactoryToken) {
            return createAdapterMock;
        }

        if (token === githubFactoryToken) {
            return createGitHubMock;
        }

        if (token === wahapediaFactoryToken) {
            return createWahapediaMock;
        }

        return undefined;
    });
    const loadMock = vi.fn();

    const container = {
        bind: bindMock,
        get: getMock,
        load: loadMock,
    };
    const successSyncResult = {
        success: true,
        total: 2,
        succeeded: ['dao-a', 'dao-b'],
        failures: [],
        timestamp: '2026-01-01T00:00:00.000Z',
    };

    function createDeferred<T>(): {
        promise: Promise<T>;
        resolve: (value: T) => void;
        reject: (reason?: unknown) => void;
    } {
        let resolve: (value: T) => void = () => undefined;
        let reject: (reason?: unknown) => void = () => undefined;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        return { promise, resolve, reject };
    }

    beforeEach(() => {
        vi.clearAllMocks();

        closeMock.mockResolvedValue(undefined);
        createAdapterMock.mockResolvedValue(adapter);
        createGitHubMock.mockResolvedValue(githubClient);
        createWahapediaMock.mockResolvedValue(wahapediaClient);
        createContainerWithModulesMock.mockReturnValue(container);
        getQueryClientMock.mockReturnValue(queryClient);
        dataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        sync: vi.fn(async () => successSyncResult),
                    }) as unknown as DataContext,
            ),
        });
        PGliteAdapterConstructorMock.mockImplementation(function PGliteAdapterMockImpl() {
            return pgliteAdapterMock;
        });
        pgliteAdapterMock.initialize.mockResolvedValue(undefined);
        pgliteAdapterMock.getAllSyncStatuses.mockResolvedValue([]);
        pgliteAdapterMock.close.mockResolvedValue(undefined);
        getKnownSystemIdsMock.mockReturnValue(['wh40k10e']);
        resolveGameSystemMock.mockResolvedValue(null);
    });

    it('renders children without crashing', () => {
        render(
            <DataContextProvider>
                <div>child-content</div>
            </DataContextProvider>,
        );

        expect(screen.getByText('child-content')).toBeInTheDocument();
    });

    it('returns default context value in idle state', () => {
        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        expect(screen.getByText('Status: idle')).toBeInTheDocument();
        expect(screen.getByText('Error: none')).toBeInTheDocument();
        expect(screen.getByText('Sync wh40k10e: none')).toBeInTheDocument();
        expect(screen.getByText('HasDataContext: no')).toBeInTheDocument();
    });

    it('throws when useDataContext is used outside provider', () => {
        expect(() => render(<OutsideHookConsumer />)).toThrow(
            'useDataContext must be used within a DataContextProvider',
        );
    });

    it('transitions idle -> initializing -> ready and syncing -> synced when enableSystem succeeds', async () => {
        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e', getContainerModule: () => systemModule }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Status: ready')).toBeInTheDocument();
        });

        expect(controls.statuses).toContain('idle');
        expect(controls.statuses).toContain('initializing');
        expect(controls.statuses).toContain('ready');
        expect(controls.syncStatusHistory.wh40k10e).toContain('syncing');
        expect(controls.syncStatusHistory.wh40k10e).toContain('synced');
        expect(screen.getByText('Sync wh40k10e: synced')).toBeInTheDocument();
        expect(screen.getByText('HasDataContext: yes')).toBeInTheDocument();
    });

    it('creates DI container with core + web modules and resolves factories', async () => {
        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e', getContainerModule: () => systemModule }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(createContainerWithModulesMock).toHaveBeenCalledWith(coreModuleMock, webModuleMock);
        });

        expect(bindMock).toHaveBeenCalledWith(queryClientToken);
        expect(bindMock).toHaveBeenCalledWith(databaseAdapterToken);
        expect(bindMock).toHaveBeenCalledWith(githubClientToken);
        expect(bindMock).toHaveBeenCalledWith(wahapediaClientToken);
        expect(getMock).toHaveBeenCalledWith(adapterFactoryToken);
        expect(getMock).toHaveBeenCalledWith(githubFactoryToken);
        expect(getMock).toHaveBeenCalledWith(wahapediaFactoryToken);
        expect(createGitHubMock).toHaveBeenCalledWith(queryClient);
        expect(createWahapediaMock).toHaveBeenCalledWith(queryClient);
        expect(loadMock).toHaveBeenCalledWith(systemModule);
    });

    it('disableSystem closes DataContext and resets state', async () => {
        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Status: ready')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Disable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Status: idle')).toBeInTheDocument();
        });

        expect(closeMock).toHaveBeenCalled();
        expect(screen.getByText('Sync wh40k10e: none')).toBeInTheDocument();
        expect(screen.getByText('HasDataContext: no')).toBeInTheDocument();
    });

    it('closes DataContext on unmount', async () => {
        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };
        const rendered = render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Status: ready')).toBeInTheDocument();
        });

        rendered.unmount();

        await waitFor(() => {
            expect(closeMock).toHaveBeenCalled();
        });
    });

    it('sets error state when sync result is partial failure', async () => {
        const partialFailure = {
            success: false,
            total: 2,
            succeeded: ['dao-a'],
            failures: [{ dao: 'dao-b', error: 'network failure' }],
            timestamp: '2026-01-01T00:00:00.000Z',
        };

        dataContextBuilderMock.builder.mockReturnValueOnce({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        sync: vi.fn(async () => partialFailure),
                    }) as unknown as DataContext,
            ),
        });

        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Status: error')).toBeInTheDocument();
        });

        expect(screen.getByText('Sync wh40k10e: error')).toBeInTheDocument();
        expect(screen.getByText(/SyncError wh40k10e: Partial sync failure: 1\/2 DAOs failed/)).toBeInTheDocument();
        expect(captureExceptionMock).toHaveBeenCalled();
    });

    it('disableSystem is a no-op when already idle', async () => {
        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Disable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Status: idle')).toBeInTheDocument();
        });

        expect(screen.getByText('Error: none')).toBeInTheDocument();
        expect(closeMock).not.toHaveBeenCalled();
    });

    it('enableSystem sets error state when container creation fails', async () => {
        createContainerWithModulesMock.mockImplementationOnce(() => {
            throw new Error('Container creation failed');
        });

        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e', getContainerModule: () => systemModule }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Status: error')).toBeInTheDocument();
        });
    });

    it('probeSyncedSystems handles adapter initialization failure gracefully', async () => {
        pgliteAdapterMock.initialize.mockRejectedValueOnce(new Error('Init failed'));

        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        await waitFor(() => {
            expect(pgliteAdapterMock.initialize).toHaveBeenCalled();
        });

        expect(screen.getByText('Status: idle')).toBeInTheDocument();
        expect(screen.getByText('Sync wh40k10e: none')).toBeInTheDocument();
    });
    describe('probeSyncedSystems persistence probe', () => {
        it('restores pending state for systems with matching file keys on mount', async () => {
            pgliteAdapterMock.getAllSyncStatuses.mockResolvedValueOnce([
                {
                    fileKey: 'core:wh40k-10e.gst',
                    sha: 'abc',
                    lastSynced: new Date('2026-01-01T00:00:00.000Z'),
                },
            ]);
            const resolvedSystem = {
                id: 'wh40k10e',
                getContainerModule: () => systemModule,
                getSyncFileKeyPrefixes: () => ['core:', 'factionModel:', 'crusadeRules:', 'wahapedia:'],
            };
            resolveGameSystemMock.mockResolvedValueOnce(resolvedSystem).mockResolvedValueOnce(null);

            const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

            render(
                <DataContextProvider>
                    <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
                </DataContextProvider>,
            );

            await waitFor(() => {
                expect(controls.syncStatusHistory.wh40k10e).toContain('pending');
            });
        });

        it('does not restore sync state when no synced data exists', async () => {
            pgliteAdapterMock.getAllSyncStatuses.mockResolvedValueOnce([]);

            const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

            render(
                <DataContextProvider>
                    <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
                </DataContextProvider>,
            );

            await waitFor(() => {
                expect(pgliteAdapterMock.getAllSyncStatuses).toHaveBeenCalledTimes(1);
            });

            expect(screen.getByText('Sync wh40k10e: none')).toBeInTheDocument();
        });

        it('aborts probe on unmount', async () => {
            const deferredStatuses: {
                resolve: (statuses: Array<{ fileKey: string; sha: string; lastSynced: Date }>) => void;
            } = {
                resolve: () => undefined,
            };
            const pendingStatuses = new Promise<Array<{ fileKey: string; sha: string; lastSynced: Date }>>(
                (resolve) => {
                    deferredStatuses.resolve = resolve;
                },
            );
            pgliteAdapterMock.getAllSyncStatuses.mockReturnValueOnce(pendingStatuses);

            const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };
            const rendered = render(
                <DataContextProvider>
                    <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
                </DataContextProvider>,
            );

            rendered.unmount();
            deferredStatuses.resolve([
                {
                    fileKey: 'core:wh40k-10e.gst',
                    sha: 'abc',
                    lastSynced: new Date('2026-01-01T00:00:00.000Z'),
                },
            ]);

            await waitFor(() => {
                expect(pgliteAdapterMock.close).toHaveBeenCalledTimes(1);
            });

            expect(resolveGameSystemMock).not.toHaveBeenCalled();
        });
    });

    it('processes staleness checks sequentially for multiple systems', async () => {
        const syncStarts: string[] = [];
        const syncA = createDeferred<typeof successSyncResult>();
        const syncB = createDeferred<typeof successSyncResult>();

        dataContextBuilderMock.builder.mockImplementation(() => {
            let activeSystemId = 'unknown';
            const chain = {
                system: vi.fn((system: { id: string }) => {
                    activeSystemId = system.id;

                    return chain;
                }),
                adapter: vi.fn(() => chain),
                register: vi.fn(() => chain),
                buildFromCache: vi.fn(
                    async () =>
                        ({
                            close: closeMock,
                            sync: vi.fn(async () => {
                                syncStarts.push(activeSystemId);

                                if (activeSystemId === 'wh40k10e') {
                                    return syncA.promise;
                                }

                                return syncB.promise;
                            }),
                        }) as unknown as DataContext,
                ),
            };

            return chain;
        });

        const controls: HarnessControls = {
            statuses: [],
            syncStatusHistory: {},
        };

        render(
            <DataContextProvider>
                <Harness
                    controls={controls}
                    systems={[
                        {
                            id: 'wh40k10e',
                            getContainerModule: () => systemModule,
                            register: vi.fn().mockResolvedValue(undefined),
                            createGameContext: vi.fn().mockReturnValue({
                                armies: {},
                                campaigns: {},
                                game: {},
                                sync: vi.fn().mockResolvedValue({
                                    success: true,
                                    total: 0,
                                    succeeded: [],
                                    failures: [],
                                }),
                            }),
                        } as unknown as { id: string; getContainerModule?: () => unknown },
                        {
                            id: 'system-b',
                            getContainerModule: () => systemModule,
                            register: vi.fn().mockResolvedValue(undefined),
                            createGameContext: vi.fn().mockReturnValue({
                                armies: {},
                                campaigns: {},
                                game: {},
                                sync: vi.fn().mockResolvedValue({
                                    success: true,
                                    total: 0,
                                    succeeded: [],
                                    failures: [],
                                }),
                            }),
                        } as unknown as { id: string; getContainerModule?: () => unknown },
                    ]}
                />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));
        fireEvent.click(screen.getByRole('button', { name: 'Enable system-b' }));

        await waitFor(() => {
            expect(screen.getByText('Sync wh40k10e: checking-staleness')).toBeInTheDocument();
        });

        expect(syncStarts).toEqual(['wh40k10e']);
        expect(screen.getByText('Sync system-b: syncing')).toBeInTheDocument();

        syncA.resolve(successSyncResult);

        syncB.resolve(successSyncResult);

        await waitFor(() => {
            expect(screen.getByText('Sync wh40k10e: synced')).toBeInTheDocument();
            expect(screen.getByText('Sync system-b: synced')).toBeInTheDocument();
        });
    });

    it('retries sync up to two times before succeeding', async () => {
        const syncMock = vi
            .fn()
            .mockRejectedValueOnce(new Error('network-1'))
            .mockRejectedValueOnce(new Error('network-2'))
            .mockResolvedValue(successSyncResult);

        dataContextBuilderMock.builder.mockReturnValueOnce({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        sync: syncMock,
                    }) as unknown as DataContext,
            ),
        });

        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Sync wh40k10e: synced')).toBeInTheDocument();
        });

        expect(syncMock).toHaveBeenCalledTimes(3);
    });

    it('sets error with hasCache true after retries exhausted for cached system', async () => {
        pgliteAdapterMock.getAllSyncStatuses.mockResolvedValueOnce([
            {
                fileKey: 'core:wh40k-10e.gst',
                sha: 'abc',
                lastSynced: new Date('2026-01-01T00:00:00.000Z'),
            },
        ]);
        resolveGameSystemMock.mockResolvedValue({
            id: 'wh40k10e',
            getSyncFileKeyPrefixes: () => ['core:'],
            getContainerModule: () => systemModule,
        });

        dataContextBuilderMock.builder.mockReturnValueOnce({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        sync: vi.fn(async () => {
                            throw new Error('offline');
                        }),
                    }) as unknown as DataContext,
            ),
        });

        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText('Sync wh40k10e: error')).toBeInTheDocument();
        });

        expect(screen.getByText('SyncHasCache wh40k10e: true')).toBeInTheDocument();
    });

    it('sets error with hasCache false after retries exhausted for non-cached system', async () => {
        dataContextBuilderMock.builder.mockReturnValueOnce({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        sync: vi.fn(async () => {
                            throw new Error('offline');
                        }),
                    }) as unknown as DataContext,
            ),
        });

        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Sync wh40k10e: error')).toBeInTheDocument();
        });

        expect(screen.getByText('SyncHasCache wh40k10e: false')).toBeInTheDocument();
    });

    it('exposes checking-staleness while sync is in progress', async () => {
        const deferredSync = createDeferred<typeof successSyncResult>();

        dataContextBuilderMock.builder.mockReturnValueOnce({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        sync: vi.fn(async () => deferredSync.promise),
                    }) as unknown as DataContext,
            ),
        });

        const controls: HarnessControls = { statuses: [], syncStatusHistory: {} };

        render(
            <DataContextProvider>
                <Harness controls={controls} systems={[{ id: 'wh40k10e' }]} />
            </DataContextProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Enable wh40k10e' }));

        await waitFor(() => {
            expect(screen.getByText('Sync wh40k10e: checking-staleness')).toBeInTheDocument();
        });

        deferredSync.resolve(successSyncResult);

        await waitFor(() => {
            expect(screen.getByText('Sync wh40k10e: synced')).toBeInTheDocument();
        });
    });
});
