
import type { DatabaseAdapter } from '@data/adapter.js';
import { BaseDAO } from '@data/dao/BaseDAO.js';
import type { Account } from '@models/AccountModel.js';

type ColumnBuilder = {
    primaryKey: () => ColumnBuilder;
    notNull: () => ColumnBuilder;
    $defaultFn: (fn: () => unknown) => ColumnBuilder;
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
    jsonb: (...args: unknown[]) => ColumnBuilder;
    timestamp: (...args: unknown[]) => ColumnBuilder;
    index: (...args: unknown[]) => IndexBuilder;
};

type SqliteCoreModule = {
    sqliteTable: TableBuilder;
    text: (...args: unknown[]) => ColumnBuilder;
    integer: (...args: unknown[]) => ColumnBuilder;
    index: (...args: unknown[]) => IndexBuilder;
};

const pgCoreModule = await import('drizzle-orm/pg-core') as unknown as PgCoreModule;
const { pgTable, text, jsonb, timestamp, index } = pgCoreModule;
const sl = await import('drizzle-orm/sqlite-core') as unknown as SqliteCoreModule;

/** Drizzle table mapping for account entities. */
export const accountsTable = pgTable('accounts', {
        id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id').notNull(),
        preferences: jsonb('preferences'),
        systems: jsonb('systems'),
        createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        userIdIndex: index('idx_accounts_user_id').on(table.userId),
    }),
);


/** Drizzle SQLite table mapping for account entities. */
export const accountsSqliteTable = sl.sqliteTable('accounts', {
        id: sl.text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
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
