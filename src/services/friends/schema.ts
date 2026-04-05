/**
 * @requirements
 * - Standalone Drizzle table definitions for the friends service
 * - Used exclusively by drizzle-kit for schema introspection and migrations
 * - Must NOT import from the DAO package's `@/` path aliases (drizzle-kit cannot resolve them)
 * - Table definitions must stay in sync with the canonical definitions in the DAO layer
 */

import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Drizzle table mapping for friend relationship entities. */
export const friendsTable = pgTable(
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
export const userPresenceTable = pgTable('user_presence', {
    id: text('user_id').primaryKey(),
    connectionId: text('connection_id'),
    status: text('status').notNull(),
    lastSeen: text('last_seen').notNull(),
});
