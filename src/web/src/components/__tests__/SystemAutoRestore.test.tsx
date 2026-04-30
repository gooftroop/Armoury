import { BehaviorSubject } from 'rxjs';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataContext } from '@armoury/data-context';
import type { GameSystem, SyncProgressCollector } from '@armoury/data-dao';

import { SystemAutoRestore } from '../SystemAutoRestore.js';
import { ManagerContext } from '@/data/managerBridge.js';
import type { DataContextManager } from '@/data/DataContextManager.js';

/**
 * Test Plan for SystemAutoRestore
 *
 * Requirement 1: skip auto-restore when sync is already inflight
 *   - Test: does not call enableSystem when the manager reports inflight sync for the system
 *
 * Requirement 2: restore when no sync is inflight
 *   - Test: calls enableSystem exactly once when the manager reports no inflight sync
 */

vi.mock('@/lib/resolveGameSystem.js', () => ({
    resolveGameSystem: vi.fn(),
}));

const { resolveGameSystem } = await import('@/lib/resolveGameSystem.js');

type ManagerStateSnapshot = {
    activeSystemId: string | null;
    error?: string;
    status: 'idle' | 'initializing' | 'ready' | 'error';
    systemSyncStates: Record<string, unknown>;
};

function createManagerMock(options: { inflight: boolean }): DataContextManager {
    const inflightIds = new Set<string>(options.inflight ? ['sys-1'] : []);
    const state$ = new BehaviorSubject<ManagerStateSnapshot>({
        activeSystemId: null,
        status: 'idle',
        error: undefined,
        systemSyncStates: {},
    });
    const activeDataContext$ = new BehaviorSubject<DataContext | null>(null);
    const syncProgress$ = new BehaviorSubject<SyncProgressCollector | null>(null);

    return {
        state: () => state$.asObservable(),
        getSnapshot: () => state$.value,
        selectActiveDataContext: () => activeDataContext$.asObservable(),
        getActiveDataContextSnapshot: () => activeDataContext$.value,
        selectSyncProgress: () => syncProgress$.asObservable(),
        selectSystem: vi.fn(),
        selectLastSyncResult: vi.fn(),
        getLastSyncResultSnapshot: vi.fn(),
        hasInflightSystemSync: vi.fn((systemId: string) => inflightIds.has(systemId)),
        enableSystem: vi.fn(async (system: { id: string }) => {
            inflightIds.add(system.id);
        }),
        disableSystem: vi.fn(),
        setActiveSystem: vi.fn(),
        probeSyncedSystems: vi.fn(),
        rawQuery: vi.fn(),
        dispose: vi.fn(),
    } as unknown as DataContextManager;
}

describe('SystemAutoRestore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('skips enableSystem when sync already inflight', async () => {
        const manager = createManagerMock({ inflight: true });
        const enableSystem = manager.enableSystem as ReturnType<typeof vi.fn>;
        vi.mocked(resolveGameSystem).mockResolvedValue({ id: 'sys-1' } as unknown as GameSystem);

        render(
            <ManagerContext.Provider value={manager}>
                <SystemAutoRestore systemId="sys-1" />
            </ManagerContext.Provider>,
        );

        await waitFor(() => {
            expect(enableSystem).not.toHaveBeenCalled();
        });
    });

    it('calls enableSystem once when no sync inflight', async () => {
        const manager = createManagerMock({ inflight: false });
        const enableSystem = manager.enableSystem as ReturnType<typeof vi.fn>;
        vi.mocked(resolveGameSystem).mockResolvedValue({ id: 'sys-1' } as unknown as GameSystem);

        render(
            <ManagerContext.Provider value={manager}>
                <SystemAutoRestore systemId="sys-1" />
            </ManagerContext.Provider>,
        );

        await waitFor(() => {
            expect(enableSystem).toHaveBeenCalledTimes(1);
        });
    });
});
