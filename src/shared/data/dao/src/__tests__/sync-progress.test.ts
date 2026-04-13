import { describe, it, expect } from 'vitest';
import type { SyncPhase, SyncProgressState, OnProgressCallback } from '@/types/sync-progress.js';

describe('SyncProgress types', () => {
    describe('SyncPhase', () => {
        it('accepts all valid phase values', () => {
            const phases: SyncPhase[] = ['idle', 'loading', 'initializing', 'syncing', 'complete', 'error'];
            expect(phases).toHaveLength(6);
        });

        it('rejects invalid phase values', () => {
            // Type validation: 'invalid' is not a valid SyncPhase
            // @ts-expect-error - testing invalid value
            const invalid: SyncPhase = 'invalid';
            expect(invalid).toBeDefined();
        });
    });

    describe('SyncProgressState', () => {
        it('accepts valid SyncProgressState object', () => {
            const state: SyncProgressState = {
                phase: 'syncing',
                completed: 15,
                total: 40,
                failures: 0,
                message: 'Syncing 15/40',
            };
            expect(state.phase).toBe('syncing');
            expect(state.completed).toBe(15);
            expect(state.total).toBe(40);
            expect(state.failures).toBe(0);
            expect(state.message).toBe('Syncing 15/40');
        });

        it('has all required properties', () => {
            const state: SyncProgressState = {
                phase: 'loading',
                completed: 0,
                total: 40,
                failures: 0,
                message: 'Loading...',
            };
            expect(Object.keys(state)).toContain('phase');
            expect(Object.keys(state)).toContain('completed');
            expect(Object.keys(state)).toContain('total');
            expect(Object.keys(state)).toContain('failures');
            expect(Object.keys(state)).toContain('message');
        });

        it('rejects missing required phase property', () => {
            // @ts-expect-error - missing required phase
            const invalid: SyncProgressState = {
                completed: 15,
                total: 40,
                failures: 0,
                message: 'Syncing 15/40',
            };
            expect(invalid).toBeDefined();
        });

        it('rejects missing required completed property', () => {
            // @ts-expect-error - missing required completed
            const invalid: SyncProgressState = {
                phase: 'syncing',
                total: 40,
                failures: 0,
                message: 'Syncing 15/40',
            };
            expect(invalid).toBeDefined();
        });

        it('rejects missing required total property', () => {
            // @ts-expect-error - missing required total
            const invalid: SyncProgressState = {
                phase: 'syncing',
                completed: 15,
                failures: 0,
                message: 'Syncing 15/40',
            };
            expect(invalid).toBeDefined();
        });

        it('rejects missing required failures property', () => {
            // @ts-expect-error - missing required failures
            const invalid: SyncProgressState = {
                phase: 'syncing',
                completed: 15,
                total: 40,
                message: 'Syncing 15/40',
            };
            expect(invalid).toBeDefined();
        });

        it('rejects missing required message property', () => {
            // @ts-expect-error - missing required message
            const invalid: SyncProgressState = {
                phase: 'syncing',
                completed: 15,
                total: 40,
                failures: 0,
            };
            expect(invalid).toBeDefined();
        });

        it('rejects incorrect type for phase property', () => {
            // Type validation: phase must be SyncPhase, not arbitrary string
            const invalid: SyncProgressState = {
                // @ts-expect-error - phase must be SyncPhase, not string
                phase: 'unknown-phase',
                completed: 15,
                total: 40,
                failures: 0,
                message: 'Syncing 15/40',
            };
            expect(invalid).toBeDefined();
        });

        it('rejects incorrect type for completed property', () => {
            // Type validation: completed must be number, not string
            const invalid: SyncProgressState = {
                phase: 'syncing',
                // @ts-expect-error - completed must be number, not string
                completed: '15',
                total: 40,
                failures: 0,
                message: 'Syncing 15/40',
            };
            expect(invalid).toBeDefined();
        });

        it('rejects incorrect type for message property', () => {
            // Type validation: message must be string, not number
            const invalid: SyncProgressState = {
                phase: 'syncing',
                completed: 15,
                total: 40,
                failures: 0,
                // @ts-expect-error - message must be string, not number
                message: 42,
            };
            expect(invalid).toBeDefined();
        });

        it('accepts all SyncPhase values in phase property', () => {
            const phases: SyncPhase[] = ['idle', 'loading', 'initializing', 'syncing', 'complete', 'error'];

            for (const phase of phases) {
                const state: SyncProgressState = {
                    phase,
                    completed: 0,
                    total: 1,
                    failures: 0,
                    message: `Phase: ${phase}`,
                };
                expect(state.phase).toBe(phase);
            }
        });
    });

    describe('OnProgressCallback', () => {
        it('is callable with SyncProgressState', () => {
            const callback: OnProgressCallback = (state: SyncProgressState) => {
                expect(state.phase).toBeDefined();
                expect(typeof state.completed).toBe('number');
                expect(typeof state.total).toBe('number');
                expect(typeof state.failures).toBe('number');
                expect(typeof state.message).toBe('string');
            };

            const state: SyncProgressState = {
                phase: 'syncing',
                completed: 10,
                total: 40,
                failures: 2,
                message: 'Syncing 10/40',
            };

            callback(state);
        });

        it('accepts function with no return value', () => {
            const callback: OnProgressCallback = (state: SyncProgressState) => {
                void state;
            };

            expect(typeof callback).toBe('function');
        });

        it('accepts function with void return', () => {
            const callback: OnProgressCallback = (state: SyncProgressState): void => {
                void state;
            };

            expect(typeof callback).toBe('function');
        });

        it('rejects function with wrong parameter type', () => {
            // Type validation: parameter must be SyncProgressState
            // @ts-expect-error - parameter must be SyncProgressState
            const invalid: OnProgressCallback = (state: string) => {
                void state;
            };

            expect(invalid).toBeDefined();
        });

        it('can be invoked with any SyncProgressState', () => {
            const results: SyncProgressState[] = [];

            const callback: OnProgressCallback = (state: SyncProgressState) => {
                results.push(state);
            };

            const state1: SyncProgressState = {
                phase: 'loading',
                completed: 0,
                total: 40,
                failures: 0,
                message: 'Loading...',
            };

            const state2: SyncProgressState = {
                phase: 'syncing',
                completed: 20,
                total: 40,
                failures: 1,
                message: 'Syncing 20/40',
            };

            callback(state1);
            callback(state2);

            expect(results).toHaveLength(2);
            expect(results[0].phase).toBe('loading');
            expect(results[1].phase).toBe('syncing');
        });
    });

    describe('Integration', () => {
        it('state and callback work together', () => {
            const states: SyncProgressState[] = [];

            const progressListener: OnProgressCallback = (state: SyncProgressState) => {
                states.push(state);
            };

            const state1: SyncProgressState = {
                phase: 'initializing',
                completed: 0,
                total: 40,
                failures: 0,
                message: 'Initializing...',
            };

            const state2: SyncProgressState = {
                phase: 'syncing',
                completed: 15,
                total: 40,
                failures: 0,
                message: 'Syncing 15/40',
            };

            const state3: SyncProgressState = {
                phase: 'complete',
                completed: 40,
                total: 40,
                failures: 0,
                message: 'Sync complete',
            };

            progressListener(state1);
            progressListener(state2);
            progressListener(state3);

            expect(states).toHaveLength(3);
            expect(states[0].phase).toBe('initializing');
            expect(states[1].phase).toBe('syncing');
            expect(states[2].phase).toBe('complete');
        });
    });
});
