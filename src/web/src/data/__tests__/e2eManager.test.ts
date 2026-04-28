/**
 * e2eManager bridge unit tests.
 *
 * @requirements
 * | Requirement ID | Requirement | Test Case(s) |
 * | --- | --- | --- |
 * | REQ-WEB-E2E-001 | Test bridge code provides window.__armoury_raw_query in test runtime. | T1 |
 * | REQ-WEB-E2E-002 | Bridge forwards calls to DataContextManager.rawQuery with original args. | T2 |
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataContextManager } from '@/data/DataContextManager.js';
import { installE2EBridge } from '@/data/__testing__/e2eManager.js';

describe('installE2EBridge', () => {
    beforeEach(() => {
        delete window.__armoury_raw_query;
    });

    it('T1/T2: installs window bridge and forwards rawQuery calls', async () => {
        const rawQuery = vi.fn(async (_sql: string, _params?: unknown[]) => ({ rows: [{ one: 1 }] }));
        const manager = {
            rawQuery,
        } as unknown as DataContextManager;

        installE2EBridge(manager);

        expect(window.__armoury_raw_query).toBeTypeOf('function');

        await window.__armoury_raw_query?.('SELECT 1', []);

        expect(rawQuery).toHaveBeenCalledTimes(1);
        expect(rawQuery).toHaveBeenCalledWith('SELECT 1', []);
    });
});
