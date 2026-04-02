/**
 * Drizzle table definitions for WebSocket connection tracking.
 *
 * Tracks active WebSocket connections so the matches service can look up
 * which user owns a connection and clean up stale subscriptions on disconnect.
 * These are ephemeral rows that live only while the WebSocket connection is open.
 *
 * No DAO class — connections are managed directly by the matches service
 * WebSocket handler via the generic DatabaseAdapter interface.
 *
 * @requirements
 * - REQ-MATCHES-WS: WebSocket connection persistence for real-time match updates
 * - REQ-SCHEMA: All entity stores used by services must be registered in the core schema
 */

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
const { pgTable, text, index } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/**
 * Drizzle table mapping for WebSocket connection entities.
 *
 * Uses the API Gateway connectionId as the primary key since each
 * connection is uniquely identified by its connection ID.
 */
export const wsConnectionsTable = pgTable(
    'ws_connections',
    {
        connectionId: text('connection_id').primaryKey(),
        userId: text('user_id').notNull(),
        connectedAt: text('connected_at').notNull(),
    },
    (table) => ({
        userIdIndex: index('idx_ws_connections_userId').on(table.userId),
    }),
);

/** Drizzle SQLite table mapping for WebSocket connection entities. */
export const wsConnectionsSqliteTable = sl.sqliteTable(
    'ws_connections',
    {
        connectionId: sl.text('connection_id').primaryKey(),
        userId: sl.text('user_id').notNull(),
        connectedAt: sl.text('connected_at').notNull(),
    },
    (table) => ({
        userIdIndex: sl.index('idx_ws_connections_userId').on(table.userId),
    }),
);
