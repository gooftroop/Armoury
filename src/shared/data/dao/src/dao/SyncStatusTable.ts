import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import * as sl from 'drizzle-orm/sqlite-core';

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
