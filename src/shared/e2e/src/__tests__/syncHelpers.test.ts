/**
 * @requirements
 * - REQ-DATA-SYNC: Production data is copied to sandbox schemas for realistic testing
 * - REQ-SYNC-SAFETY: Sandbox writes use ON CONFLICT DO NOTHING
 * - REQ-DSQL-BATCH: Writes are batched at 3000 rows per transaction (Aurora DSQL limit)
 * - REQ-SYNC-VERIFY: Row counts are compared between source and target after sync
 */

import { describe, it, expect, vi } from 'vitest';
import {
    serializeValue,
    buildInsertSql,
    syncTable,
    verifySyncCounts,
    DSQL_BATCH_SIZE,
    type PgClient,
    type QueryResult,
} from '@/syncHelpers.js';

/**
 * Test Plan
 *
 * serializeValue:
 *   - REQ-DATA-SYNC → serializes null/undefined to NULL
 *   - REQ-DATA-SYNC → serializes numbers to string
 *   - REQ-DATA-SYNC → serializes booleans to TRUE/FALSE
 *   - REQ-DATA-SYNC → serializes Date to ISO 8601 string literal
 *   - REQ-DATA-SYNC → serializes strings with single-quote escaping
 *   - REQ-DATA-SYNC → serializes empty string
 *
 * buildInsertSql:
 *   - REQ-SYNC-SAFETY → generates INSERT ... ON CONFLICT DO NOTHING
 *   - REQ-DATA-SYNC → quotes schema, table, and column names
 *   - REQ-DATA-SYNC → handles multiple rows
 *
 * syncTable:
 *   - REQ-DATA-SYNC → returns zero counts for empty source table
 *   - REQ-DSQL-BATCH → batches writes at DSQL_BATCH_SIZE
 *   - REQ-DATA-SYNC → rejects invalid table names
 *
 * verifySyncCounts:
 *   - REQ-SYNC-VERIFY → reports match when counts are equal
 *   - REQ-SYNC-VERIFY → reports match when target >= source (ON CONFLICT may skip rows)
 *   - REQ-SYNC-VERIFY → reports mismatch when target < source
 *   - REQ-SYNC-VERIFY → verifies multiple tables
 *   - REQ-DATA-SYNC → rejects invalid table names
 */

function makeMockClient(queryResponses: QueryResult[] = []): PgClient {
    let callIndex = 0;
    const defaultResponse: QueryResult = { rows: [] };

    return {
        connect: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        end: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        query: vi.fn<(text: string) => Promise<QueryResult>>().mockImplementation(() => {
            const response = queryResponses[callIndex] ?? defaultResponse;
            callIndex++;

            return Promise.resolve(response);
        }),
    };
}

describe('serializeValue', () => {
    it('serializes null to NULL', () => {
        expect(serializeValue(null)).toBe('NULL');
    });

    it('serializes undefined to NULL', () => {
        expect(serializeValue(undefined)).toBe('NULL');
    });

    it('serializes integers', () => {
        expect(serializeValue(42)).toBe('42');
    });

    it('serializes floats', () => {
        expect(serializeValue(3.14)).toBe('3.14');
    });

    it('serializes zero', () => {
        expect(serializeValue(0)).toBe('0');
    });

    it('serializes true to TRUE', () => {
        expect(serializeValue(true)).toBe('TRUE');
    });

    it('serializes false to FALSE', () => {
        expect(serializeValue(false)).toBe('FALSE');
    });

    it('serializes Date to quoted ISO 8601', () => {
        const date = new Date('2025-06-15T12:00:00.000Z');

        expect(serializeValue(date)).toBe("'2025-06-15T12:00:00.000Z'");
    });

    it('serializes plain strings with quotes', () => {
        expect(serializeValue('hello')).toBe("'hello'");
    });

    it('escapes single quotes in strings', () => {
        expect(serializeValue("it's")).toBe("'it''s'");
    });

    it('handles strings with multiple single quotes', () => {
        expect(serializeValue("it's a 'test'")).toBe("'it''s a ''test'''");
    });

    it('serializes empty string', () => {
        expect(serializeValue('')).toBe("''");
    });
});

describe('buildInsertSql', () => {
    it('generates INSERT ... ON CONFLICT DO NOTHING', () => {
        const sql = buildInsertSql('pr_42', 'users', ['id', 'name'], [{ id: '1', name: 'Alice' }]);

        expect(sql).toContain('INSERT INTO "pr_42"."users"');
        expect(sql).toContain('"id", "name"');
        expect(sql).toContain("'1', 'Alice'");
        expect(sql).toContain('ON CONFLICT DO NOTHING');
    });

    it('quotes schema and table names', () => {
        const sql = buildInsertSql('pr_99', 'campaign_participants', ['id'], [{ id: 'a' }]);

        expect(sql).toMatch(/^INSERT INTO "pr_99"\."campaign_participants"/);
    });

    it('handles multiple rows', () => {
        const rows = [
            { id: '1', score: 10 },
            { id: '2', score: 20 },
        ];
        const sql = buildInsertSql('pr_1', 'matches', ['id', 'score'], rows);

        // Each row produces a separate VALUES tuple
        expect(sql).toContain("('1', 10)");
        expect(sql).toContain("('2', 20)");
    });

    it('serializes null and boolean values in rows', () => {
        const rows = [{ active: true, deleted_at: null }];
        const sql = buildInsertSql('pr_1', 'users', ['active', 'deleted_at'], rows);

        expect(sql).toContain('(TRUE, NULL)');
    });
});

