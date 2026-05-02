/**
 * React bridge tests for DataContextManager (provider, selector hooks, legacy hook).
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-MGR-PR-001 | Provider creates exactly one DataContextManager per mount. | T1 |
 * | REQ-WEB-MGR-PR-002 | Provider disposes manager on unmount. | T2 |
 * | REQ-WEB-MGR-BR-001 | Hooks throw when used outside the provider. | T3 |
 * | REQ-WEB-MGR-BR-002 | useManagerSelector subscribes to state stream and re-renders on change. | T4 |
 * | REQ-WEB-MGR-BR-003 | useManagerSelector skips re-render when selected slice is equal. | T5 |
 * | REQ-WEB-MGR-BR-004 | useActiveDataContext reads activeDataContext$ stream and ignores sync state churn. | T6 |
 * | REQ-WEB-MGR-BR-005 | useSyncProgressCollector reads progress$ stream. | T7 |
 * | REQ-WEB-MGR-BR-006 | useSystemSyncState returns the slice for the requested id. | T8 |
 * | REQ-WEB-MGR-LH-001 | useDataContext returns legacy-shaped DataContextValue. | T9 |
 * | REQ-WEB-MGR-LH-002 | useDataContext.enableSystem / disableSystem delegate to manager. | T10 |
 */

import { act, render, renderHook } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { DataContext } from '@armoury/data-context';
import { SyncProgressCollector } from '@armoury/data-dao';
import type { GameSystem } from '@armoury/data-dao';

import { initialManagerState, SyncStatus, type ManagerState, type SystemSyncState } from '../managerState.js';

const { managerInstances, ManagerCtor } = vi.hoisted(() => {
    const instances: unknown[] = [];

    return {
        managerInstances: instances,
        ManagerCtor: vi.fn().mockImplementation(function MockedManagerImpl() {
            const state$ = new BehaviorSubject<ManagerState>(initialManagerState);
            const active$ = new BehaviorSubject<DataContext | null>(null);
            const progress$ = new BehaviorSubject<SyncProgressCollector | null>(null);

            const dispose = vi.fn(async () => undefined);
            const enableSystem = vi.fn(async () => undefined);
            const disableSystem = vi.fn(async () => undefined);
            const hasInflightSystemSync = vi.fn(() => false);

            const instance = {
                state: () => state$.asObservable(),
                getSnapshot: () => state$.value,
                selectActiveDataContext: () => active$.asObservable(),
                getActiveDataContextSnapshot: () => active$.value,
                selectSyncProgress: () => progress$.asObservable(),
                getSyncProgressSnapshot: () => progress$.value,
                hasInflightSystemSync,
                enableSystem,
                disableSystem,
                dispose,
                __state$: state$,
                __active$: active$,
                __progress$: progress$,
            };

            instances.push(instance);

            return instance;
        }),
    };
});

vi.mock('../DataContextManager.js', () => ({
    DataContextManager: ManagerCtor,
}));

interface MockManager {
    hasInflightSystemSync: ReturnType<typeof vi.fn>;
    enableSystem: ReturnType<typeof vi.fn>;
    disableSystem: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    __state$: BehaviorSubject<ManagerState>;
    __active$: BehaviorSubject<DataContext | null>;
    __progress$: BehaviorSubject<SyncProgressCollector | null>;
}

function lastManager(): MockManager {
    const instance = managerInstances[managerInstances.length - 1];

    if (!instance) {
        throw new Error('No manager instance has been constructed yet.');
    }

    return instance as MockManager;
}

beforeEach(() => {
    managerInstances.length = 0;
    ManagerCtor.mockClear();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('DataContextManagerProvider', () => {
    it('T1 constructs exactly one manager instance per mount', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');

        const { rerender } = render(
            <DataContextManagerProvider>
                <span>child</span>
            </DataContextManagerProvider>,
        );

        rerender(
            <DataContextManagerProvider>
                <span>child2</span>
            </DataContextManagerProvider>,
        );

        expect(ManagerCtor).toHaveBeenCalledTimes(1);
    });

    it('T2 disposes manager on unmount', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');

        const { unmount } = render(
            <DataContextManagerProvider>
                <span>child</span>
            </DataContextManagerProvider>,
        );

        const manager = lastManager();
        unmount();

        expect(manager.dispose).toHaveBeenCalledTimes(1);
    });
});

