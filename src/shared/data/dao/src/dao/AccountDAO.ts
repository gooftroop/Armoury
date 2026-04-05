import type { DatabaseAdapter } from '@/adapter.js';
import { BaseDAO } from '@/dao/BaseDAO.js';
import type { Account } from '@armoury/models';
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import * as sl from 'drizzle-orm/sqlite-core';

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

/** Drizzle SQLite table mapping for account entities. */
export const accountsSqliteTable = sl.sqliteTable(
    'accounts',
    {
        id: sl
            .text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: sl.text('user_id').notNull(),
        preferences: sl.text('preferences'),
        systems: sl.text('systems'),
        createdAt: sl.text('created_at').notNull(),
        updatedAt: sl.text('updated_at').notNull(),
    },
    (table) => ({
        userIdIndex: sl.index('idx_accounts_user_id').on(table.userId),
    }),
);

/**
 * DAO for managing account entities.
 */
export class AccountDAO extends BaseDAO<Account> {
    /**
     * Creates a DAO instance for account operations.
     * @param adapter - Database adapter used to execute operations.
     */
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'account');
    }

    /**
     * Finds the account belonging to a specific user.
     * @param userId - User identifier to look up the account for.
     * @returns The account or null if not found.
     */
    public async findByUserId(userId: string): Promise<Account | null> {
        const results = await this.adapter.getByField('account', 'userId', userId);

        return (results[0] as Account) ?? null;
    }
}
