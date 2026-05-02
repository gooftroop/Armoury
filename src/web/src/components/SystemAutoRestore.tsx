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
 * De-duplication relies on three layered checks because `enableSystem()` is
 * async and awaits adapter/context initialization before patching manager
 * state — there is no synchronous status transition to rely on:
 *   1. `status !== 'idle'` skips when the manager has already advanced past
 *      idle (i.e. a prior enable has completed initialization).
 *   2. `syncState.status` of `Pending` or `Syncing` skips when a sync for this
 *      specific system is already queued or in flight per the manager's state.
 *   3. `hasInflightSystemSync(systemId)` skips when the manager's internal
 *      inflight set still tracks an active runSyncJob for this system, even if
 *      `syncState` has not yet been patched. This catches the race window
 *      between job start and the first state patch.
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
