'use client';

/**
 * DataContext Provider
 *
 * Manages DataContext lifecycle and staleness-check-first sync flow for game systems.
 *
 * @requirements
 * 1. Must create DataContext on browser mount using PGlite platform.
 * 2. Must track initialization state: idle | initializing | ready | error.
 * 3. Must track per-system sync state: idle | pending | checking-staleness | syncing | synced | error.
 * 4. Must expose enableSystem / disableSystem actions for user-driven system activation.
 * 5. Must call dataContext.close() on unmount to release database connections.
 * 6. Must not block rendering — no full-screen loader.
 * 7. Must provide the DataContext instance and sync state via React context.
 * 8. Must restore sync state from the database adapter (getAllSyncStatuses), not localStorage.
 * 9. Must derive system ownership via GameSystem.getSyncFileKeyPrefixes(), not hardcoded maps.
 *
 * @module DataContextProvider
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
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
 * Probes the local database and returns system IDs that have cached sync records.
 *
 * @param signal - AbortSignal to cancel the probe.
 * @returns Cached system identifiers.
 */
async function probeSyncedSystems(signal: AbortSignal): Promise<string[]> {
    try {
        const { PGliteAdapter } = await import('@armoury/adapters-pglite');
        const probe = new PGliteAdapter({ dataDir: 'idb://armoury' });
        await probe.initialize();

        try {
            const statuses = await probe.getAllSyncStatuses();

            if (signal.aborted || statuses.length === 0) {
                return [];
            }

            const fileKeys = statuses.map((s) => s.fileKey);
            const { resolveGameSystem, getKnownSystemIds } = await import('@/lib/resolveGameSystem.js');
            const systemIds: string[] = [];

            for (const id of getKnownSystemIds()) {
                if (signal.aborted) {
                    break;
                }

                const system = await resolveGameSystem(id);

                if (!system) {
                    continue;
                }

                const prefixes = system.getSyncFileKeyPrefixes();
                const hasData = fileKeys.some((key) => prefixes.some((prefix) => key.startsWith(prefix)));

                if (hasData) {
                    systemIds.push(id);
                }
            }

            return systemIds;
        } finally {
            await probe.close();
        }
    } catch {
        return [];
    }
}

/** Possible states for DataContext initialization lifecycle. */
export type DataContextStatus = 'idle' | 'initializing' | 'ready' | 'error';

/** Possible states for a single game system sync lifecycle. */
export type SystemSyncStatus = 'idle' | 'pending' | 'checking-staleness' | 'syncing' | 'synced' | 'error';

/** Per-system sync state tracked by the provider. */
export interface SystemSyncState {
    /** Current sync status for this system. */
    status: SystemSyncStatus;
    /** Error message if status is 'error'. */
    error?: string;
    /** Whether this system has local cache available as fallback. */
    hasCache?: boolean;
}

/** Shape of DataContext React context value. */
export interface DataContextValue {
    /** The active DataContext instance, or null when unavailable. */
    dataContext: DataContext | null;
    /** Overall provider initialization status. */
    status: DataContextStatus;
    /** Error message if provider status is 'error'. */
    error?: string;
    /** Per-system sync states keyed by system ID. */
    systemSyncStates: Record<string, SystemSyncState>;
    /** Progress collector for the active sync operation. */
    syncProgressCollector: SyncProgressCollector | null;
    /** Enables a game system and enqueues staleness checks. */
    enableSystem: (system: GameSystem) => Promise<void>;
    /** Disables a game system and clears sync state. */
    disableSystem: (systemId: string) => Promise<void>;
}

const DataContextReactContext = createContext<DataContextValue | undefined>(undefined);

/** Props for DataContextProvider. */
export interface DataContextProviderProps {
    /** Child components that consume provider state. */
    children: ReactNode;
}

/**
 * Builds a DataContext from local cache using the existing DI setup.
 *
 * @param system - Game system descriptor.
 * @param setSyncProgressCollector - Sync progress collector setter.
 * @param setDataContext - Active data context setter.
 * @returns Built DataContext.
 */
