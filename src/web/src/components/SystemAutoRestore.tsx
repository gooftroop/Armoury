'use client';

/**
 * @requirements
 * 1. Must auto-restore a game system's DataContext when the user navigates directly to a system URL.
 * 2. Must call enableSystem() exactly once per mount when status is idle.
 * 3. Must render nothing — side-effect only component.
 * 4. Must not use default exports.
 */

import { useEffect } from 'react';

import { useDataContext } from '@/providers/DataContextProvider.js';
import { resolveGameSystem } from '@/lib/resolveGameSystem.js';

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
 */
function SystemAutoRestore({ systemId }: SystemAutoRestoreProps): null {
    const { status, enableSystem } = useDataContext();

    useEffect(() => {
        if (status !== 'idle') {
            return;
        }

        void resolveGameSystem(systemId).then((system) => {
            if (system) {
                void enableSystem(system);
            }
        });
    }, [status, systemId, enableSystem]);

    return null;
}

SystemAutoRestore.displayName = 'SystemAutoRestore';

export { SystemAutoRestore };
