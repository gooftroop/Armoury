/**
 * DataContext Provider for the mobile application.
 *
 * Manages the lifecycle of DataContext instances for game systems on the mobile platform.
 * Creates DataContext using SQLite (via expo-sqlite), tracks sync state per system,
 * and exposes the context tree to the application.
 *
 * The provider does NOT block rendering — it initializes in the background and
 * surfaces sync state so consumers (e.g. game system tiles) can show loading indicators.
 *
 * @requirements
 * 1. Must create DataContext using SQLite platform (expo-sqlite).
 * 2. Must track initialization state: idle | initializing | ready | error.
 * 3. Must track per-system sync state: idle | syncing | synced | error.
 * 4. Must expose enableSystem / disableSystem actions for user-driven system activation.
 * 5. Must call dataContext.close() on unmount to release database connections.
 * 6. Must not block rendering — no full-screen loader.
 * 7. Must provide the DataContext instance and sync state via React context.
 *
 * @module data-context-provider
 */

import * as React from 'react';
import * as Sentry from '@sentry/react-native';
import { createContainerWithModules, coreModule, TOKENS } from '@armoury/di';
import { mobileModule } from '@armoury/di/mobile';
import type { AdapterFactoryFn, ClientFactoryFn } from '@armoury/di';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';
import type { DataContext } from '@armoury/data-context';
import { SyncProgressCollector } from '@armoury/data-dao';
import type { GameSystem } from '@armoury/data-dao';
import type { QueryClient } from '@tanstack/react-query';
import type { ContainerModule } from 'inversify';

/**
 * Possible states for the overall DataContext initialization lifecycle.
 *
 * - `idle`: Provider mounted but initialization not yet started.
 * - `initializing`: DataContext is being built (adapter creation, schema registration).
 * - `ready`: DataContext is fully initialized and available.
 * - `error`: Initialization failed.
 */
export type DataContextStatus = 'idle' | 'initializing' | 'ready' | 'error';

/**
 * Possible states for a single game system's data sync lifecycle.
 *
 * - `idle`: System registered but sync not started.
 * - `syncing`: System data is being downloaded/synced from BSData.
 * - `synced`: Sync completed successfully, data is available locally.
 * - `error`: Sync failed (will retry on next access).
 */
export type SystemSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

/**
 * Per-system sync state tracked by the provider.
 */
export interface SystemSyncState {
    /** Current sync status for this system. */
    status: SystemSyncStatus;
    /** Error message if status is 'error'. */
    error?: string;
}

/**
 * Shape of the DataContext React context value.
 */
export interface DataContextValue {
    /** The underlying DataContext instance, or null if not yet initialized. */
    dataContext: DataContext | null;
    /** Overall initialization status. */
    status: DataContextStatus;
    /** Error message if status is 'error'. */
    error?: string;
    /** Per-system sync state keyed by system ID. */
    systemSyncStates: Record<string, SystemSyncState>;
    /** Progress collector for the active sync operation, or null when idle. */
    syncProgressCollector: SyncProgressCollector | null;
    /**
     * Enables a game system: builds the DataContext for that system and starts sync.
     * @param system - The GameSystem to enable.
     */
    enableSystem: (system: GameSystem) => Promise<void>;
    /**
     * Disables a game system: closes the DataContext and clears sync state.
     * @param systemId - The ID of the system to disable.
     */
    disableSystem: (systemId: string) => Promise<void>;
}

/**
 * React context for accessing the DataContext and sync state.
 */
const DataContextReactContext = React.createContext<DataContextValue | undefined>(undefined);

/**
 * Props for the DataContextProvider component.
 */
export interface DataContextProviderProps {
    /** Child components that can access the DataContext via useDataContext(). */
    children: React.ReactNode;
}

/**
 * DataContextProvider component for the mobile app.
 *
 * Wraps the application to provide DataContext lifecycle management.
 * Initializes lazily when a system is enabled (user taps a game system tile).
 * Uses SQLite via expo-sqlite as the storage backend.
 * Does not block rendering.
 *
 * @param props - Component props.
 * @returns The provider-wrapped React tree.
 */
