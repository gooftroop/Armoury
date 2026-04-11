/**
 * useSyncProgress hook tests.
 *
 * @requirements
 * - REQ-HOOK-01: Returns idle state when collector is null.
 * - REQ-HOOK-02: Subscribes on mount and reflects collector state changes.
 * - REQ-HOOK-03: Unsubscribes on unmount (no leaked listeners).
 * - REQ-HOOK-04: Re-subscribes when collector reference changes.
 * - REQ-HOOK-05: Syncs initial state from collector on mount (not stale idle).
 * - REQ-HOOK-06: Resets to idle when collector transitions from instance to null.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SyncProgressCollector } from '@armoury/data-dao';

import { useSyncProgress } from '../useSyncProgress.js';

describe('useSyncProgress', () => {
    it('returns idle state when collector is null', () => {
        const { result } = renderHook(() => useSyncProgress(null));

        expect(result.current).toEqual({
            phase: 'idle',
            completed: 0,
            total: 0,
            failures: 0,
            message: '',
        });
    });

    it('subscribes on mount and reflects collector state changes', () => {
        const collector = new SyncProgressCollector(10);

        const { result } = renderHook(() => useSyncProgress(collector));

        expect(result.current.phase).toBe('idle');

        act(() => {
            collector.setPhase('syncing');
        });
        expect(result.current.phase).toBe('syncing');
        expect(result.current.message).toBe('Syncing 0/10');

        act(() => {
            collector.reportCompletion('faction-a');
        });
        expect(result.current.completed).toBe(1);
        expect(result.current.message).toBe('Syncing 1/10');
    });

    it('unsubscribes on unmount (no leaked listeners)', () => {
        const collector = new SyncProgressCollector(5);
        const subscribeSpy = vi.spyOn(collector, 'subscribe');

        const { unmount } = renderHook(() => useSyncProgress(collector));

        expect(subscribeSpy).toHaveBeenCalledTimes(1);

        unmount();

        expect(() => {
            collector.setPhase('syncing');
            collector.reportCompletion('dao-1');
        }).not.toThrow();
    });

    it('re-subscribes when collector reference changes', () => {
        const collectorA = new SyncProgressCollector(10);
        const collectorB = new SyncProgressCollector(20);

        const { result, rerender } = renderHook(({ collector }) => useSyncProgress(collector), {
            initialProps: { collector: collectorA as SyncProgressCollector | null },
        });

        act(() => {
            collectorA.setPhase('syncing');
        });
        expect(result.current.total).toBe(10);

        rerender({ collector: collectorB });

        expect(result.current.total).toBe(20);
        expect(result.current.phase).toBe('idle');

        act(() => {
            collectorB.setPhase('loading');
        });
        expect(result.current.phase).toBe('loading');

        act(() => {
            collectorA.setPhase('complete');
        });
        expect(result.current.phase).toBe('loading');
    });

    it('syncs initial state from collector on mount (not stale idle)', () => {
        const collector = new SyncProgressCollector(40);
        collector.setPhase('syncing');
        collector.reportCompletion('core-rules');
        collector.reportCompletion('core-abilities');

        const { result } = renderHook(() => useSyncProgress(collector));

        expect(result.current.phase).toBe('syncing');
        expect(result.current.completed).toBe(2);
        expect(result.current.total).toBe(40);
        expect(result.current.message).toBe('Syncing 2/40');
    });

    it('resets to idle when collector transitions from instance to null', () => {
        const collector = new SyncProgressCollector(10);

        const { result, rerender } = renderHook(({ collector }) => useSyncProgress(collector), {
            initialProps: { collector: collector as SyncProgressCollector | null },
        });

        act(() => {
            collector.setPhase('syncing');
            collector.reportCompletion('dao-1');
        });
        expect(result.current.phase).toBe('syncing');

        rerender({ collector: null });

        expect(result.current).toEqual({
            phase: 'idle',
            completed: 0,
            total: 0,
            failures: 0,
            message: '',
        });
    });
});
