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
import type { DataContext } from '@armoury/data-context';
import type { GameSystem } from '@armoury/data-dao';

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
 * Default context value before initialization.
 */
const defaultContextValue: DataContextValue = {
    dataContext: null,
    status: 'idle',
    systemSyncStates: {},
    enableSystem: async () => {},
    disableSystem: async () => {},
};

/**
 * React context for accessing the DataContext and sync state.
 */
const DataContextReactContext = React.createContext<DataContextValue>(defaultContextValue);

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
            const { DataContext: DC } = await import('@armoury/data-context');
            const { openDatabaseAsync } = await import('expo-sqlite');
            const { SQLiteAdapter } = await import('@armoury/adapters-sqlite');
            const database = await openDatabaseAsync('armoury');
            const adapter = new SQLiteAdapter(database);
            const dc = await DC.builder().system(system).adapter(adapter).build();
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
            enableSystem,
            disableSystem,
        }),
        [dataContext, status, error, systemSyncStates, enableSystem, disableSystem],
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
