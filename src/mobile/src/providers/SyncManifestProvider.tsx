/**
 * SyncManifest Provider
 *
 * Tracks which game systems have completed a sync operation in the current session.
 * Used to gate access to game system pages — users cannot navigate to a system's
 * content until it has been synced at least once in the current session.
 *
 * The manifest is in-memory only — cleared on app restart or page refresh.
 * It does NOT affect other devices or browser tabs.
 *
 * @requirements
 * 1. Must track synced system IDs in an in-memory Set.
 * 2. Must expose markSynced(systemId) to record a completed sync.
 * 3. Must expose hasSynced(systemId) to check if a system synced this session.
 * 4. Must be session-scoped (no persistence, no cross-tab sharing).
 * 5. Must provide context via useSyncManifest hook.
 *
 * @module SyncManifestProvider
 */

import * as React from 'react';

/**
 * Value exposed by the SyncManifest context.
 */
export interface SyncManifestValue {
    /**
     * Mark a game system as synced in this session.
     *
     * @param systemId - The game system identifier.
     * @returns Nothing.
     */
    markSynced: (systemId: string) => void;
    /**
     * Check whether a game system has been synced in this session.
     *
     * @param systemId - The game system identifier.
     * @returns True if the system has completed sync this session.
     */
    hasSynced: (systemId: string) => boolean;
    /** Array of all synced system IDs this session (for display/debugging). */
    syncedSystems: string[];
}

/**
 * Props for the SyncManifestProvider component.
 */
export interface SyncManifestProviderProps {
    /** Child components that can access the sync manifest. */
    children: React.ReactNode;
}

/**
 * React context for sync manifest access.
 */
const SyncManifestReactContext = React.createContext<SyncManifestValue | undefined>(undefined);

/**
 * Sync manifest provider component.
 *
 * @param props - Component props.
 * @returns Provider-wrapped React tree.
 */
export function SyncManifestProvider({ children }: SyncManifestProviderProps): React.ReactElement {
    const [syncedSet, setSyncedSet] = React.useState<Set<string>>(new Set());

    /**
     * Records a system as synced in the current session.
     *
     * @param systemId - The game system identifier.
     * @returns Nothing.
     */
    const markSynced = React.useCallback((systemId: string): void => {
        setSyncedSet((prev) => {
            const next = new Set(prev);
            next.add(systemId);

            return next;
        });
    }, []);

    /**
     * Checks whether a system has been synced in the current session.
     *
     * @param systemId - The game system identifier.
     * @returns True if the system has completed sync this session.
     */
    const hasSynced = React.useCallback(
        (systemId: string): boolean => {
            return syncedSet.has(systemId);
        },
        [syncedSet],
    );

    const syncedSystems = React.useMemo<string[]>(() => Array.from(syncedSet), [syncedSet]);
    const value = React.useMemo<SyncManifestValue>(
        () => ({
            markSynced,
            hasSynced,
            syncedSystems,
        }),
        [markSynced, hasSynced, syncedSystems],
    );

    return <SyncManifestReactContext.Provider value={value}>{children}</SyncManifestReactContext.Provider>;
}

/**
 * Hook for accessing SyncManifest context value.
 *
 * @returns The current SyncManifest context value.
 * @throws Error if used outside of a SyncManifestProvider.
 */
export function useSyncManifest(): SyncManifestValue {
    const context = React.useContext(SyncManifestReactContext);

    if (context === undefined) {
        throw new Error('useSyncManifest must be used within a SyncManifestProvider');
    }

    return context;
}
