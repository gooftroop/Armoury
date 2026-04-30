'use client';

/**
 * @requirements
 * 1. Must auto-restore a game system's DataContext when the user navigates directly to a system URL.
 * 2. Must call enableSystem() exactly once per mount when status is idle and no probe sync state exists.
 * 3. Must skip auto-restore when the manager already reports an inflight sync for the system.
 * 4. Must render nothing — side-effect only component.
 * 5. Must not use default exports.
 */

import { useEffect } from 'react';

import { useDataContext } from '@/data/useDataContext.js';
import { resolveGameSystem } from '@/lib/resolveGameSystem.js';
import { SyncStatus } from '@/data/managerState.js';

export interface SystemAutoRestoreProps {
    systemId: string;
}

/**
 * Side-effect-only component that restores the DataContext for a game system.
 *
 * The `status !== 'idle'` guard is sufficient to prevent duplicate calls because
 * `enableSystem()` synchronously transitions `status` from `'idle'` to
 * `'initializing'` before the next render, so subsequent effect runs see a
 * non-idle status and bail out.
 *
 * The inflight-sync guard deduplicates restore attempts across remounts while the
 * manager is already actively syncing the same system.
 */
function SystemAutoRestore({ systemId }: SystemAutoRestoreProps): null {
    const { status, enableSystem, hasInflightSystemSync, systemSyncStates } = useDataContext();
    const syncState = systemSyncStates[systemId];

    useEffect(() => {
        if (status !== 'idle') {
            return;
        }

        if (syncState?.status === SyncStatus.Pending || syncState?.status === SyncStatus.Syncing) {
            return;
        }

        /**
         * Deduplicate restore attempts when the manager is already syncing this
         * system from a previous mount or concurrent path.
         */
        if (hasInflightSystemSync(systemId)) {
            console.debug(`Skipping auto-restore for ${systemId}: sync already inflight`);

            return;
        }

        void resolveGameSystem(systemId).then((system) => {
            if (system) {
                void enableSystem(system);
            }
        });
    }, [status, systemId, enableSystem, hasInflightSystemSync, syncState?.status]);

    return null;
}

SystemAutoRestore.displayName = 'SystemAutoRestore';

export { SystemAutoRestore };
