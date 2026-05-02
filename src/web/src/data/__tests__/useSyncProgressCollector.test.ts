/**
 * useSyncProgressCollector hook tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-MGR-C4-001 | Hook must return a stable non-null collector before manager emits. | T1 |
 * | REQ-WEB-MGR-C4-002 | Hook must not enter a render loop when progress stream emits null snapshots. | T2 |
 */

import { createElement, type ReactNode, useRef } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SyncProgressCollector } from '@armoury/data-dao';

import { ManagerContext, useSyncProgressCollector } from '@/data/managerBridge.js';
import type { DataContextManager } from '@/data/DataContextManager.js';
import { createTestManager } from '@/data/__testing__/createTestManager.js';

/** Wraps a hook with a ManagerContext provider backed by a test manager. */
function createManagerWrapper(manager: DataContextManager): ({ children }: { children: ReactNode }) => ReactNode {
    return function Wrapper({ children }: { children: ReactNode }): ReactNode {
        return createElement(ManagerContext.Provider, { value: manager }, children);
    };
}

describe('useSyncProgressCollector', () => {
    it('T1: returns stable empty collector before manager emits', () => {
        const manager = createTestManager({
            selectSyncProgress: () => of(null),
            getSyncProgressSnapshot: () => null,
        });

        const { result } = renderHook(() => useSyncProgressCollector(), {
            wrapper: createManagerWrapper(manager),
        });

        const first = result.current;
        const second = result.current;

        expect(first).not.toBeNull();
        expect(first).toBeInstanceOf(SyncProgressCollector);
        expect(first).toBe(second);
    });

    it('T2: no infinite re-render', async () => {
        const manager = createTestManager({
            selectSyncProgress: () => of(null),
            getSyncProgressSnapshot: () => null,
        });

        const { result } = renderHook(
            () => {
                const renderCountRef = useRef(0);
                renderCountRef.current += 1;
                const collector = useSyncProgressCollector();

                return { collector, renderCount: renderCountRef.current };
            },
            {
                wrapper: createManagerWrapper(manager),
            },
        );

        await waitFor(() => {
            expect(result.current.collector).toBeInstanceOf(SyncProgressCollector);
            expect(result.current.renderCount).toBeLessThan(5);
        });
    });
});
