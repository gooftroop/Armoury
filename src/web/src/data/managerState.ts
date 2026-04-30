/**
 * @requirements
 * - REQ-WEB-MGR-001: Manager state is the single source of truth for all system sync states.
 * - REQ-WEB-MGR-002: Active DataContext reference is independent of sync-state churn.
 */

/** Sync states for a system data context. */
export const SyncStatus = {
    Idle: 'idle',
    Pending: 'pending',
    Syncing: 'syncing',
    Synced: 'synced',
    Error: 'error',
} as const;

/** Sync states for a system data context. */
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

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
