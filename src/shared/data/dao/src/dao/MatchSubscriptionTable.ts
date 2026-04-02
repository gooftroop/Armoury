/**
 * Drizzle table definitions for WebSocket match subscription tracking.
 *
 * Match subscriptions associate a WebSocket connection with a match so that
 * real-time updates can be broadcast to all connected players. These are
 * ephemeral rows that live only while the WebSocket connection is open.
 *
 * No DAO class — subscriptions are managed directly by the matches service
 * WebSocket handler via the generic DatabaseAdapter interface.
 *
 * @requirements
 * - REQ-MATCHES-WS: WebSocket match subscription persistence for real-time updates
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
 * Drizzle table mapping for match subscription entities.
 *
 * Primary key is a composite string `{connectionId}:{matchId}` to ensure
 * each connection can subscribe to a match at most once.
 */
export const matchSubscriptionsTable = pgTable(
    'match_subscriptions',
    {
        id: text('id').primaryKey(),
        connectionId: text('connection_id').notNull(),
        matchId: text('match_id').notNull(),
        userId: text('user_id').notNull(),
    },
    (table) => ({
        connectionIdIndex: index('idx_match_subscriptions_connectionId').on(table.connectionId),
        matchIdIndex: index('idx_match_subscriptions_matchId').on(table.matchId),
    }),
);

/** Drizzle SQLite table mapping for match subscription entities. */
export const matchSubscriptionsSqliteTable = sl.sqliteTable(
    'match_subscriptions',
    {
        id: sl.text('id').primaryKey(),
        connectionId: sl.text('connection_id').notNull(),
        matchId: sl.text('match_id').notNull(),
        userId: sl.text('user_id').notNull(),
    },
    (table) => ({
        connectionIdIndex: sl.index('idx_match_subscriptions_connectionId').on(table.connectionId),
        matchIdIndex: sl.index('idx_match_subscriptions_matchId').on(table.matchId),
    }),
);