async function buildDataContextFromCache(
    system: GameSystem,
    setSyncProgressCollector: (collector: SyncProgressCollector | null) => void,
    setDataContext: (dc: DataContext) => void,
): Promise<DataContext> {
    const { DataContextBuilder } = await import('@armoury/data-context');
    const { getQueryClient } = await import('@/lib/getQueryClient.js');

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

    const dc = await DataContextBuilder.builder()
        .system(system)
        .adapter(adapter)
        .register('github', githubClient)
        .register('wahapedia', wahapediaAdapter)
        .register('syncProgress', collector)
        .buildFromCache();

    if (process.env.NODE_ENV !== 'production') {
        const rawQueryAdapter = adapter as DatabaseAdapter & {
            rawQuery: (sql: string) => Promise<unknown>;
        };

        (window as unknown as Record<string, unknown>).__armoury_raw_query = (sql: string) =>
            rawQueryAdapter.rawQuery(sql);
    }

    setDataContext(dc);

    return dc;
}

/**
 * DataContextProvider component.
 *
 * @param props - Component props.
 * @returns Provider-wrapped React tree.
 */
export function DataContextProvider({ children }: DataContextProviderProps): ReactElement {
    const [dataContext, setDataContext] = useState<DataContext | null>(null);
    const [status, setStatus] = useState<DataContextStatus>('idle');
    const [error, setError] = useState<string | undefined>();
    const [systemSyncStates, setSystemSyncStates] = useState<Record<string, SystemSyncState>>({});
    const [syncProgressCollector, setSyncProgressCollector] = useState<SyncProgressCollector | null>(null);

    const systemSyncStatesRef = useRef<Record<string, SystemSyncState>>({});
    const systemRegistryRef = useRef<Record<string, GameSystem>>({});
    const dataContextsRef = useRef<Record<string, DataContext>>({});
    const queueRef = useRef<string[]>([]);
    const queuedIdsRef = useRef<Set<string>>(new Set());
    const queueRunningRef = useRef<boolean>(false);

    useEffect(() => {
        systemSyncStatesRef.current = systemSyncStates;
    }, [systemSyncStates]);

    const runQueue = useCallback(async (): Promise<void> => {
        if (queueRunningRef.current) {
            return;
        }

        queueRunningRef.current = true;

        while (queueRef.current.length > 0) {
            const systemId = queueRef.current.shift();

            if (!systemId) {
                continue;
            }

            const previousState = systemSyncStatesRef.current[systemId];
            const hasCache = previousState?.hasCache ?? false;

            try {
                let system: GameSystem | undefined = systemRegistryRef.current[systemId];

                if (!system) {
                    const { resolveGameSystem } = await import('@/lib/resolveGameSystem.js');
                    const resolvedSystem = await resolveGameSystem(systemId);

                    if (!resolvedSystem) {
                        throw new Error(`Failed to resolve game system: ${systemId}`);
                    }

                    system = resolvedSystem;

                    systemRegistryRef.current[systemId] = system;
                }

                let dc = dataContextsRef.current[systemId];

                if (!dc) {
                    setStatus('initializing');
                    setError(undefined);
                    dc = await buildDataContextFromCache(system, setSyncProgressCollector, setDataContext);
                    dataContextsRef.current[systemId] = dc;
                    setStatus('ready');
                }

                setSystemSyncStates((prev) => ({
                    ...prev,
                    [systemId]: { status: 'checking-staleness', hasCache },
                }));

                const maxAttempts = 3;
                let attempts = 0;
                let syncSucceeded = false;
                let lastError = 'Failed to sync';

                while (attempts < maxAttempts && !syncSucceeded) {
                    attempts += 1;

                    try {
                        const syncResult = await dc.sync();

                        if (syncResult && syncResult.failures.length > 0) {
                            for (const failure of syncResult.failures) {
                                Sentry.captureException(new Error(failure.error), {
                                    tags: { dao: failure.dao, system: systemId },
                                    extra: {
                                        total: syncResult.total,
                                        succeeded: syncResult.succeeded.length,
                                        timestamp: syncResult.timestamp,
                                    },
                                });
                            }
                        }

                        if (syncResult && !syncResult.success) {
                            const failedDaos = syncResult.failures.map((f: { dao: string }) => f.dao).join(', ');
                            throw new Error(
                                `Partial sync failure: ${syncResult.failures.length}/${syncResult.total} DAOs failed (${failedDaos})`,
                            );
                        }

                        setSystemSyncStates((prev) => ({
                            ...prev,
                            [systemId]: { status: 'synced', hasCache },
                        }));
                        syncSucceeded = true;
                    } catch (err) {
                        lastError = err instanceof Error ? err.message : 'Failed to sync';

                        if (attempts >= maxAttempts) {
                            setStatus('error');
                            setError(lastError);
                            setSystemSyncStates((prev) => ({
                                ...prev,
                                [systemId]: { status: 'error', error: lastError, hasCache },
                            }));
                        }
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to sync';
                setStatus('error');
                setError(message);
                setSystemSyncStates((prev) => ({
                    ...prev,
                    [systemId]: { status: 'error', error: message, hasCache },
                }));
            } finally {
                queuedIdsRef.current.delete(systemId);
            }
        }

        queueRunningRef.current = false;
    }, []);

    const enqueueSystem = useCallback(
        (systemId: string): void => {
            if (queuedIdsRef.current.has(systemId)) {
                return;
            }

            queuedIdsRef.current.add(systemId);
            queueRef.current.push(systemId);
            void runQueue();
        },
        [runQueue],
    );

    useEffect(() => {
        const controller = new AbortController();

        void probeSyncedSystems(controller.signal).then(async (systemIds) => {
            if (controller.signal.aborted) {
                return;
            }

            if (systemIds.length === 0) {
                return;
            }

            const restored: Record<string, SystemSyncState> = {};

            for (const id of systemIds) {
                restored[id] = { status: 'pending', hasCache: true };
            }

            systemSyncStatesRef.current = restored;
            setSystemSyncStates(restored);

            const { resolveGameSystem } = await import('@/lib/resolveGameSystem.js');

            for (const id of systemIds) {
                if (controller.signal.aborted) {
                    return;
                }

                const system = await resolveGameSystem(id);

                if (system) {
                    systemRegistryRef.current[id] = system;
                    globalThis.setTimeout(() => {
                        enqueueSystem(id);
                    }, 0);
                }
            }
        });

        return () => {
            controller.abort();
        };
    }, [enqueueSystem]);

    const enableSystem = useCallback(
        async (system: GameSystem): Promise<void> => {
            systemRegistryRef.current[system.id] = system;

            setSystemSyncStates((prev) => ({
                ...prev,
                [system.id]: { status: 'syncing', hasCache: false },
            }));
            systemSyncStatesRef.current = {
                ...systemSyncStatesRef.current,
                [system.id]: { status: 'syncing', hasCache: false },
            };
            setStatus('initializing');
            setError(undefined);

            try {
                const dc = await buildDataContextFromCache(system, setSyncProgressCollector, setDataContext);
                dataContextsRef.current[system.id] = dc;
                setStatus('ready');
                enqueueSystem(system.id);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to initialize DataContext';
                setStatus('error');
                setError(message);
                setSystemSyncStates((prev) => ({
                    ...prev,
                    [system.id]: { status: 'error', error: message, hasCache: false },
                }));
            }
        },
        [enqueueSystem],
    );

    const disableSystem = useCallback(
        async (systemId: string): Promise<void> => {
            const systemDataContext = dataContextsRef.current[systemId];

            if (systemDataContext) {
                await systemDataContext.close();
                delete dataContextsRef.current[systemId];

                if (dataContext === systemDataContext) {
                    setDataContext(null);
                }
            } else if (dataContext) {
                await dataContext.close();
                setDataContext(null);
            }

            setStatus('idle');
            setError(undefined);
            setSyncProgressCollector(null);
            setSystemSyncStates((prev) => {
                const next = { ...prev };
                delete next[systemId];

                return next;
            });
            queuedIdsRef.current.delete(systemId);
            queueRef.current = queueRef.current.filter((id) => id !== systemId);
            delete systemRegistryRef.current[systemId];
        },
        [dataContext],
    );

    useEffect(() => {
        return () => {
            const activeDataContexts = Object.values(dataContextsRef.current);

            if (activeDataContexts.length > 0) {
                for (const activeDataContext of activeDataContexts) {
                    void activeDataContext.close();
                }

                return;
            }

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
 * Hook for reading DataContext provider state.
 *
 * @returns DataContext provider value.
 * @throws Error when used outside DataContextProvider.
 */
export function useDataContext(): DataContextValue {
    const context = useContext(DataContextReactContext);

    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataContextProvider');
    }

    return context;
}
