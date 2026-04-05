/**
 * @requirements
 * - Standalone Drizzle table definitions for the users service
 * - Used exclusively by drizzle-kit for schema introspection and migrations
 * - Must NOT import from the DAO package's `@/` path aliases (drizzle-kit cannot resolve them)
 * - Table definitions must stay in sync with the canonical definitions in the DAO layer
 */

import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Drizzle table mapping for user entities. */
export const usersTable = pgTable(
    'users',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        sub: text('sub').notNull(),
        email: text('email').notNull(),
        name: text('name').notNull(),
        picture: text('picture'),
        accountId: text('account_id'),
        createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        subIndex: index('idx_users_sub').on(table.sub),
        emailIndex: index('idx_users_email').on(table.email),
    }),
);

/** Drizzle table mapping for account entities. */
export const accountsTable = pgTable(
    'accounts',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id').notNull(),
        preferences: text('preferences'),
        systems: text('systems'),
        createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        userIdIndex: index('idx_accounts_user_id').on(table.userId),
    }),
);
