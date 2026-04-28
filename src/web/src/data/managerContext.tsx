'use client';

import { useEffect, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { DataContextManager } from '@/data/DataContextManager.js';
import { ManagerContext } from '@/data/managerBridge.js';

/**
 * @requirements
 * - REQ-WEB-MGR-PR-001: Provider creates exactly one DataContextManager per mount via lazy useState init.
 * - REQ-WEB-MGR-PR-002: Provider disposes the manager on unmount (closes adapter and completes streams).
 * - REQ-WEB-MGR-PR-003: No module-scope manager singleton — instance lifetime is bound to the React tree.
 */

export interface DataContextManagerProviderProps {
    /** Children that consume the manager via bridge hooks. */
    children: ReactNode;
}

/** Mounts a DataContextManager and exposes it through ManagerContext. */
export function DataContextManagerProvider({ children }: DataContextManagerProviderProps): ReactElement {
    const [manager] = useState(() => new DataContextManager());

    useEffect(() => {
        if (process.env.NODE_ENV === 'test') {
            void import('./__testing__/e2eManager.js').then(({ installE2EBridge }) => {
                installE2EBridge(manager);
            });
        }

        return () => {
            void manager.dispose();
        };
    }, [manager]);

    return <ManagerContext.Provider value={manager}>{children}</ManagerContext.Provider>;
}
