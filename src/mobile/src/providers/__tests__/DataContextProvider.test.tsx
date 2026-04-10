/**
 * DataContextProvider tests (mobile).
 *
 * @requirements
 * - REQ-MOBILE-DCP-01: Provider renders children without crashing in idle state.
 * - REQ-MOBILE-DCP-02: useDataContext returns default context values in idle state.
 * - REQ-MOBILE-DCP-03: useDataContext throws outside DataContextProvider.
 * - REQ-MOBILE-DCP-04: enableSystem transitions idle -> initializing -> ready on success.
 * - REQ-MOBILE-DCP-05: enableSystem composes DI container with core + mobile modules.
 * - REQ-MOBILE-DCP-06: disableSystem closes DataContext and resets provider state.
 * - REQ-MOBILE-DCP-07: Provider unmount closes active DataContext via ref.
 * - REQ-MOBILE-DCP-08: Partial sync failures set error state.
 */

import * as React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataContext } from '@armoury/data-context';
import type { GameSystem } from '@armoury/data-dao';
import type { QueryClient } from '@tanstack/react-query';

import { DataContextProvider, useDataContext } from '../DataContextProvider.js';

const {
    createContainerWithModulesMock,
    dataContextBuilderMock,
    captureExceptionMock,
    queryClientToken,
    adapterFactoryToken,
    githubFactoryToken,
    wahapediaFactoryToken,
    databaseAdapterToken,
    githubClientToken,
    wahapediaClientToken,
    coreModuleMock,
    mobileModuleMock,
    queryClientMock,
} = vi.hoisted(() => {
    return {
        createContainerWithModulesMock: vi.fn(),
        dataContextBuilderMock: { builder: vi.fn() },
        captureExceptionMock: vi.fn(),
        queryClientToken: Symbol.for('QueryClient'),
        adapterFactoryToken: Symbol.for('AdapterFactory'),
        githubFactoryToken: Symbol.for('GitHubClientFactory'),
        wahapediaFactoryToken: Symbol.for('WahapediaClientFactory'),
        databaseAdapterToken: Symbol.for('DatabaseAdapter'),
        githubClientToken: Symbol.for('GitHubClient'),
        wahapediaClientToken: Symbol.for('WahapediaClient'),
        coreModuleMock: { name: 'core-module' },
        mobileModuleMock: { name: 'mobile-module' },
        queryClientMock: { id: 'mobile-query-client' } as unknown as QueryClient,
    };
});

vi.mock('@armoury/di', () => ({
    createContainerWithModules: createContainerWithModulesMock,
    coreModule: coreModuleMock,
    mobileModule: mobileModuleMock,
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

vi.mock('@armoury/data-context', () => ({
    DataContextBuilder: dataContextBuilderMock,
}));

vi.mock('@/lib/queryClient.js', () => ({
    queryClient: queryClientMock,
}));

vi.mock('@sentry/react-native', () => ({
    captureException: captureExceptionMock,
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

function Harness({ system, controls }: HarnessProps): React.ReactElement {
    const ctx = useDataContext();
    const gameSystem = system as unknown as GameSystem;

    React.useEffect(() => {
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

function OutsideHookConsumer(): React.ReactElement {
    useDataContext();

    return <div>outside</div>;
}

describe('DataContextProvider (mobile)', () => {
    const adapter = { initialize: vi.fn() };
    const githubClient = { name: 'github-client' };
    const wahapediaClient = { name: 'wahapedia-client' };
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
        dataContextBuilderMock.builder.mockReturnValue({
            system: vi.fn().mockReturnThis(),
            adapter: vi.fn().mockReturnThis(),
            register: vi.fn().mockReturnThis(),
            build: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        syncResult: {
                            success: true,
                            total: 2,
                            succeeded: ['dao-a', 'dao-b'],
                            failures: [],
                            timestamp: '2026-01-01T00:00:00.000Z',
                        },
                    }) as unknown as DataContext,
            ),
        });
    });

    it('renders children without crashing', () => {
        render(
            <DataContextProvider>
                <div>child-content</div>
            </DataContextProvider>,
        );

        expect(screen.getByText('child-content')).toBeTruthy();
    });

    it('returns default context value in idle state', () => {
        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e' }} />
            </DataContextProvider>,
        );

        expect(screen.getByText('Status: idle')).toBeTruthy();
        expect(screen.getByText('Error: none')).toBeTruthy();
        expect(screen.getByText('Sync: none')).toBeTruthy();
        expect(screen.getByText('HasDataContext: no')).toBeTruthy();
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
            expect(screen.getByText('Status: ready')).toBeTruthy();
        });

        expect(controls.statuses).toContain('idle');
        expect(controls.statuses).toContain('initializing');
        expect(controls.statuses).toContain('ready');
        expect(screen.getByText('Sync: synced')).toBeTruthy();
        expect(screen.getByText('HasDataContext: yes')).toBeTruthy();
    });

    it('creates DI container with core + mobile modules and resolves factories', async () => {
        const controls: HarnessControls = { statuses: [] };

        render(
            <DataContextProvider>
                <Harness controls={controls} system={{ id: 'wh40k10e', getContainerModule: () => systemModule }} />
            </DataContextProvider>,
        );

        screen.getByRole('button', { name: 'Enable' }).click();

        await waitFor(() => {
            expect(createContainerWithModulesMock).toHaveBeenCalledWith(coreModuleMock, mobileModuleMock);
        });

        expect(bindMock).toHaveBeenCalledWith(queryClientToken);
        expect(bindMock).toHaveBeenCalledWith(databaseAdapterToken);
        expect(bindMock).toHaveBeenCalledWith(githubClientToken);
        expect(bindMock).toHaveBeenCalledWith(wahapediaClientToken);
        expect(getMock).toHaveBeenCalledWith(adapterFactoryToken);
        expect(getMock).toHaveBeenCalledWith(githubFactoryToken);
        expect(getMock).toHaveBeenCalledWith(wahapediaFactoryToken);
        expect(createGitHubMock).toHaveBeenCalledWith(queryClientMock);
        expect(createWahapediaMock).toHaveBeenCalledWith(queryClientMock);
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
            expect(screen.getByText('Status: ready')).toBeTruthy();
        });

        screen.getByRole('button', { name: 'Disable' }).click();

        await waitFor(() => {
            expect(screen.getByText('Status: idle')).toBeTruthy();
        });

        expect(closeMock).toHaveBeenCalled();
        expect(screen.getByText('Sync: none')).toBeTruthy();
        expect(screen.getByText('HasDataContext: no')).toBeTruthy();
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
            expect(screen.getByText('Status: ready')).toBeTruthy();
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
            build: vi.fn(
                async () =>
                    ({
                        close: closeMock,
                        syncResult: partialFailure,
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
            expect(screen.getByText('Status: error')).toBeTruthy();
        });

        expect(screen.getByText('Sync: error')).toBeTruthy();
        expect(screen.getByText(/Partial sync failure: 1\/2 DAOs failed/)).toBeTruthy();
        expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    });
});
