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

/**
 * Deletes the PGlite IndexedDB database to ensure a clean state between tests.
 * IndexedDB databases are scoped to origin and persist across browser contexts,
 * so they must be explicitly deleted to avoid stale locks from previous PGlite instances.
 */
export async function deletePgliteDatabase(page: Page): Promise<void> {
    await page.evaluate(async (idbName: string) => {
        const databases = await indexedDB.databases();
        const exists = databases.some((db) => db.name === idbName);

        if (exists) {
            await new Promise<void>((resolve, reject) => {
                const req = indexedDB.deleteDatabase(idbName);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
                req.onblocked = () => resolve(); // Accept blocked — best effort cleanup
            });
        }
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

/**
 * Inserts a test army into PGlite via raw SQL so e2e tests can exercise
 * the Forge UI (duplicate / delete) without a create-army page.
 *
 * Uses the `__armoury_raw_query` bridge exposed by DataContextProvider in
 * non-production builds. The app must have completed sync before calling
 * this function (DataContext status === 'ready').
 *
 * @param page - Playwright page with the app loaded and sync complete.
 * @param ownerId - The owner (user) ID to associate with the army.
 * @param overrides - Optional partial Army fields to customise the test record.
 * @returns The army `id` that was inserted.
 */
export async function insertTestArmy(
    page: Page,
    ownerId: string,
    overrides?: {
        id?: string;
        name?: string;
        factionId?: string;
        detachmentId?: string | null;
        battleSize?: string;
        pointsLimit?: number;
    },
): Promise<string> {
    return page.evaluate(
        async ({
            ownerId: owner,
            overrides: ov,
        }: {
            ownerId: string;
            overrides?: {
                id?: string;
                name?: string;
                factionId?: string;
                detachmentId?: string | null;
                battleSize?: string;
                pointsLimit?: number;
            };
        }) => {
            const rawQuery = (window as unknown as Record<string, unknown>).__armoury_raw_query as
                | ((sql: string) => Promise<{ rows: Record<string, unknown>[] }>)
                | undefined;

            if (!rawQuery) {
                throw new Error('__armoury_raw_query not available — is the app initialised?');
            }

            const id = ov?.id ?? crypto.randomUUID();
            const now = new Date().toISOString();

            // Escape single quotes for SQL string literals.
            const esc = (s: string): string => s.replace(/'/g, "''");

            const name = ov?.name ?? 'E2E Test Army';
            const factionId = ov?.factionId ?? 'space-marines';
            const detachmentId = ov?.detachmentId ?? null;
            const battleSize = ov?.battleSize ?? 'StrikeForce';
            const pointsLimit = ov?.pointsLimit ?? 2000;

            const sql = `
                INSERT INTO armies (
                    id, owner_id, name, faction_id, detachment_id,
                    warlord_unit_id, battle_size, points_limit,
                    units, total_points, notes, versions,
                    current_version, created_at, updated_at
                ) VALUES (
                    '${esc(id)}',
                    '${esc(owner)}',
                    '${esc(name)}',
                    '${esc(factionId)}',
                    ${detachmentId ? `'${esc(detachmentId)}'` : 'NULL'},
                    NULL,
                    '${esc(battleSize)}',
                    ${pointsLimit},
                    '[]'::jsonb,
                    0,
                    '',
                    '[]'::jsonb,
                    0,
                    '${now}',
                    '${now}'
                )
            `;

            await rawQuery(sql);

            return id;
        },
        { ownerId, overrides },
    );
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
