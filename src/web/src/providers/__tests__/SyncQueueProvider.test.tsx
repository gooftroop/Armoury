/**
 * SyncQueueProvider tests (web).
 *
 * @requirements
 * - REQ-WEB-SQP-01: useSyncQueue throws when called outside SyncQueueProvider.
 * - REQ-WEB-SQP-02: Provider initializes with idle queue state.
 * - REQ-WEB-SQP-03: Queue processes enqueued systems in strict FIFO order.
 * - REQ-WEB-SQP-04: Queue executes at most one active sync at a time.
 * - REQ-WEB-SQP-05: enqueue is idempotent for duplicate system IDs.
 * - REQ-WEB-SQP-06: Queue recovers after sync errors and continues processing.
 * - REQ-WEB-SQP-07: pending state tracks waiting systems excluding active.
 * - REQ-WEB-SQP-08: Queue drains back to idle after all work completes.
 */

import { createElement, useEffect } from 'react';
import type { ReactElement } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SyncQueueValue } from '../SyncQueueProvider.js';
import { SyncQueueProvider, useSyncQueue } from '../SyncQueueProvider.js';

/**
 * Test plan:
 * - REQ-WEB-SQP-01 -> "throws when useSyncQueue is called outside provider"
 * - REQ-WEB-SQP-02 -> "starts with empty pending, null active, and isProcessing false"
 * - REQ-WEB-SQP-03 -> "processes systems in FIFO active transition order"
 * - REQ-WEB-SQP-04 -> "runs only one active sync function at a time"
 * - REQ-WEB-SQP-05 -> "deduplicates duplicate enqueue and resolves second call immediately"
 * - REQ-WEB-SQP-06 -> "rejects failed operation and continues with next queued item"
 * - REQ-WEB-SQP-07 -> "updates pending state as queue advances"
 * - REQ-WEB-SQP-08 -> "returns to idle after queued operations complete"
 */

interface Deferred {
    resolve: () => void;
    reject: (reason?: unknown) => void;
    promise: Promise<void>;
}

interface QueueHarness {
    getValue: () => SyncQueueValue;
    activeHistory: Array<string | null>;
}

interface TestConsumerProps {
    onState: (value: SyncQueueValue) => void;
}

