/**
 * Pure helpers for production-to-sandbox data sync.
 *
 * Extracted from dbSchema.ts for testability. Contains SQL generation,
 * value serialization, batch orchestration, and row count verification.
 *
 * @requirements
 * - REQ-DATA-SYNC: Production data is copied to sandbox schemas for realistic testing
 * - REQ-SYNC-SAFETY: Production cluster is read-only during sync; sandbox writes use ON CONFLICT DO NOTHING
 * - REQ-DSQL-BATCH: Writes are batched at 3000 rows per transaction (Aurora DSQL limit)
 * - REQ-SYNC-VERIFY: Row counts are compared between source and target after sync
 */

/** Maximum rows per transaction for Aurora DSQL writes. */
export const DSQL_BATCH_SIZE = 3000;

/** Schema/table name validation pattern: lowercase alphanumeric + underscores, starting with a letter. */
export const SCHEMA_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export interface QueryResult {
    rows: Record<string, unknown>[];
}

export type PgClient = {
    connect: () => Promise<void>;
    end: () => Promise<void>;
    query: (text: string) => Promise<QueryResult>;
};

export function serializeValue(v: unknown): string {
    if (v === null || v === undefined) {
        return 'NULL';
    }

    if (typeof v === 'number') {
        return String(v);
    }

    if (typeof v === 'boolean') {
        return v ? 'TRUE' : 'FALSE';
    }

    if (v instanceof Date) {
        return `'${v.toISOString()}'`;
    }

    return `'${String(v).replace(/'/g, "''")}'`;
}

export function buildInsertSql(
    targetSchema: string,
    table: string,
    columns: string[],
    rows: Record<string, unknown>[],
): string {
    const columnList = columns.map((c) => `"${c}"`).join(', ');
    const valuePlaceholders = rows
        .map((row) => {
            const vals = columns.map((col) => serializeValue(row[col]));

            return `(${vals.join(', ')})`;
        })
        .join(',\n');

    return `INSERT INTO "${targetSchema}"."${table}" (${columnList}) VALUES\n${valuePlaceholders}\nON CONFLICT DO NOTHING`;
}

export interface SyncResult {
    table: string;
    rowsRead: number;
    batchesWritten: number;
}

/** PostgreSQL error code for "relation does not exist". */
const UNDEFINED_TABLE = '42P01';

function isUndefinedTableError(err: unknown): boolean {
    return (
        typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === UNDEFINED_TABLE
    );
}

export async function syncTable(
    sourceClient: PgClient,
    targetClient: PgClient,
    targetSchema: string,
    table: string,
): Promise<SyncResult> {
    if (!SCHEMA_NAME_PATTERN.test(table)) {
        throw new Error(`Invalid table name "${table}".`);
    }

    let result: QueryResult;

    try {
        result = await sourceClient.query(`SELECT * FROM "public"."${table}"`);
    } catch (err: unknown) {
        if (isUndefinedTableError(err)) {
            console.log(`[db:sync] Source table "public"."${table}" does not exist — skipping.`);

            return { table, rowsRead: 0, batchesWritten: 0 };
        }

        throw err;
    }

    const rows = result.rows;

    if (rows.length === 0) {
        return { table, rowsRead: 0, batchesWritten: 0 };
    }

    const columns = Object.keys(rows[0]!);
    let batchesWritten = 0;

    for (let offset = 0; offset < rows.length; offset += DSQL_BATCH_SIZE) {
        const batch = rows.slice(offset, offset + DSQL_BATCH_SIZE);
        const sql = buildInsertSql(targetSchema, table, columns, batch);

        await targetClient.query(sql);
        batchesWritten++;
    }

    return { table, rowsRead: rows.length, batchesWritten };
}

export interface VerifyResult {
    table: string;
    sourceCount: number;
    targetCount: number;
    match: boolean;
}

export async function verifySyncCounts(
    sourceClient: PgClient,
    targetClient: PgClient,
    targetSchema: string,
    tables: string[],
): Promise<VerifyResult[]> {
    const results: VerifyResult[] = [];

    for (const table of tables) {
        if (!SCHEMA_NAME_PATTERN.test(table)) {
            throw new Error(`Invalid table name "${table}".`);
        }

        try {
            const sourceResult = await sourceClient.query(`SELECT count(*)::int AS count FROM "public"."${table}"`);
            const targetResult = await targetClient.query(
                `SELECT count(*)::int AS count FROM "${targetSchema}"."${table}"`,
            );

            const sourceCount = (sourceResult.rows[0]?.['count'] as number) ?? 0;
            const targetCount = (targetResult.rows[0]?.['count'] as number) ?? 0;

            results.push({
                table,
                sourceCount,
                targetCount,
                match: targetCount >= sourceCount,
            });
        } catch (err: unknown) {
            if (isUndefinedTableError(err)) {
                console.log(`[db:sync] Table "${table}" does not exist in source or target — skipping verification.`);
                results.push({ table, sourceCount: 0, targetCount: 0, match: true });
                continue;
            }

            throw err;
        }
    }

    return results;
}
