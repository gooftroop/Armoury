/**
 * @requirements
 * 1. Must detect whether the PGlite IndexedDB database exists before/after sync.
 * 2. Must list all public tables created by PGlite/Drizzle DDL.
 * 3. Must return row counts for individual tables to verify data population.
 * 4. Must handle the case where the database does not yet exist gracefully.
 * 5. Must query through the app's existing PGlite connection (single-connection IDB limitation).
 */

import type { Page } from '@playwright/test';

// PGlite v0.3.x names its IDB database `/pglite/<name>`.
const PGLITE_IDB_NAME = '/pglite/armoury';

/** Returns true if the PGlite-managed IndexedDB database exists in the browser. */
export async function pgliteDatabaseExists(page: Page): Promise<boolean> {
    return page.evaluate(async (idbName: string) => {
        const databases = await indexedDB.databases();

        return databases.some((db) => db.name === idbName);
    }, PGLITE_IDB_NAME);
}

type RawQueryFn = (sql: string) => Promise<{ rows: Record<string, unknown>[] }>;

/**
 * Runs a SQL query through the app's existing PGlite connection exposed on `window`.
 * Returns null if the query hook is not available (app not initialized).
 */
async function queryViaApp(page: Page, sql: string): Promise<Record<string, unknown>[] | null> {
    return page.evaluate(async (query: string) => {
        const rawQuery = (window as unknown as Record<string, unknown>).__armoury_raw_query as RawQueryFn | undefined;

        if (!rawQuery) {
            return null;
        }

        const result = await rawQuery(query);

        return result.rows;
    }, sql);
}

/** Lists all public table names in the PGlite database. Returns `[]` if the database doesn't exist. */
export async function listPGliteTables(page: Page): Promise<string[]> {
    const rows = await queryViaApp(
        page,
        `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );

    if (!rows) {
        return [];
    }

    return rows.map((r) => String(r.tablename));
}

/** Returns the row count for a table, or -1 if the database/table doesn't exist. */
export async function getTableRowCount(page: Page, tableName: string): Promise<number> {
    const safeName = tableName.replace(/"/g, '""');
    const rows = await queryViaApp(page, `SELECT COUNT(*) AS count FROM "${safeName}"`);

    if (!rows || rows.length === 0) {
        return -1;
    }

    return Number(rows[0]!.count ?? -1);
}

/** Returns row counts for multiple tables in a single evaluation (-1 if table missing). */
export async function getTableRowCounts(page: Page, tableNames: string[]): Promise<Record<string, number>> {
    return page.evaluate(async (tables: string[]) => {
        const counts: Record<string, number> = {};
        const rawQuery = (window as unknown as Record<string, unknown>).__armoury_raw_query as RawQueryFn | undefined;

        if (!rawQuery) {
            for (const table of tables) {
                counts[table] = -1;
            }

            return counts;
        }

        for (const table of tables) {
            try {
                const safeName = table.replace(/"/g, '""');
                const result = await rawQuery(`SELECT COUNT(*) AS count FROM "${safeName}"`);
                counts[table] = Number(result.rows[0]?.count ?? -1);
            } catch {
                counts[table] = -1;
            }
        }

        return counts;
    }, tableNames);
}
