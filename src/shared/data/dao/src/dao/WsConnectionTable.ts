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

import { pgTable, text, index } from 'drizzle-orm/pg-core';
import * as sl from 'drizzle-orm/sqlite-core';

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
