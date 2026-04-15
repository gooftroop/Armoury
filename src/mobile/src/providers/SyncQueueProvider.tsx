/**
 * SyncQueue Provider
 *
 * Manages a sequential FIFO queue for game system sync operations on the mobile platform.
 * Ensures only one system syncs at a time to prevent resource contention.
 * Queue is in-memory and session-scoped — cleared on app restart.
 *
 * @requirements
 * 1. Must process sync operations sequentially (FIFO ordering).
 * 2. Must prevent duplicate enqueue of the same systemId.
 * 3. Must expose queue state: pending systems, active system, isProcessing flag.
 * 4. Must handle sync function errors without blocking the queue.
 * 5. Must be session-scoped (in-memory, no persistence).
 * 6. Must provide context via useSyncQueue hook.
 *
 * @module SyncQueueProvider
 */

import * as React from 'react';

/**
 * Internal queue entry for a pending sync operation.
 */
interface SyncQueueEntry {
    /** The game system identifier for this queue entry. */
    systemId: string;
    /** The async sync function to execute. */
    syncFn: () => Promise<void>;
    /** Resolves the promise returned by enqueue. */
    resolve: () => void;
    /** Rejects the promise returned by enqueue. */
    reject: (reason?: unknown) => void;
}

/**
 * State exposed by the SyncQueue context.
 */
export interface SyncQueueState {
    /** System IDs waiting to be processed (not including active). */
    pending: string[];
    /** The systemId currently being synced, or null if idle. */
    active: string | null;
    /** Whether the queue is currently processing any item. */
    isProcessing: boolean;
}

/**
 * Value exposed by the SyncQueue context.
 */
export interface SyncQueueValue {
    /** Current queue state. */
    state: SyncQueueState;
    /**
     * Enqueue a sync operation for a game system.
     * If the systemId is already queued or active, returns immediately (idempotent).
     * The returned promise resolves when this system's sync completes (or rejects on error).
     *
     * @param systemId - The game system identifier.
     * @param syncFn - The async function that performs the actual sync.
     * @returns Promise that resolves when the sync for this systemId completes.
     */
    enqueue: (systemId: string, syncFn: () => Promise<void>) => Promise<void>;
}

/**
 * Props for the SyncQueueProvider component.
 */
export interface SyncQueueProviderProps {
    /** Child components that can access sync queue state and actions. */
    children: React.ReactNode;
}

/**
 * React context for sync queue state and actions.
 */
const SyncQueueReactContext = React.createContext<SyncQueueValue | undefined>(undefined);

/**
 * Sync queue provider component.
 *
 * @param props - Component props.
 * @returns Provider-wrapped React tree.
 */
export function SyncQueueProvider({ children }: SyncQueueProviderProps): React.ReactElement {
    const [state, setState] = React.useState<SyncQueueState>({
        pending: [],
        active: null,
        isProcessing: false,
    });
    const queueRef = React.useRef<SyncQueueEntry[]>([]);
    const processingRef = React.useRef<boolean>(false);
    const queuedSystemIdsRef = React.useRef<Set<string>>(new Set());

    /**
     * Processes the next queued sync operation if available.
     *
     * @returns Promise that resolves after one processing cycle.
     */
    const processNext = React.useCallback(async (): Promise<void> => {
        if (processingRef.current || queueRef.current.length === 0) {
            return;
        }

        processingRef.current = true;
        const entry = queueRef.current.shift();

        if (!entry) {
            processingRef.current = false;

            setState({
                pending: [],
                active: null,
                isProcessing: false,
            });

            return;
        }

        setState({
            pending: queueRef.current.map((item) => item.systemId),
            active: entry.systemId,
            isProcessing: true,
        });

        try {
            await entry.syncFn();
            entry.resolve();
        } catch (error) {
            entry.reject(error);
        }

        queuedSystemIdsRef.current.delete(entry.systemId);
        processingRef.current = false;

        setState({
            pending: queueRef.current.map((item) => item.systemId),
            active: null,
            isProcessing: false,
        });

        void processNext();
    }, []);

    /**
     * Enqueues a sync operation for sequential FIFO processing.
     *
     * @param systemId - The game system identifier.
     * @param syncFn - The async function that performs sync.
     * @returns Promise that resolves when the system sync completes.
     */
    const enqueue = React.useCallback(
        (systemId: string, syncFn: () => Promise<void>): Promise<void> => {
            if (queuedSystemIdsRef.current.has(systemId)) {
                return Promise.resolve();
            }

            queuedSystemIdsRef.current.add(systemId);

            const operation = new Promise<void>((resolve, reject) => {
                queueRef.current.push({
                    systemId,
                    syncFn,
                    resolve,
                    reject,
                });
            });

            setState((prev) => ({
                pending: queueRef.current.map((item) => item.systemId),
                active: prev.active,
                isProcessing: prev.isProcessing,
            }));

            void processNext();

            return operation;
        },
        [processNext],
    );

    const value = React.useMemo<SyncQueueValue>(
        () => ({
            state,
            enqueue,
        }),
        [state, enqueue],
    );

    return <SyncQueueReactContext.Provider value={value}>{children}</SyncQueueReactContext.Provider>;
}

/**
 * Hook for accessing SyncQueue context value.
 *
 * @returns The current SyncQueue context value.
 * @throws Error if used outside of a SyncQueueProvider.
 */
export function useSyncQueue(): SyncQueueValue {
    const context = React.useContext(SyncQueueReactContext);

    if (context === undefined) {
        throw new Error('useSyncQueue must be used within a SyncQueueProvider');
    }

    return context;
}
