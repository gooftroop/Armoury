'use client';

/**
 * @requirements
 * 1. Must auto-restore a game system's DataContext when the user navigates directly to a system URL.
 * 2. Must call enableSystem() exactly once per mount when status is idle.
 * 3. Must render nothing — side-effect only component.
 * 4. Must not use default exports.
 */

import * as React from 'react';

import { useDataContext } from '@/providers/DataContextProvider.js';
import { resolveGameSystem } from '@/lib/resolveGameSystem.js';

export interface SystemAutoRestoreProps {
    systemId: string;
}

function SystemAutoRestore({ systemId }: SystemAutoRestoreProps): null {
    const { status, enableSystem } = useDataContext();
    const attemptedRef = React.useRef(false);

    React.useEffect(() => {
        if (status !== 'idle' || attemptedRef.current) {
            return;
        }

        attemptedRef.current = true;

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
