/**
 * Sync progress tracking types — used by UI to display real-time sync status updates.
 * Provides type-safe callbacks and phase tracking for game data synchronization operations.
 *
 * @module
 */

/**
 * Phases of a game data sync operation.
 * Represents the lifecycle state of a synchronization process.
 */
export type SyncPhase = 'idle' | 'loading' | 'initializing' | 'syncing' | 'complete' | 'error';

/**
 * Snapshot of sync progress at a point in time.
 * Immutable state object sent to progress callbacks to allow UI to display current sync status.
 */
export interface SyncProgressState {
    /** Current phase of the sync operation. */
    phase: SyncPhase;
    /** Number of DAOs that have completed loading. */
    completed: number;
    /** Total number of DAOs to load. */
    total: number;
    /** Number of DAOs that failed to load. */
    failures: number;
    /** Human-readable status message (e.g., "Syncing 15/40"). */
    message: string;
}

/**
 * Callback invoked when sync progress changes.
 * Called by sync operations to notify listeners of progress state transitions.
 * The callback must return void and accept a single SyncProgressState argument.
 */
export type OnProgressCallback = (state: SyncProgressState) => void;
