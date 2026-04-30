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
        /** E2E test bridge install. Triggered by 'window.__ARMOURY_E2E__' flag set via Playwright fixture (see src/web/e2e/fixtures/e2eBridge.ts). Production builds NEVER set this flag. */
        if (typeof window !== 'undefined' && (window as { __ARMOURY_E2E__?: boolean }).__ARMOURY_E2E__ === true) {
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