function createDeferred(): Deferred {
    let resolve!: () => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

function TestConsumer({ onState }: TestConsumerProps): ReactElement {
    const value = useSyncQueue();

    useEffect(() => {
        onState(value);
    });

    return createElement('span', null, 'sync-queue-harness');
}

function OutsideConsumer(): ReactElement {
    useSyncQueue();

    return createElement('span', null, 'outside');
}

function renderQueueHarness(): QueueHarness {
    let latestValue: SyncQueueValue | null = null;
    const activeHistory: Array<string | null> = [];

    render(
        createElement(
            SyncQueueProvider,
            null,
            createElement(TestConsumer, {
                onState: (value) => {
                    latestValue = value;
                    activeHistory.push(value.state.active);
                },
            }),
        ),
    );

    return {
        getValue: (): SyncQueueValue => {
            if (latestValue === null) {
                throw new Error('SyncQueueValue has not been initialized yet.');
            }

            return latestValue;
        },
        activeHistory,
    };
}

function compactActiveHistory(history: Array<string | null>): string[] {
    const compacted: string[] = [];

    for (const active of history) {
        if (active === null) {
            continue;
        }

        if (compacted.at(-1) !== active) {
            compacted.push(active);
        }
    }

    return compacted;
}

describe('SyncQueueProvider (web)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('throws when useSyncQueue is called outside provider', () => {
        expect(() => render(createElement(OutsideConsumer))).toThrow(
            'useSyncQueue must be used within a SyncQueueProvider',
        );
    });

    it('starts with empty pending, null active, and isProcessing false', async () => {
        const harness = renderQueueHarness();

        expect(screen.getByText('sync-queue-harness')).toBeInTheDocument();

        await waitFor(() => {
            expect(harness.getValue().state.pending).toStrictEqual([]);
            expect(harness.getValue().state.active).toBeNull();
            expect(harness.getValue().state.isProcessing).toBe(false);
        });
    });

    it('processes systems in FIFO active transition order', async () => {
        const a = createDeferred();
        const b = createDeferred();
        const c = createDeferred();
        const syncA = vi.fn(() => a.promise);
        const syncB = vi.fn(() => b.promise);
        const syncC = vi.fn(() => c.promise);
        const harness = renderQueueHarness();

        let opA!: Promise<void>;
        let opB!: Promise<void>;
        let opC!: Promise<void>;
        await act(async () => {
            const value = harness.getValue();
            opA = value.enqueue('sys-a', syncA);
            opB = value.enqueue('sys-b', syncB);
            opC = value.enqueue('sys-c', syncC);
        });

        await waitFor(() => {
            expect(syncA).toHaveBeenCalledTimes(1);
            expect(syncB).toHaveBeenCalledTimes(0);
            expect(syncC).toHaveBeenCalledTimes(0);
            expect(harness.getValue().state.active).toBe('sys-a');
            expect(harness.getValue().state.pending).toStrictEqual(['sys-b', 'sys-c']);
        });

        await act(async () => {
            a.resolve();
        });

        await waitFor(() => {
            expect(syncB).toHaveBeenCalledTimes(1);
            expect(syncC).toHaveBeenCalledTimes(0);
            expect(harness.getValue().state.active).toBe('sys-b');
            expect(harness.getValue().state.pending).toStrictEqual(['sys-c']);
        });

        await act(async () => {
            b.resolve();
        });

        await waitFor(() => {
            expect(syncC).toHaveBeenCalledTimes(1);
            expect(harness.getValue().state.active).toBe('sys-c');
            expect(harness.getValue().state.pending).toStrictEqual([]);
        });

        await act(async () => {
            c.resolve();
        });

        await expect(opA).resolves.toBeUndefined();
        await expect(opB).resolves.toBeUndefined();
        await expect(opC).resolves.toBeUndefined();

        const transitions = compactActiveHistory(harness.activeHistory);
        expect(transitions).toStrictEqual(['sys-a', 'sys-b', 'sys-c']);
    });

    it('runs only one active sync function at a time', async () => {
        const a = createDeferred();
        const b = createDeferred();
        const syncA = vi.fn(() => a.promise);
        const syncB = vi.fn(() => b.promise);
        const harness = renderQueueHarness();

        await act(async () => {
            const value = harness.getValue();
            void value.enqueue('sys-a', syncA);
            void value.enqueue('sys-b', syncB);
        });

        await waitFor(() => {
            expect(harness.getValue().state.active).toBe('sys-a');
            expect(syncA).toHaveBeenCalledTimes(1);
            expect(syncB).toHaveBeenCalledTimes(0);
        });

        await act(async () => {
            a.resolve();
        });

        await waitFor(() => {
            expect(harness.getValue().state.active).toBe('sys-b');
            expect(syncB).toHaveBeenCalledTimes(1);
        });

        await act(async () => {
            b.resolve();
        });

        await waitFor(() => {
            expect(harness.getValue().state.pending).toStrictEqual([]);
            expect(harness.getValue().state.active).toBeNull();
            expect(harness.getValue().state.isProcessing).toBe(false);
        });
    });

    it('deduplicates duplicate enqueue and resolves second call immediately', async () => {
        const a = createDeferred();
        const syncA = vi.fn(() => a.promise);
        const harness = renderQueueHarness();

        let first!: Promise<void>;
        let duplicate!: Promise<void>;
        await act(async () => {
            const value = harness.getValue();
            first = value.enqueue('sys-a', syncA);
            duplicate = value.enqueue('sys-a', syncA);
        });

        await expect(duplicate).resolves.toBeUndefined();
        expect(syncA).toHaveBeenCalledTimes(1);

        await act(async () => {
            a.resolve();
        });

        await expect(first).resolves.toBeUndefined();
    });

    it('rejects failed operation and continues with next queued item', async () => {
        const error = new Error('sync failed');
        const failingDeferred = createDeferred();
        const succeedingDeferred = createDeferred();
        const syncFail = vi.fn(() => failingDeferred.promise);
        const syncNext = vi.fn(() => succeedingDeferred.promise);
        const harness = renderQueueHarness();

        let failedOperation!: Promise<void>;
        let nextOperation!: Promise<void>;
        await act(async () => {
            const value = harness.getValue();
            failedOperation = value.enqueue('sys-fail', syncFail);
            nextOperation = value.enqueue('sys-next', syncNext);
        });

        const failedAssertion = expect(failedOperation).rejects.toThrow('sync failed');

        await waitFor(() => {
            expect(harness.getValue().state.active).toBe('sys-fail');
        });

        await act(async () => {
            failingDeferred.reject(error);
        });

        await failedAssertion;

        await waitFor(() => {
            expect(syncNext).toHaveBeenCalledTimes(1);
            expect(harness.getValue().state.active).toBe('sys-next');
        });

        await act(async () => {
            succeedingDeferred.resolve();
        });

        await expect(nextOperation).resolves.toBeUndefined();
    });

    it('updates pending state as queue advances', async () => {
        const a = createDeferred();
        const b = createDeferred();
        const c = createDeferred();
        const harness = renderQueueHarness();

        await act(async () => {
            const value = harness.getValue();
            void value.enqueue('sys-a', () => a.promise);
            void value.enqueue('sys-b', () => b.promise);
            void value.enqueue('sys-c', () => c.promise);
        });

        await waitFor(() => {
            expect(harness.getValue().state.active).toBe('sys-a');
            expect(harness.getValue().state.pending).toStrictEqual(['sys-b', 'sys-c']);
        });

        await act(async () => {
            a.resolve();
        });

        await waitFor(() => {
            expect(harness.getValue().state.active).toBe('sys-b');
            expect(harness.getValue().state.pending).toStrictEqual(['sys-c']);
        });

        await act(async () => {
            b.resolve();
        });

        await waitFor(() => {
            expect(harness.getValue().state.active).toBe('sys-c');
            expect(harness.getValue().state.pending).toStrictEqual([]);
        });

        await act(async () => {
            c.resolve();
        });
    });

    it('returns to idle after queued operations complete', async () => {
        const harness = renderQueueHarness();
        const syncA = vi.fn(async () => undefined);
        const syncB = vi.fn(async () => undefined);

        let opA!: Promise<void>;
        let opB!: Promise<void>;
        await act(async () => {
            const value = harness.getValue();
            opA = value.enqueue('sys-a', syncA);
            opB = value.enqueue('sys-b', syncB);
        });

        await expect(opA).resolves.toBeUndefined();
        await expect(opB).resolves.toBeUndefined();

        await waitFor(() => {
            expect(harness.getValue().state.pending).toStrictEqual([]);
            expect(harness.getValue().state.active).toBeNull();
            expect(harness.getValue().state.isProcessing).toBe(false);
        });
    });
});
