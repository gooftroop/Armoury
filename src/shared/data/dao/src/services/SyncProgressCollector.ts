import type { SyncPhase, SyncProgressState, OnProgressCallback } from '@/types/sync-progress.js';

const PHASE_MESSAGES: Record<Exclude<SyncPhase, 'idle' | 'syncing'>, string> = {
    loading: 'Loading...',
    initializing: 'Initializing...',
    complete: 'Complete',
    error: 'Error',
};

export class SyncProgressCollector {
    private readonly total: number;
    private phase: SyncPhase = 'idle';
    private readonly completedDAOs = new Set<string>();
    private readonly failedDAOs = new Set<string>();
    private readonly subscribers = new Set<OnProgressCallback>();

    constructor(total: number) {
        this.total = total;
    }

    setPhase(phase: SyncPhase): void {
        this.phase = phase;
        this.notify();
    }

    reportCompletion(daoName: string): void {
        if (this.completedDAOs.has(daoName) || this.failedDAOs.has(daoName)) {
            return;
        }

        this.completedDAOs.add(daoName);
        this.notify();
    }

    reportFailure(daoName: string, _error: Error): void {
        if (this.completedDAOs.has(daoName) || this.failedDAOs.has(daoName)) {
            return;
        }

        this.failedDAOs.add(daoName);
        this.notify();
    }

    subscribe(callback: OnProgressCallback): () => void {
        this.subscribers.add(callback);

        return () => {
            this.subscribers.delete(callback);
        };
    }

    getState(): SyncProgressState {
        const completed = this.completedDAOs.size + this.failedDAOs.size;

        return {
            phase: this.phase,
            completed,
            total: this.total,
            failures: this.failedDAOs.size,
            message: this.buildMessage(completed),
        };
    }

    reset(): void {
        this.phase = 'idle';
        this.completedDAOs.clear();
        this.failedDAOs.clear();
        this.notify();
    }

    private buildMessage(completed: number): string {
        if (this.phase === 'idle') {
            return '';
        }

        if (this.phase === 'syncing') {
            return `Syncing ${completed}/${this.total}`;
        }

        return PHASE_MESSAGES[this.phase];
    }

    private notify(): void {
        const state = this.getState();

        for (const cb of this.subscribers) {
            cb(state);
        }
    }
}
