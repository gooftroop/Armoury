/**
 * Mobile-local sync status enum.
 *
 * Mirrors the web SyncStatus const-object pattern but scoped to the mobile
 * workspace. Cross-workspace imports from @armoury/web are prohibited per
 * workspace boundary rules.
 *
 * @requirements
 * 1. Must export SyncStatus as both a value (const object) and a type.
 * 2. Members must match the SystemSyncStatus union in DataContextProvider.
 *
 * @module sync-status
 */

export const SyncStatus = {
    Idle: 'idle',
    Syncing: 'syncing',
    Synced: 'synced',
    Error: 'error',
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];
