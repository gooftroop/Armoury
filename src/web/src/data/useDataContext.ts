import { useCallback, useMemo } from 'react';
import type { DataContext } from '@armoury/data-context';
import type { GameSystem, SyncProgressCollector } from '@armoury/data-dao';

import {
    useActiveDataContext,
    useDataContextManager,
    useLastSyncResult,
    useManagerSelector,
    useSyncProgressCollector,
} from '@/data/managerBridge.js';
import type { ManagerState, SystemSyncState, SyncStatus } from '@/data/managerState.js';

/**
 * @requirements
 * - REQ-WEB-MGR-LH-001: useDataContext returns the same shape as the legacy DataContextProvider value.
 * - REQ-WEB-MGR-LH-002: enableSystem / disableSystem delegate to the manager and are stable references.
 * - REQ-WEB-MGR-LH-003: Hook does not over-render — slices manager state into legacy-equivalent fields.
 * - REQ-WEB-MGR-LH-004: dataContext field is sourced from the dedicated activeDataContext$ stream.
 * - REQ-WEB-MGR-LH-005: SystemSyncStatus mapping mirrors legacy ('idle' | 'pending' | 'syncing'
 *   | 'synced' | 'error') — manager 'pending' maps to legacy 'pending', manager 'syncing'
 *   maps to legacy 'syncing'.
 */

/** Possible states for DataContext initialization lifecycle (legacy compatibility). */
export type DataContextStatus = 'idle' | 'initializing' | 'ready' | 'error';

/** Possible states for a single game system sync lifecycle (legacy compatibility). */
export type SystemSyncStatus = 'idle' | 'pending' | 'syncing' | 'synced' | 'error';

/** Per-system sync state in legacy shape. */
export interface LegacySystemSyncState {
    status: SystemSyncStatus;
    error?: string;
    hasCache?: boolean;
}

/** Backwards-compatible value returned by useDataContext. */
export interface DataContextValue {
    dataContext: DataContext | null;
    status: DataContextStatus;
    error?: string;
    systemSyncStates: Record<string, LegacySystemSyncState>;
    syncProgressCollector: SyncProgressCollector;
    hasInflightSystemSync: (systemId: string) => boolean;
    enableSystem: (system: GameSystem) => Promise<void>;
    disableSystem: (systemId: string) => Promise<void>;
}

interface ManagerSyncSlice {
    status: DataContextStatus;
    error: string | undefined;
    systemSyncStates: Record<string, LegacySystemSyncState>;
}

const STATUS_MAP: Record<SyncStatus, SystemSyncStatus> = {
    idle: 'idle',
    pending: 'pending',
    syncing: 'syncing',
    synced: 'synced',
    error: 'error',
};

function toLegacySystemSyncState(state: SystemSyncState): LegacySystemSyncState {
    return {
        status: STATUS_MAP[state.status],
        error: state.error,
        hasCache: state.hasCache,
    };
}

function selectSyncSlice(state: ManagerState): ManagerSyncSlice {
    const legacySystemStates: Record<string, LegacySystemSyncState> = {};

    for (const [systemId, systemState] of Object.entries(state.systemSyncStates)) {
        legacySystemStates[systemId] = toLegacySystemSyncState(systemState);
    }

    return {
        status: state.status,
        error: state.error,
        systemSyncStates: legacySystemStates,
    };
}

function isSyncSliceEqual(a: ManagerSyncSlice, b: ManagerSyncSlice): boolean {
    if (a.status !== b.status || a.error !== b.error) {
        return false;
    }

    const aIds = Object.keys(a.systemSyncStates);
    const bIds = Object.keys(b.systemSyncStates);

    if (aIds.length !== bIds.length) {
        return false;
    }

    for (const id of aIds) {
        const aState = a.systemSyncStates[id];
        const bState = b.systemSyncStates[id];

        if (
            !bState ||
            aState.status !== bState.status ||
            aState.error !== bState.error ||
            aState.hasCache !== bState.hasCache
        ) {
            return false;
        }
    }

    return true;
}

/**
 * Backwards-compatible hook returning the legacy DataContextValue shape.
 * Composes the bridge hooks so existing consumers do not need to change.
 */
/**
 * @deprecated Prefer reading the manager state directly via `useDataContextManager()`
 *   from `@armoury/web/data`. This shim exists for backwards compatibility with
 *   pre-manager call sites and will be removed in a future release.
 */
export function useDataContext(): DataContextValue {
    const manager = useDataContextManager();
    const slice = useManagerSelector(selectSyncSlice, isSyncSliceEqual);
    const dataContext = useActiveDataContext();
    const syncProgressCollector = useSyncProgressCollector();
    const hasInflightSystemSync = manager.hasInflightSystemSync?.bind(manager) ?? (() => false);

    const enableSystem = useCallback((system: GameSystem) => manager.enableSystem(system), [manager]);

    const disableSystem = useCallback((systemId: string) => manager.disableSystem(systemId), [manager]);

    return useMemo<DataContextValue>(
        () => ({
            dataContext,
            status: slice.status,
            error: slice.error,
            systemSyncStates: slice.systemSyncStates,
            syncProgressCollector,
            hasInflightSystemSync,
            enableSystem,
            disableSystem,
        }),
        [dataContext, slice, syncProgressCollector, hasInflightSystemSync, enableSystem, disableSystem],
    );
}

export { useLastSyncResult };
