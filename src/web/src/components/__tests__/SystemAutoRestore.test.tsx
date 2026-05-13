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
 *
 * Requirement 3: skip when manager status has advanced past idle
 *   - Test: does not call enableSystem when status is 'ready'
 *
 * Requirement 4: skip when syncState reports Pending or Syncing for the system
 *   - Test: does not call enableSystem when syncState.status is Pending
 *   - Test: does not call enableSystem when syncState.status is Syncing
 *
 * Requirement 5: do not call enableSystem when resolveGameSystem returns null
 *   - Test: skips enableSystem when game system cannot be resolved
 *
 * Requirement 6: do not call enableSystem after the component unmounts
 *   - Test: cancellation guard prevents enableSystem when unmounted before resolveGameSystem resolves
 */

vi.mock('@armoury/feature-game-system', () => ({
    resolveGameSystem: vi.fn(),
}));

const { resolveGameSystem } = await import('@armoury/feature-game-system');

type ManagerStateSnapshot = {
    activeSystemId: string | null;
    error?: string;
    status: 'idle' | 'initializing' | 'ready' | 'error';
    systemSyncStates: Record<string, unknown>;
};

function createManagerMock(options: {
    inflight: boolean;
    status?: ManagerStateSnapshot['status'];
    systemSyncStates?: Record<string, unknown>;
}): DataContextManager {
    const inflightIds = new Set<string>(options.inflight ? ['sys-1'] : []);
    const state$ = new BehaviorSubject<ManagerStateSnapshot>({
        activeSystemId: null,
        status: options.status ?? 'idle',
        error: undefined,
        systemSyncStates: options.systemSyncStates ?? {},
    });
    const activeDataContext$ = new BehaviorSubject<DataContext | null>(null);
    const syncProgress$ = new BehaviorSubject<SyncProgressCollector | null>(null);

    return {
        state: () => state$.asObservable(),
        getSnapshot: () => state$.value,
        selectActiveDataContext: () => activeDataContext$.asObservable(),
        getActiveDataContextSnapshot: () => activeDataContext$.value,
        selectSyncProgress: () => syncProgress$.asObservable(),
        getSyncProgressSnapshot: () => syncProgress$.value,
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

    it('skips enableSystem when manager status has advanced past idle', async () => {
        const manager = createManagerMock({ inflight: false, status: 'ready' });
        const enableSystem = manager.enableSystem as ReturnType<typeof vi.fn>;
        vi.mocked(resolveGameSystem).mockResolvedValue({ id: 'sys-1' } as unknown as GameSystem);

        render(
            <ManagerContext.Provider value={manager}>
                <SystemAutoRestore systemId="sys-1" />
            </ManagerContext.Provider>,
        );

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(enableSystem).not.toHaveBeenCalled();
    });

    it('skips enableSystem when syncState reports Pending', async () => {
        const manager = createManagerMock({
            inflight: false,
            systemSyncStates: { 'sys-1': { systemId: 'sys-1', status: 'pending', hasCache: false, attempts: 0 } },
        });
        const enableSystem = manager.enableSystem as ReturnType<typeof vi.fn>;
        vi.mocked(resolveGameSystem).mockResolvedValue({ id: 'sys-1' } as unknown as GameSystem);

        render(
            <ManagerContext.Provider value={manager}>
                <SystemAutoRestore systemId="sys-1" />
            </ManagerContext.Provider>,
        );

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(enableSystem).not.toHaveBeenCalled();
    });

    it('skips enableSystem when syncState reports Syncing', async () => {
        const manager = createManagerMock({
            inflight: false,
            systemSyncStates: { 'sys-1': { systemId: 'sys-1', status: 'syncing', hasCache: false, attempts: 0 } },
        });
        const enableSystem = manager.enableSystem as ReturnType<typeof vi.fn>;
        vi.mocked(resolveGameSystem).mockResolvedValue({ id: 'sys-1' } as unknown as GameSystem);

        render(
            <ManagerContext.Provider value={manager}>
                <SystemAutoRestore systemId="sys-1" />
            </ManagerContext.Provider>,
        );

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(enableSystem).not.toHaveBeenCalled();
    });

    it('skips enableSystem when resolveGameSystem returns null', async () => {
        const manager = createManagerMock({ inflight: false });
        const enableSystem = manager.enableSystem as ReturnType<typeof vi.fn>;
        vi.mocked(resolveGameSystem).mockResolvedValue(null as unknown as GameSystem);

        render(
            <ManagerContext.Provider value={manager}>
                <SystemAutoRestore systemId="sys-1" />
            </ManagerContext.Provider>,
        );

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(enableSystem).not.toHaveBeenCalled();
    });

    it('does not call enableSystem after unmount when resolveGameSystem resolves later', async () => {
        const manager = createManagerMock({ inflight: false });
        const enableSystem = manager.enableSystem as ReturnType<typeof vi.fn>;

        let resolveLater!: (value: GameSystem) => void;
        vi.mocked(resolveGameSystem).mockReturnValue(
            new Promise<GameSystem>((resolve) => {
                resolveLater = resolve;
            }),
        );

        const { unmount } = render(
            <ManagerContext.Provider value={manager}>
                <SystemAutoRestore systemId="sys-1" />
            </ManagerContext.Provider>,
        );

        unmount();
        resolveLater({ id: 'sys-1' } as unknown as GameSystem);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(enableSystem).not.toHaveBeenCalled();
    });
});
