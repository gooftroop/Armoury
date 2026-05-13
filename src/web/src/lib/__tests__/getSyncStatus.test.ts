/**
 * getSyncStatus unit tests.
 *
 * @requirements
 * - REQ-SYNC-STATUS-01: Returns mapped status for known system IDs.
 * - REQ-SYNC-STATUS-02: Defaults to idle for unknown system IDs.
 *
 * Test plan:
 * | Requirement          | Test case                                    |
 * |----------------------|----------------------------------------------|
 * | REQ-SYNC-STATUS-01   | returns mapped status for a known system ID  |
 * | REQ-SYNC-STATUS-02   | returns idle for an unknown system ID         |
 * | REQ-SYNC-STATUS-02   | returns idle when syncStates is empty         |
 * | REQ-SYNC-STATUS-01   | ignores error field and returns status        |
 */

import { describe, expect, it } from 'vitest';
import { getSyncStatus } from '../getSyncStatus.js';
import { SyncStatus } from '@/data/managerState.js';
import type { SystemSyncStatus } from '@/data/useDataContext.js';

describe('getSyncStatus', () => {
    it('returns mapped status for a known system ID', () => {
        const syncStates: Record<string, { status: SystemSyncStatus; error?: string }> = {
            wh40k10e: { status: SyncStatus.Syncing },
        };

        const result = getSyncStatus('wh40k10e', syncStates);

        expect(result).toBe(SyncStatus.Syncing);
    });

    it('returns idle for an unknown system ID', () => {
        const syncStates: Record<string, { status: SystemSyncStatus; error?: string }> = {
            wh40k10e: { status: SyncStatus.Synced },
        };

        const result = getSyncStatus('unknown', syncStates);

        expect(result).toBe(SyncStatus.Idle);
    });

    it('returns idle when syncStates is empty', () => {
        const syncStates: Record<string, { status: SystemSyncStatus; error?: string }> = {};

        const result = getSyncStatus('wh40k10e', syncStates);

        expect(result).toBe(SyncStatus.Idle);
    });

    it('ignores error field and returns status', () => {
        const syncStates: Record<string, { status: SystemSyncStatus; error?: string }> = {
            wh40k10e: { status: SyncStatus.Error, error: 'network failure' },
        };

        const result = getSyncStatus('wh40k10e', syncStates);

        expect(result).toBe(SyncStatus.Error);
    });
});
