/**
 * DataContextProvider tests (web).
 *
 * @requirements
 * - REQ-WEB-DCP-01: Provider renders children without crashing in idle state.
 * - REQ-WEB-DCP-02: useDataContext returns the default context values in idle state.
 * - REQ-WEB-DCP-03: useDataContext throws outside DataContextProvider.
 * - REQ-WEB-DCP-04: enableSystem transitions state idle -> initializing -> ready on success.
 * - REQ-WEB-DCP-05: enableSystem composes DI container with core + web modules.
 * - REQ-WEB-DCP-06: disableSystem closes DataContext and resets provider state.
 * - REQ-WEB-DCP-07: Provider unmount closes active DataContext.
 * - REQ-WEB-DCP-08: Partial sync failures set error state.
 */

import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
}

interface HarnessProps {
    readonly system: {
        id: string;
        getContainerModule?: () => unknown;
    };
    readonly controls: HarnessControls;
}

function Harness({ system, controls }: HarnessProps): ReactElement {
    const ctx = useDataContext();
    const gameSystem = system as unknown as GameSystem;

    useEffect(() => {
        controls.statuses.push(ctx.status);
    }, [ctx.status, controls.statuses]);

    return (
        <div>
            <div>Status: {ctx.status}</div>
            <div>Error: {ctx.error ?? 'none'}</div>
            <div>Sync: {ctx.systemSyncStates[gameSystem.id]?.status ?? 'none'}</div>
            <div>HasDataContext: {ctx.dataContext ? 'yes' : 'no'}</div>
            <button type="button" onClick={() => void ctx.enableSystem(gameSystem)}>
                Enable
            </button>
            <button type="button" onClick={() => void ctx.disableSystem(gameSystem.id)}>
                Disable
            </button>
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
                        sync: vi.fn(async () => ({
                            success: true,
                            total: 2,
                            succeeded: ['dao-a', 'dao-b'],
                            failures: [],
                            timestamp: '2026-01-01T00:00:00.000Z',
                        })),
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
        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e' }} />
            </DataContextProvider>,
        );

        expect(screen.getByText('Status: idle')).toBeInTheDocument();
        expect(screen.getByText('Error: none')).toBeInTheDocument();
        expect(screen.getByText('Sync: none')).toBeInTheDocument();
        expect(screen.getByText('HasDataContext: no')).toBeInTheDocument();
    });

    it('throws when useDataContext is used outside provider', () => {
        expect(() => render(<OutsideHookConsumer />)).toThrow(
            'useDataContext must be used within a DataContextProvider',
        );
    });

    it('transitions idle -> initializing -> ready when enableSystem succeeds', async () => {
        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e', getContainerModule: () => systemModule }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable' }).click();

        await waitFor(() => {
            expect(screen.getByText('Status: ready')).toBeInTheDocument();
        });

        expect(controls.statuses).toContain('idle');
        expect(controls.statuses).toContain('initializing');
        expect(controls.statuses).toContain('ready');
        expect(screen.getByText('Sync: synced')).toBeInTheDocument();
        expect(screen.getByText('HasDataContext: yes')).toBeInTheDocument();
    });

    it('creates DI container with core + web modules and resolves factories', async () => {
        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e', getContainerModule: () => systemModule }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable' }).click();

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
        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e' }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable' }).click();

        await waitFor(() => {
            expect(screen.getByText('Status: ready')).toBeInTheDocument();
        });

        screen.getByRole('button', { name: 'Disable' }).click();

        await waitFor(() => {
            expect(screen.getByText('Status: idle')).toBeInTheDocument();
        });

        expect(closeMock).toHaveBeenCalled();
        expect(screen.getByText('Sync: none')).toBeInTheDocument();
        expect(screen.getByText('HasDataContext: no')).toBeInTheDocument();
    });

    it('closes DataContext on unmount', async () => {
        const controls: HarnessControls = { statuses: [] };
        const rendered = render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e' }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable' }).click();

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

        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e' }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable' }).click();

        await waitFor(() => {
            expect(screen.getByText('Status: error')).toBeInTheDocument();
        });

        expect(screen.getByText('Sync: error')).toBeInTheDocument();
        expect(screen.getByText(/Partial sync failure: 1\/2 DAOs failed/)).toBeInTheDocument();
        expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    });

    it('disableSystem is a no-op when already idle', async () => {
        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e' }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Disable' }).click();

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

        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e', getContainerModule: () => systemModule }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable' }).click();

        await waitFor(() => {
            expect(screen.getByText('Status: error')).toBeInTheDocument();
        });
    });

    it('probeSyncedSystems handles adapter initialization failure gracefully', async () => {
        pgliteAdapterMock.initialize.mockRejectedValueOnce(new Error('Init failed'));

        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e' }} />
            </DataContextProvider>,
        );

        await waitFor(() => {
            expect(pgliteAdapterMock.initialize).toHaveBeenCalled();
        });

        expect(screen.getByText('Status: idle')).toBeInTheDocument();
        expect(screen.getByText('Sync: none')).toBeInTheDocument();
    });

    it('concurrent enableSystem calls for different systems are handled', async () => {
        dataContextBuilderMock.builder.mockImplementation(() => ({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            buildFromCache: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        sync: vi.fn(async () => ({
                            success: true,
                            total: 2,
                            succeeded: ['dao-a', 'dao-b'],
                            failures: [],
                            timestamp: '2026-01-01T00:00:00.000Z',
                        })),
                    }) as unknown as DataContext,
            ),
        }));

        function MultiSystemHarness(): ReactElement {
            const ctx = useDataContext();
            const systemA = {
                id: 'wh40k10e',
                getContainerModule: () => systemModule,
                register: vi.fn().mockResolvedValue(undefined),
                createGameContext: vi.fn().mockReturnValue({
                    armies: {},
                    campaigns: {},
                    game: {},
                    sync: vi.fn().mockResolvedValue({ success: true, total: 0, succeeded: [], failures: [] }),
                }),
            } as unknown as GameSystem;
            const systemB = {
                id: 'system-b',
                getContainerModule: () => systemModule,
                register: vi.fn().mockResolvedValue(undefined),
                createGameContext: vi.fn().mockReturnValue({
                    armies: {},
                    campaigns: {},
                    game: {},
                    sync: vi.fn().mockResolvedValue({ success: true, total: 0, succeeded: [], failures: [] }),
                }),
            } as unknown as GameSystem;

            return (
                <div>
                    <div>Status: {ctx.status}</div>
                    <button type="button" onClick={() => void ctx.enableSystem(systemA)}>
                        Enable A
                    </button>
                    <button type="button" onClick={() => void ctx.enableSystem(systemB)}>
                        Enable B
                    </button>
                </div>
            );
        }

        render(
            <DataContextProvider>
                <MultiSystemHarness />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable A' }).click();
        screen.getByRole('button', { name: 'Enable B' }).click();

        await waitFor(() => {
            expect(screen.getByText('Status: ready')).toBeInTheDocument();
        });
    });

    describe('probeSyncedSystems persistence probe', () => {
        it('restores sync state for systems with matching file keys on mount', async () => {
            pgliteAdapterMock.getAllSyncStatuses.mockResolvedValueOnce([
                {
                    fileKey: 'core:wh40k-10e.gst',
                    sha: 'abc',
                    lastSynced: new Date('2026-01-01T00:00:00.000Z'),
                },
            ]);
            resolveGameSystemMock.mockResolvedValueOnce({
                getSyncFileKeyPrefixes: () => ['core:', 'factionModel:', 'crusadeRules:', 'wahapedia:'],
            });

            const controls: HarnessControls = { statuses: [] };

            render(
                <DataContextProvider>
                    <Harness controls={controls} system={{ id: 'wh40k10e' }} />
                </DataContextProvider>,
            );

            await waitFor(() => {
                expect(screen.getByText('Sync: synced')).toBeInTheDocument();
            });
        });

        it('does not restore sync state when no synced data exists', async () => {
            pgliteAdapterMock.getAllSyncStatuses.mockResolvedValueOnce([]);

            const controls: HarnessControls = { statuses: [] };

            render(
                <DataContextProvider>
                    <Harness controls={controls} system={{ id: 'wh40k10e' }} />
                </DataContextProvider>,
            );

            await waitFor(() => {
                expect(pgliteAdapterMock.getAllSyncStatuses).toHaveBeenCalledTimes(1);
            });

            expect(screen.getByText('Sync: none')).toBeInTheDocument();
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

            const controls: HarnessControls = { statuses: [] };
            const rendered = render(
                <DataContextProvider>
                    <Harness controls={controls} system={{ id: 'wh40k10e' }} />
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
});