describe('syncTable', () => {
    it('returns zero counts for empty source table', async () => {
        const source = makeMockClient([{ rows: [] }]);
        const target = makeMockClient();

        const result = await syncTable(source, target, 'pr_1', 'users');

        expect(result).toEqual({ table: 'users', rowsRead: 0, batchesWritten: 0 });
        expect(target.query).not.toHaveBeenCalled();
    });

    it('writes a single batch for rows under the limit', async () => {
        const rows = Array.from({ length: 5 }, (_, i) => ({ id: String(i), name: `user_${i}` }));
        const source = makeMockClient([{ rows }]);
        const target = makeMockClient();

        const result = await syncTable(source, target, 'pr_1', 'users');

        expect(result).toEqual({ table: 'users', rowsRead: 5, batchesWritten: 1 });
        expect(target.query).toHaveBeenCalledTimes(1);
    });

    it('batches writes at DSQL_BATCH_SIZE', async () => {
        const rowCount = DSQL_BATCH_SIZE * 2 + 500;
        const rows = Array.from({ length: rowCount }, (_, i) => ({ id: String(i) }));
        const source = makeMockClient([{ rows }]);
        const target = makeMockClient();

        const result = await syncTable(source, target, 'pr_1', 'users');

        expect(result.rowsRead).toBe(rowCount);
        // 3000 + 3000 + 500 = 3 batches
        expect(result.batchesWritten).toBe(3);
        expect(target.query).toHaveBeenCalledTimes(3);
    });

    it('rejects invalid table names', async () => {
        const source = makeMockClient();
        const target = makeMockClient();

        await expect(syncTable(source, target, 'pr_1', 'DROP TABLE')).rejects.toThrow('Invalid table name');
    });

    it('rejects table names starting with numbers', async () => {
        const source = makeMockClient();
        const target = makeMockClient();

        await expect(syncTable(source, target, 'pr_1', '123bad')).rejects.toThrow('Invalid table name');
    });
});

describe('verifySyncCounts', () => {
    it('reports match when counts are equal', async () => {
        const source = makeMockClient([{ rows: [{ count: 100 }] }]);
        const target = makeMockClient([{ rows: [{ count: 100 }] }]);

        const results = await verifySyncCounts(source, target, 'pr_1', ['users']);

        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({ table: 'users', sourceCount: 100, targetCount: 100, match: true });
    });

    it('reports match when target >= source', async () => {
        // Target may have more rows if data was added after sync
        const source = makeMockClient([{ rows: [{ count: 50 }] }]);
        const target = makeMockClient([{ rows: [{ count: 75 }] }]);

        const results = await verifySyncCounts(source, target, 'pr_1', ['users']);

        expect(results[0]!.match).toBe(true);
    });

    it('reports mismatch when target < source', async () => {
        const source = makeMockClient([{ rows: [{ count: 100 }] }]);
        const target = makeMockClient([{ rows: [{ count: 50 }] }]);

        const results = await verifySyncCounts(source, target, 'pr_1', ['users']);

        expect(results[0]!.match).toBe(false);
        expect(results[0]!.sourceCount).toBe(100);
        expect(results[0]!.targetCount).toBe(50);
    });

    it('verifies multiple tables', async () => {
        // Source: users=100, accounts=50; Target: users=100, accounts=50
        const source = makeMockClient([{ rows: [{ count: 100 }] }, { rows: [{ count: 50 }] }]);
        const target = makeMockClient([{ rows: [{ count: 100 }] }, { rows: [{ count: 50 }] }]);

        const results = await verifySyncCounts(source, target, 'pr_1', ['users', 'accounts']);

        expect(results).toHaveLength(2);
        expect(results[0]!.table).toBe('users');
        expect(results[0]!.match).toBe(true);
        expect(results[1]!.table).toBe('accounts');
        expect(results[1]!.match).toBe(true);
    });

    it('rejects invalid table names', async () => {
        const source = makeMockClient();
        const target = makeMockClient();

        await expect(verifySyncCounts(source, target, 'pr_1', ['bad name!'])).rejects.toThrow('Invalid table name');
    });

    it('handles zero-count tables', async () => {
        const source = makeMockClient([{ rows: [{ count: 0 }] }]);
        const target = makeMockClient([{ rows: [{ count: 0 }] }]);

        const results = await verifySyncCounts(source, target, 'pr_1', ['empty_table']);

        expect(results[0]!.match).toBe(true);
        expect(results[0]!.sourceCount).toBe(0);
        expect(results[0]!.targetCount).toBe(0);
    });
});
