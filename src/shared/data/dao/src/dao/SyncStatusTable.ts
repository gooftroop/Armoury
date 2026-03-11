type ColumnBuilder = {
    primaryKey: () => ColumnBuilder;
    notNull: () => ColumnBuilder;
};

type IndexBuilder = {
    on: (...columns: ColumnBuilder[]) => unknown;
};

type TableBuilder = (
    name: string,
    columns: Record<string, ColumnBuilder>,
    extraConfig?: (table: Record<string, ColumnBuilder>) => Record<string, unknown>,
) => Record<string, ColumnBuilder>;

type PgCoreModule = {
    pgTable: TableBuilder;
    text: (...args: unknown[]) => ColumnBuilder;
    integer: (...args: unknown[]) => ColumnBuilder;
    boolean: (...args: unknown[]) => ColumnBuilder;
    timestamp: (...args: unknown[]) => ColumnBuilder;
    index: (...args: unknown[]) => IndexBuilder;
};

type SqliteCoreModule = {
    sqliteTable: TableBuilder;
    text: (...args: unknown[]) => ColumnBuilder;
    integer: (...args: unknown[]) => ColumnBuilder;
    index: (...args: unknown[]) => IndexBuilder;
};

const pgCoreModule = (await import('drizzle-orm/pg-core')) as unknown as PgCoreModule;
const { pgTable, text, timestamp } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/**
 * Drizzle table mapping for file sync status tracking.
 * No DAO class — sync status is managed directly by the adapter.
 */
export const syncStatusTable = pgTable('sync_status', {
    fileKey: text('file_key').primaryKey(),
    sha: text('sha').notNull(),
    lastSynced: timestamp('last_synced', { mode: 'string' }).notNull(),
    etag: text('etag'),
});

/** Drizzle SQLite table mapping for file sync status tracking. */
export const syncStatusSqliteTable = sl.sqliteTable('sync_status', {
    fileKey: sl.text('file_key').primaryKey(),
    sha: sl.text('sha').notNull(),
    lastSynced: sl.text('last_synced').notNull(),
    etag: sl.text('etag'),
});
