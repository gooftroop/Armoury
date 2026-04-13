/**
 * @requirements
 * - Standalone Drizzle table definitions for the friends service
 * - Used exclusively by drizzle-kit for schema introspection and migrations
 * - Must NOT import from the DAO package's `@/` path aliases (drizzle-kit cannot resolve them)
 * - Table definitions must stay in sync with the canonical definitions in the DAO layer
 * - Tables must be schema-qualified when DB_SCHEMA is set to a non-public schema,
 *   so that drizzle-kit's schemaFilter includes them in the desired snapshot
 */

import { boolean, index, pgSchema, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { PgTableFn } from 'drizzle-orm/pg-core';

/**
 * Builds a table constructor that targets the correct Postgres schema.
 * When DB_SCHEMA is a custom schema (e.g. 'pr_33'), tables are created under
 * that schema via pgSchema().table(). When unset or 'public', plain pgTable()
 * is used (pgSchema('public') throws in drizzle-orm).
 */
const dbSchema = process.env['DB_SCHEMA'];
const table: PgTableFn<string | undefined> = dbSchema && dbSchema !== 'public' ? pgSchema(dbSchema).table : pgTable;

/** Drizzle table mapping for friend relationship entities. */
export const friendsTable = table(
    'friends',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        ownerId: text('owner_id').notNull(),
        userId: text('user_id').notNull(),
        status: text('status').notNull(),
        canShareArmyLists: boolean('can_share_army_lists').notNull(),
        canViewMatchHistory: boolean('can_view_match_history').notNull(),
        createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        ownerIdIndex: index('idx_friends_ownerId').on(table.ownerId),
        userIdIndex: index('idx_friends_userId').on(table.userId),
    }),
);

/** Drizzle table mapping for user presence entities. */
export const userPresenceTable = table('user_presence', {
    id: text('user_id').primaryKey(),
    connectionId: text('connection_id'),
    status: text('status').notNull(),
    lastSeen: text('last_seen').notNull(),
});
