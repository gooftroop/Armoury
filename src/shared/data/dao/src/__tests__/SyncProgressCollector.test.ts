import { describe, it, expect, vi } from 'vitest';
import { SyncProgressCollector } from '@/services/SyncProgressCollector.js';
import type { OnProgressCallback } from '@/types/sync-progress.js';

describe('SyncProgressCollector', () => {
    const TOTAL = 40;

    function createCollector(total = TOTAL): SyncProgressCollector {
        return new SyncProgressCollector(total);
    }

    describe('constructor + getState()', () => {
        it('initialises with idle phase, zero counts, and provided total', () => {
            const collector = createCollector();
            const state = collector.getState();

            expect(state).toStrictEqual({
                phase: 'idle',
                completed: 0,
                total: TOTAL,
                failures: 0,
                message: '',
            });
        });

        it('accepts total of 0 without error', () => {
            const collector = createCollector(0);
            expect(collector.getState().total).toBe(0);
        });
    });

    describe('setPhase()', () => {
        it('transitions phase and updates message', () => {
            const collector = createCollector();

            collector.setPhase('loading');
            expect(collector.getState().phase).toBe('loading');
            expect(collector.getState().message).toBe('Loading...');

            collector.setPhase('initializing');
            expect(collector.getState().phase).toBe('initializing');
            expect(collector.getState().message).toBe('Initializing...');

            collector.setPhase('syncing');
            expect(collector.getState().phase).toBe('syncing');
            expect(collector.getState().message).toBe('Syncing 0/40');

            collector.setPhase('complete');
            expect(collector.getState().phase).toBe('complete');
            expect(collector.getState().message).toBe('Complete');

            collector.setPhase('error');
            expect(collector.getState().phase).toBe('error');
            expect(collector.getState().message).toBe('Error');
        });

        it('notifies subscribers on phase change', () => {
            const collector = createCollector();
            const callback = vi.fn<OnProgressCallback>();
            collector.subscribe(callback);

            collector.setPhase('loading');

            expect(callback).toHaveBeenCalledOnce();
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({ phase: 'loading' }));
        });
    });

    describe('reportCompletion()', () => {
        it('increments completed count and notifies', () => {
            const collector = createCollector(3);
            const callback = vi.fn<OnProgressCallback>();
            collector.subscribe(callback);

            collector.setPhase('syncing');
            callback.mockClear();

            collector.reportCompletion('CoreRules');

            expect(collector.getState().completed).toBe(1);
            expect(callback).toHaveBeenCalledOnce();
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({ completed: 1, total: 3 }));
        });

        it('updates syncing message with current count', () => {
            const collector = createCollector(5);
            collector.setPhase('syncing');

            collector.reportCompletion('A');
            collector.reportCompletion('B');

            expect(collector.getState().message).toBe('Syncing 2/5');
        });

        it('does not double-count the same DAO name', () => {
            const collector = createCollector(5);
            collector.setPhase('syncing');

            collector.reportCompletion('CoreRules');
            collector.reportCompletion('CoreRules');

            expect(collector.getState().completed).toBe(1);
        });
    });

    describe('reportFailure()', () => {
        it('increments failures count and notifies', () => {
            const collector = createCollector(3);
            const callback = vi.fn<OnProgressCallback>();
            collector.subscribe(callback);

            collector.setPhase('syncing');
            callback.mockClear();

            collector.reportFailure('Necrons', new Error('fetch failed'));

            expect(collector.getState().failures).toBe(1);
            expect(callback).toHaveBeenCalledOnce();
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({ failures: 1 }));
        });

        it('counts towards completed total (failure is still done)', () => {
            const collector = createCollector(3);
            collector.setPhase('syncing');

            collector.reportFailure('A', new Error('fail'));
            collector.reportCompletion('B');

            expect(collector.getState().completed).toBe(2);
            expect(collector.getState().failures).toBe(1);
        });

        it('does not double-count the same DAO name', () => {
            const collector = createCollector(5);
            collector.setPhase('syncing');

            collector.reportFailure('A', new Error('fail'));
            collector.reportFailure('A', new Error('fail again'));

            expect(collector.getState().completed).toBe(1);
            expect(collector.getState().failures).toBe(1);
        });
    });

    describe('mixed completion + failure', () => {
        it('tracks correct counts across interleaved calls', () => {
            const collector = createCollector(5);
            collector.setPhase('syncing');

            collector.reportCompletion('A');
            collector.reportFailure('B', new Error('oops'));
            collector.reportCompletion('C');
            collector.reportCompletion('D');
            collector.reportFailure('E', new Error('nope'));

            const state = collector.getState();
            expect(state.completed).toBe(5);
            expect(state.failures).toBe(2);
            expect(state.message).toBe('Syncing 5/5');
        });
    });

    describe('subscribe() / unsubscribe', () => {
        it('returns an unsubscribe function that stops notifications', () => {
            const collector = createCollector();
            const callback = vi.fn<OnProgressCallback>();
            const unsubscribe = collector.subscribe(callback);

            collector.setPhase('loading');
            expect(callback).toHaveBeenCalledOnce();

            unsubscribe();
            collector.setPhase('syncing');
            expect(callback).toHaveBeenCalledOnce();
        });

        it('supports multiple concurrent subscribers', () => {
            const collector = createCollector();
            const cb1 = vi.fn<OnProgressCallback>();
            const cb2 = vi.fn<OnProgressCallback>();
            collector.subscribe(cb1);
            collector.subscribe(cb2);

            collector.setPhase('loading');

            expect(cb1).toHaveBeenCalledOnce();
            expect(cb2).toHaveBeenCalledOnce();
        });

        it('unsubscribing one does not affect others', () => {
            const collector = createCollector();
            const cb1 = vi.fn<OnProgressCallback>();
            const cb2 = vi.fn<OnProgressCallback>();
            collector.subscribe(cb1);
            const unsub2 = collector.subscribe(cb2);

            unsub2();
            collector.setPhase('loading');

            expect(cb1).toHaveBeenCalledOnce();
            expect(cb2).not.toHaveBeenCalled();
        });
    });

    describe('reset()', () => {
        it('restores initial state and notifies subscribers', () => {
            const collector = createCollector(10);
            collector.setPhase('syncing');
            collector.reportCompletion('A');
            collector.reportFailure('B', new Error('fail'));

            const callback = vi.fn<OnProgressCallback>();
            collector.subscribe(callback);

            collector.reset();

            const state = collector.getState();
            expect(state).toStrictEqual({
                phase: 'idle',
                completed: 0,
                total: 10,
                failures: 0,
                message: '',
            });
            expect(callback).toHaveBeenCalledWith(state);
        });

        it('clears DAO tracking so names can be re-reported', () => {
            const collector = createCollector(5);
            collector.setPhase('syncing');
            collector.reportCompletion('A');

            collector.reset();
            collector.setPhase('syncing');
            collector.reportCompletion('A');

            expect(collector.getState().completed).toBe(1);
        });
    });

    describe('getState() immutability', () => {
        it('returns a new object each call (snapshot, not reference)', () => {
            const collector = createCollector();
            const s1 = collector.getState();
            const s2 = collector.getState();

            expect(s1).toStrictEqual(s2);
            expect(s1).not.toBe(s2);
        });
    });
});