export function DataContextProvider({ children }: DataContextProviderProps): React.ReactElement {
    const [dataContext, setDataContext] = React.useState<DataContext | null>(null);
    const [status, setStatus] = React.useState<DataContextStatus>('idle');
    const [error, setError] = React.useState<string | undefined>();
    const [systemSyncStates, setSystemSyncStates] = React.useState<Record<string, SystemSyncState>>({});
    const [syncProgressCollector, setSyncProgressCollector] = React.useState<SyncProgressCollector | null>(null);

    /**
     * Ref to track the active DataContext instance for cleanup.
     * Prevents stale closure issues during concurrent enable/disable operations.
     */
    const dataContextRef = React.useRef<DataContext | null>(null);

    /**
     * Enables a game system by building a DataContext and syncing its data.
     *
     * @param system - The GameSystem descriptor to enable.
     */
    const enableSystem = React.useCallback(async (system: GameSystem): Promise<void> => {
        setSystemSyncStates((prev) => ({
            ...prev,
            [system.id]: { status: 'syncing' },
        }));
        setStatus('initializing');
        setError(undefined);

        try {
            /**
             * Dynamic import to avoid bundling the full DataContext builder in the initial JS bundle.
             * The builder pulls in drizzle-orm and adapter code which are heavy.
             */
            const { DataContextBuilder } = await import('@armoury/data-context');
            const { queryClient } = await import('@/lib/queryClient.js');
            const container = createContainerWithModules(coreModule, mobileModule);

            container.bind(TOKENS.QueryClient).toConstantValue(queryClient);

            const createAdapter = container.get<AdapterFactoryFn>(TOKENS.AdapterFactory);
            const adapter = await createAdapter();
            const createGitHub = container.get<ClientFactoryFn<IGitHubClient, QueryClient>>(TOKENS.GitHubClientFactory);
            const githubClient = await createGitHub(queryClient);
            const createWahapedia = container.get<ClientFactoryFn<IWahapediaClient, QueryClient>>(
                TOKENS.WahapediaClientFactory,
            );
            const wahapediaAdapter = await createWahapedia(queryClient);
            const systemWithContainerModule = system as GameSystem & {
                getContainerModule?: () => unknown;
            };
            const systemModule = systemWithContainerModule.getContainerModule?.();

            if (systemModule) {
                container.load(systemModule as ContainerModule);
            }

            container.bind(TOKENS.DatabaseAdapter).toConstantValue(adapter);
            container.bind(TOKENS.GitHubClient).toConstantValue(githubClient);
            container.bind(TOKENS.WahapediaClient).toConstantValue(wahapediaAdapter);

            const collector = new SyncProgressCollector(40);
            setSyncProgressCollector(collector);

            const dc = await DataContextBuilder.builder()
                .system(system)
                .adapter(adapter)
                .register('github', githubClient)
                .register('wahapedia', wahapediaAdapter)
                .register('syncProgress', collector)
                .build();

            const syncResult = dc.syncResult;

            if (syncResult && syncResult.failures.length > 0) {
                for (const failure of syncResult.failures) {
                    Sentry.captureException(new Error(failure.error), {
                        tags: { dao: failure.dao, system: system.id },
                        extra: {
                            total: syncResult.total,
                            succeeded: syncResult.succeeded.length,
                            timestamp: syncResult.timestamp,
                        },
                    });
                }

                if (process.env.NODE_ENV !== 'production') {
                    for (const failure of syncResult.failures) {
                        console.error('[Armoury Sync]', failure.dao, 'failed:', failure.error);
                    }

                    console.warn(
                        `[Armoury Sync] Summary: ${syncResult.succeeded.length}/${syncResult.total} succeeded`,
                    );
                }
            }

            if (syncResult && !syncResult.success) {
                const failedDaos = syncResult.failures.map((f: { dao: string }) => f.dao).join(', ');
                const message = `Partial sync failure: ${syncResult.failures.length}/${syncResult.total} DAOs failed (${failedDaos})`;
                setStatus('error');
                setError(message);
                setSystemSyncStates((prev) => ({
                    ...prev,
                    [system.id]: { status: 'error', error: message },
                }));

                return;
            }

            dataContextRef.current = dc;
            setDataContext(dc);
            setStatus('ready');
            setSystemSyncStates((prev) => ({
                ...prev,
                [system.id]: { status: 'synced' },
            }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to initialize DataContext';
            setStatus('error');
            setError(message);
            setSystemSyncStates((prev) => ({
                ...prev,
                [system.id]: { status: 'error', error: message },
            }));
        }
    }, []);

    /**
     * Disables a game system by closing the DataContext and clearing state.
     *
     * @param systemId - The ID of the system to disable.
     */
    const disableSystem = React.useCallback(async (systemId: string): Promise<void> => {
        if (dataContextRef.current) {
            await dataContextRef.current.close();
            dataContextRef.current = null;
        }

        setDataContext(null);
        setStatus('idle');
        setError(undefined);
        setSyncProgressCollector(null);
        setSystemSyncStates((prev) => {
            const next = { ...prev };
            delete next[systemId];

            return next;
        });
    }, []);

    /**
     * Cleanup on unmount: close the DataContext to release SQLite connections.
     */
    React.useEffect(() => {
        return () => {
            if (dataContextRef.current) {
                void dataContextRef.current.close();
            }
        };
    }, []);

    const value = React.useMemo<DataContextValue>(
        () => ({
            dataContext,
            status,
            error,
            systemSyncStates,
            syncProgressCollector,
            enableSystem,
            disableSystem,
        }),
        [dataContext, status, error, systemSyncStates, syncProgressCollector, enableSystem, disableSystem],
    );

    return <DataContextReactContext.Provider value={value}>{children}</DataContextReactContext.Provider>;
}

/**
 * Hook to access the DataContext and sync state from anywhere in the component tree.
 *
 * @returns The current DataContextValue.
 * @throws Error if used outside of a DataContextProvider.
 */
export function useDataContext(): DataContextValue {
    const context = React.useContext(DataContextReactContext);

    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataContextProvider');
    }

    return context;
}
