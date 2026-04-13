'use client';

/**
 * DataContext Provider
 *
 * Manages the lifecycle of DataContext instances for game systems on the web platform.
 * Creates DataContext on browser mount using PGlite, tracks sync state per system,
 * and exposes the context tree to the application.
 *
 * The provider does NOT block rendering — it initializes in the background and
 * surfaces sync state so consumers (e.g. game system tiles) can show loading indicators.
 *
 * @requirements
 * 1. Must create DataContext on browser mount using PGlite platform.
 * 2. Must track initialization state: idle | initializing | ready | error.
 * 3. Must track per-system sync state: idle | syncing | synced | error
 * 4. Must expose enableSystem / disableSystem actions for user-driven system activation.
 * 5. Must call dataContext.close() on unmount to release database connections.
 * 6. Must not block rendering — no full-screen loader
 * 7. Must provide the DataContext instance and sync state via React context.
 *
 * @module DataContextProvider
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { createContainerWithModules, coreModule, TOKENS } from '@armoury/di';
import { webModule } from '@armoury/di/web';
import type { AdapterFactoryFn, ClientFactoryFn } from '@armoury/di';
import type { DataContext } from '@armoury/data-context';
import type { IGitHubClient } from '@armoury/clients-github';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';
import { SyncProgressCollector } from '@armoury/data-dao';
import type { DatabaseAdapter, GameSystem } from '@armoury/data-dao';
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
    - - `error`: Sync failed (will retry on next access).
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
const DataContextReactContext = createContext<DataContextValue | undefined>(undefined);
/**
 * Props for the DataContextProvider component.
 */
export interface DataContextProviderProps {
    /** Child components that can access the DataContext via useDataContext(). */
    children: ReactNode;
}

/**
 * DataContextProvider component.
 *
 * Wraps the application to provide DataContext lifecycle management.
 * Initializes lazily when a system is enabled (user clicks a game system tile)
 * Does not block rendering.
 *
 * @param props - Component props.
 * @returns The provider-wrapped React tree.
 */
export function DataContextProvider({ children }: DataContextProviderProps): ReactElement {
    const [dataContext, setDataContext] = useState<DataContext | null>(null);
    const [status, setStatus] = useState<DataContextStatus>('idle');
    const [error, setError] = useState<string | undefined>();
    const [systemSyncStates, setSystemSyncStates] = useState<Record<string, SystemSyncState>>({});
    const [syncProgressCollector, setSyncProgressCollector] = useState<SyncProgressCollector | null>(null);

    /**
     * Enables a game system by building a DataContext and syncing its data.
     *
     * @param system - The GameSystem descriptor to enable.
     */
    const enableSystem = useCallback(async (system: GameSystem): Promise<void> => {
        // Diagnostic logging — traces each sync phase with wall-clock timestamps
        // so CI logs reveal where the flow stalls. Remove once root cause is fixed.
        const t0 = Date.now();
        const log = (phase: string) =>
            console.log(`[SYNC-DEBUG] ${phase} +${Date.now() - t0}ms (wall ${new Date().toISOString()})`);

        log('enableSystem start');

        setSystemSyncStates((prev) => ({
            ...prev,
            [system.id]: { status: 'syncing' },
        }));
        setStatus('initializing');
        setError(undefined);

        try {
            /**
             * Dynamic import to avoid bundling the full DataContext builder in the initial JS bundle.
             * The builder pulls in PGlite, drizzle-orm, and adapter code which are heavy.
             */
            log('dynamic imports start');
            const { DataContextBuilder } = await import('@armoury/data-context');
            const { getQueryClient } = await import('@/lib/getQueryClient.js');
            log('dynamic imports done');

            const container = createContainerWithModules(coreModule, webModule);
            const queryClient = getQueryClient();
            container.bind(TOKENS.QueryClient).toConstantValue(queryClient);

            const collector = new SyncProgressCollector(40);
            setSyncProgressCollector(collector);

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

            log('dependencies resolved, starting build()');
            const dc = await DataContextBuilder.builder()
                .system(system)
                .adapter(adapter)
                .register('github', githubClient)
                .register('wahapedia', wahapediaAdapter)
                .register('syncProgress', collector)
                .build();
            log('build() returned');
            setDataContext(dc);

            // Expose raw query function for e2e test helpers (avoids opening a second PGlite connection).
            if (process.env.NODE_ENV !== 'production') {
                const rawQueryAdapter = adapter as DatabaseAdapter & {
                    rawQuery: (sql: string) => Promise<unknown>;
                };

                (window as unknown as Record<string, unknown>).__armoury_raw_query = (sql: string) =>
                    rawQueryAdapter.rawQuery(sql);
            }

            // Report partial sync failures from the builder's sync result
            const syncResult = dc.syncResult;

            if (syncResult && syncResult.failures.length > 0) {
                // Report each failure to Sentry
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

                // Log to console in non-production environments
                if (process.env.NODE_ENV !== 'production') {
                    for (const failure of syncResult.failures) {
                        console.error('[Armoury Sync]', failure.dao, 'failed:', failure.error);
                    }

                    console.warn(
                        `[Armoury Sync] Summary: ${syncResult.succeeded.length}/${syncResult.total} succeeded`,
                    );
                }
            }

            // Partial sync failure: some DAOs succeeded but others failed.
            // Surface as error so the tile reflects the incomplete state.
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

            log('setting status=ready');
            setStatus('ready');
            setSystemSyncStates((prev) => ({
                ...prev,
                [system.id]: { status: 'synced' },
            }));
            log('enableSystem complete');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to initialize DataContext';
            log(`enableSystem ERROR: ${message}`);

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
    const disableSystem = useCallback(
        async (systemId: string): Promise<void> => {
            if (dataContext) {
                await dataContext.close();
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
        },
        [dataContext],
    );
    /**
     * Cleanup on unmount: close the DataContext to release PGlite connections.
     */
    useEffect(() => {
        return () => {
            if (dataContext) {
                void dataContext.close();
            }
        };
    }, [dataContext]);
    const value = useMemo<DataContextValue>(
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
 * Hook to access the DataContext and sync state from anywhere in component tree.
 *
 * @returns The current DataContextValue.
 * @throws Error if used outside of a DataContextProvider.
 */
export function useDataContext(): DataContextValue {
    const context = useContext(DataContextReactContext);

    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataContextProvider');
    }

    return context;
}