describe('bridge hooks', () => {
    it('T3 hooks throw when used outside the provider', async () => {
        const { useDataContextManager } = await import('../managerBridge.js');

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => renderHook(() => useDataContextManager())).toThrow(
            /must be used within a DataContextManagerProvider/,
        );

        consoleError.mockRestore();
    });

    it('T4 useManagerSelector re-renders when selected slice changes', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');
        const { useManagerSelector } = await import('../managerBridge.js');

        const wrapper = ({ children }: { children: ReactNode }) => (
            <DataContextManagerProvider>{children}</DataContextManagerProvider>
        );

        const { result } = renderHook(() => useManagerSelector((s) => s.activeSystemId), { wrapper });

        expect(result.current).toBeNull();

        const manager = lastManager();

        act(() => {
            manager.__state$.next({ ...manager.__state$.value, activeSystemId: 'wh40k10e' });
        });

        expect(result.current).toBe('wh40k10e');
    });

    it('T5 useManagerSelector skips re-render when slice value is equal', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');
        const { useManagerSelector } = await import('../managerBridge.js');

        const wrapper = ({ children }: { children: ReactNode }) => (
            <DataContextManagerProvider>{children}</DataContextManagerProvider>
        );

        const renders = vi.fn();
        const { result } = renderHook(
            () => {
                renders();

                return useManagerSelector((s) => s.activeSystemId);
            },
            { wrapper },
        );

        const initialRenders = renders.mock.calls.length;
        const manager = lastManager();

        act(() => {
            manager.__state$.next({ ...manager.__state$.value, status: 'initializing' });
        });

        expect(result.current).toBeNull();
        expect(renders.mock.calls.length).toBe(initialRenders);
    });

    it('T6 useActiveDataContext ignores sync state churn and follows activeDataContext$', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');
        const { useActiveDataContext } = await import('../managerBridge.js');

        const wrapper = ({ children }: { children: ReactNode }) => (
            <DataContextManagerProvider>{children}</DataContextManagerProvider>
        );

        const renders = vi.fn();
        const { result } = renderHook(
            () => {
                renders();

                return useActiveDataContext();
            },
            { wrapper },
        );

        expect(result.current).toBeNull();

        const manager = lastManager();
        const baseRenders = renders.mock.calls.length;

        act(() => {
            const nextSystemState: SystemSyncState = {
                systemId: 'wh40k10e',
                status: SyncStatus.Syncing,
                hasCache: false,
                attempts: 0,
            };

            manager.__state$.next({
                ...manager.__state$.value,
                systemSyncStates: { wh40k10e: nextSystemState },
            });
        });

        expect(renders.mock.calls.length).toBe(baseRenders);

        const fakeDataContext = { id: 'dc-1' } as unknown as DataContext;

        act(() => {
            manager.__active$.next(fakeDataContext);
        });

        expect(result.current).toBe(fakeDataContext);
    });

    it('T7 useSyncProgressCollector emits progress collector updates', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');
        const { useSyncProgressCollector } = await import('../managerBridge.js');

        const wrapper = ({ children }: { children: ReactNode }) => (
            <DataContextManagerProvider>{children}</DataContextManagerProvider>
        );

        const { result } = renderHook(() => useSyncProgressCollector(), { wrapper });
        const manager = lastManager();
        const collector = { id: 'c1' } as unknown as SyncProgressCollector;

        act(() => {
            manager.__progress$.next(collector);
        });

        expect(result.current).toBe(collector);
    });

    it('T8 useSystemSyncState returns the slice for the requested id only', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');
        const { useSystemSyncState } = await import('../managerBridge.js');

        const wrapper = ({ children }: { children: ReactNode }) => (
            <DataContextManagerProvider>{children}</DataContextManagerProvider>
        );

        const { result } = renderHook(() => useSystemSyncState('wh40k10e'), { wrapper });

        expect(result.current).toBeUndefined();

        const manager = lastManager();
        const targetState: SystemSyncState = {
            systemId: 'wh40k10e',
            status: SyncStatus.Pending,
            hasCache: false,
            attempts: 0,
        };

        act(() => {
            manager.__state$.next({
                ...manager.__state$.value,
                systemSyncStates: { wh40k10e: targetState },
            });
        });

        expect(result.current).toEqual(targetState);
    });
});

describe('useDataContext (legacy compatibility)', () => {
    it('T9 returns legacy-shaped DataContextValue', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');
        const { useDataContext } = await import('../useDataContext.js');

        const wrapper = ({ children }: { children: ReactNode }) => (
            <DataContextManagerProvider>{children}</DataContextManagerProvider>
        );

        const { result } = renderHook(() => useDataContext(), { wrapper });

        expect(result.current).toMatchObject({
            dataContext: null,
            status: 'idle',
            error: undefined,
            systemSyncStates: {},
            syncProgressCollector: expect.any(SyncProgressCollector),
        });
        expect(typeof result.current.enableSystem).toBe('function');
        expect(typeof result.current.disableSystem).toBe('function');
        expect(typeof result.current.hasInflightSystemSync).toBe('function');

        const manager = lastManager();
        const targetState: SystemSyncState = {
            systemId: 'wh40k10e',
            status: SyncStatus.Pending,
            hasCache: true,
            attempts: 0,
        };

        act(() => {
            manager.__state$.next({
                ...manager.__state$.value,
                status: 'ready',
                systemSyncStates: { wh40k10e: targetState },
            });
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.systemSyncStates['wh40k10e']).toEqual({
            status: SyncStatus.Pending,
            error: undefined,
            hasCache: true,
        });
    });

    it('T10 enableSystem / disableSystem delegate to manager', async () => {
        const { DataContextManagerProvider } = await import('../managerContext.js');
        const { useDataContext } = await import('../useDataContext.js');

        const wrapper = ({ children }: { children: ReactNode }) => (
            <DataContextManagerProvider>{children}</DataContextManagerProvider>
        );

        const { result } = renderHook(() => useDataContext(), { wrapper });
        const manager = lastManager();

        const system = { id: 'wh40k10e' } as unknown as GameSystem;

        await act(async () => {
            await result.current.enableSystem(system);
        });

        expect(manager.enableSystem).toHaveBeenCalledWith(system);
        expect(result.current.hasInflightSystemSync('wh40k10e')).toBe(false);

        await act(async () => {
            await result.current.disableSystem('wh40k10e');
        });

        expect(manager.disableSystem).toHaveBeenCalledWith('wh40k10e');
    });
});
