/**
 * @requirements
 * - REQ-WEB-MGR-001: Manager state is the single source of truth for all system sync states.
 * - REQ-WEB-MGR-002: Active DataContext reference is independent of sync-state churn.
 */

export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'synced' | 'error';

export type SystemSyncState = {
    systemId: string;
    status: SyncStatus;
    hasCache: boolean;
    attempts: number;
    error?: string;
};

export type ManagerStatus = 'idle' | 'initializing' | 'ready' | 'error';

export type ManagerState = {
    status: ManagerStatus;
    error: string | undefined;
    activeSystemId: string | null;
    systemSyncStates: Record<string, SystemSyncState>;
};

export const initialManagerState: ManagerState = {
    status: 'idle',
    error: undefined,
    activeSystemId: null,
    systemSyncStates: {},
};
