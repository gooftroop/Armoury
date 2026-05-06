'use client';

import type { ReactElement, ReactNode } from 'react';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { useDataContext } from '@/providers/DataContextProvider.js';
import { useSyncManifest } from '@/providers/SyncManifestProvider.js';

/**
 * @requirements
 * 1. Must gate system content based on session sync manifest and DataContext sync state.
 * 2. Must allow access when system status is synced in DataContext.
 * 3. Must allow access when system has synced in this session via SyncManifest.
 * 4. Must render a loading state when system status is pending, checking-staleness, or syncing.
 * 5. Must render differentiated error states for cached and uncached failures.
 * 6. Must render a not-ready state with navigation back to locale root when access is blocked.
 *
 * @module system-access-gate
 */

/**
 * Props for the SystemAccessGate component.
 */
export interface SystemAccessGateProps {
    /** The game system identifier to validate access against. */
    systemId: string;
    /** Child content rendered only when gate access requirements are met. */
    children: ReactNode;
}

/**
 * Gates game-system page content until the system is available this session.
 *
 * Access is granted when either the DataContext reports the system as synced
 * (local data available) or the SyncManifest marks it synced this session.
 *
 * @param props - Access gate props.
 * @returns The gated children or the appropriate blocked-state UI.
 */
function SystemAccessGate({ systemId, children }: SystemAccessGateProps): ReactElement {
    const { hasSynced } = useSyncManifest();
    const { systemSyncStates } = useDataContext();
    const syncState = systemSyncStates[systemId];
    const isSyncedInDataContext = syncState?.status === 'synced';
    const isSyncedThisSession = hasSynced(systemId);

    if (isSyncedInDataContext || isSyncedThisSession) {
        return <>{children}</>;
    }

    if (
        syncState?.status === 'pending' ||
        syncState?.status === 'checking-staleness' ||
        syncState?.status === 'syncing'
    ) {
        return (
            <div className="flex min-h-[50dvh] items-center justify-center px-4 py-10">
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-surface/80 px-5 py-4 text-foreground shadow-sm backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Syncing...</span>
                </div>
            </div>
        );
    }

    if (syncState?.status === 'error' && syncState.hasCache) {
        return (
            <div className="flex min-h-[50dvh] items-center justify-center px-4 py-10">
                <div className="w-full max-w-xl rounded-xl border border-border/50 bg-surface/80 p-6 text-center shadow-sm backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-foreground">Sync failed but cached data is available.</h2>
                    <div className="mt-5 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-border/60 bg-base px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                        >
                            Use cached data
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-border/60 bg-base px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (syncState?.status === 'error') {
        return (
            <div className="flex min-h-[50dvh] items-center justify-center px-4 py-10">
                <div className="w-full max-w-xl rounded-xl border border-border/50 bg-surface/80 p-6 text-center shadow-sm backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-foreground">Failed to sync.</h2>
                    <div className="mt-5 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-border/60 bg-base px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                        >
                            Retry
                        </button>
                        <Link
                            href="./"
                            className="inline-flex items-center rounded-md border border-border/60 bg-base px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                        >
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[50dvh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl rounded-xl border border-border/50 bg-surface/80 p-6 text-center shadow-sm backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-foreground">This game system is not ready yet.</h2>
                <p className="mt-2 text-sm leading-relaxed text-tertiary">Return to the home page to download it.</p>
                <Link
                    href="/"
                    className="mt-5 inline-flex items-center rounded-md border border-border/60 bg-base px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                    Back to home
                </Link>
            </div>
        </div>
    );
}

SystemAccessGate.displayName = 'SystemAccessGate';

export { SystemAccessGate };
