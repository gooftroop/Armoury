import { createContext, useCallback, useContext, useDebugValue, useRef } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { DataContext } from '@armoury/data-context';
import { SyncProgressCollector } from '@armoury/data-dao';
import type { SyncResult } from '@armoury/data-dao';

import type { DataContextManager } from '@/data/DataContextManager.js';
import type { ManagerState, SystemSyncState } from '@/data/managerState.js';

/**
 * @requirements
 * - REQ-WEB-MGR-BR-001: Bridge exposes a React Context carrying the manager instance.
 * - REQ-WEB-MGR-BR-002: Selector hook subscribes via useSyncExternalStore for tear-free reads.
 * - REQ-WEB-MGR-BR-003: Selector hook supports a custom equality function (default Object.is).
 * - REQ-WEB-MGR-BR-004: Active DataContext hook reads the dedicated activeDataContext$ stream
 *   so it does not re-render on unrelated sync-state churn.
 * - REQ-WEB-MGR-BR-005: Sync progress hook reads the dedicated progress$ stream.
 * - REQ-WEB-MGR-BR-006: System hook returns a stable SystemSyncState | undefined per id.
 * - REQ-WEB-MGR-BR-007: Hooks throw a descriptive error when used outside the provider.
 */

/** React Context carrying the live DataContextManager instance. */
export const ManagerContext = createContext<DataContextManager | null>(null);

/** Returns the active DataContextManager; throws when used outside the provider. */
export function useDataContextManager(): DataContextManager {
    const manager = useContext(ManagerContext);

    if (manager === null) {
        throw new Error('useDataContextManager must be used within a DataContextManagerProvider');
    }

    return manager;
}

const identitySelector = <T>(value: T): T => value;
const defaultIsEqual = <T>(a: T, b: T): boolean => Object.is(a, b);

type LastSyncResultReadableManager = DataContextManager & {
    getLastSyncResultSnapshot: (systemId: string) => SyncResult | null;
    selectLastSyncResult: (systemId: string) => import('rxjs').Observable<SyncResult | null>;
};

/** Stable non-null fallback collector used before progress stream emits. */
export const EMPTY_PROGRESS_COLLECTOR: SyncProgressCollector = Object.freeze(
    new SyncProgressCollector(0),
) as SyncProgressCollector;

/**
 * Subscribes to manager state via useSyncExternalStore with a memoised selector.
 *
 * @param selector - Maps the manager state to the slice the component cares about.
 * @param isEqual - Optional equality predicate; defaults to Object.is.
 */
export function useManagerSelector<T>(
    selector: (state: ManagerState) => T,
    isEqual: (a: T, b: T) => boolean = defaultIsEqual,
): T {
    const manager = useDataContextManager();

    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const subscription = manager.state().subscribe(() => onStoreChange());

            return () => subscription.unsubscribe();
        },
        [manager],
    );

    const getSnapshot = useCallback(() => manager.getSnapshot(), [manager]);

    const slice = useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, selector, isEqual);

    useDebugValue(slice);

    return slice;
}

/** Returns the full manager state snapshot (re-renders on any change). */
export function useManagerState(): ManagerState {
    return useManagerSelector(identitySelector);
}

/** Returns the active DataContext reference, sourced from the dedicated stream. */
export function useActiveDataContext(): DataContext | null {
    const manager = useDataContextManager();
    const lastSnapshotRef = useRef<DataContext | null>(manager.getActiveDataContextSnapshot());

    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const subscription = manager.selectActiveDataContext().subscribe((value) => {
                lastSnapshotRef.current = value;
                onStoreChange();
            });

            return () => subscription.unsubscribe();
        },
        [manager],
    );

    const getSnapshot = useCallback(() => lastSnapshotRef.current, []);

    return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, identitySelector, defaultIsEqual);
}

/** Returns the active SyncProgressCollector reference, sourced from the dedicated stream. */
export function useSyncProgressCollector(): SyncProgressCollector {
    const manager = useDataContextManager();
    const lastSnapshotRef = useRef<SyncProgressCollector>(EMPTY_PROGRESS_COLLECTOR);

    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const subscription = manager.selectSyncProgress().subscribe((value) => {
                lastSnapshotRef.current = value ?? EMPTY_PROGRESS_COLLECTOR;
                onStoreChange();
            });

            return () => subscription.unsubscribe();
        },
        [manager],
    );

    const getSnapshot = useCallback(() => lastSnapshotRef.current, []);

    return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, identitySelector, defaultIsEqual);
}

/** Returns the SystemSyncState for a single system id, or undefined when absent. */
export function useSystemSyncState(systemId: string): SystemSyncState | undefined {
    const selector = useCallback((state: ManagerState) => state.systemSyncStates[systemId], [systemId]);

    return useManagerSelector(selector);
}

/** Returns the last SyncResult for a single system id, or null when absent. */
export function useLastSyncResult(systemId: string): SyncResult | null {
    const manager = useDataContextManager() as LastSyncResultReadableManager;
    const lastSnapshotRef = useRef<SyncResult | null>(manager.getLastSyncResultSnapshot(systemId));

    const subscribe = useCallback(
        (onStoreChange: () => void) => {
            const subscription = manager.selectLastSyncResult(systemId).subscribe((value: SyncResult | null) => {
                lastSnapshotRef.current = value;
                onStoreChange();
            });

            return () => subscription.unsubscribe();
        },
        [manager, systemId],
    );

    const getSnapshot = useCallback(() => lastSnapshotRef.current, []);

    return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, identitySelector, defaultIsEqual);
}
