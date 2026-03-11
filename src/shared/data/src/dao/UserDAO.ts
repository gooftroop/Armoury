import type { DatabaseAdapter } from '@data/adapter.js';
import { BaseDAO } from '@data/dao/BaseDAO.js';
import type { User } from '@models/UserModel.js';

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
const { pgTable, text, timestamp, index } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

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

/** Drizzle SQLite table mapping for user entities. */
export const usersSqliteTable = sl.sqliteTable(
    'users',
    {
        id: sl
            .text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        sub: sl.text('sub').notNull(),
        email: sl.text('email').notNull(),
        name: sl.text('name').notNull(),
        picture: sl.text('picture'),
        accountId: sl.text('account_id'),
        createdAt: sl.text('created_at').notNull(),
        updatedAt: sl.text('updated_at').notNull(),
    },
    (table) => ({
        subIndex: sl.index('idx_users_sub').on(table.sub),
        emailIndex: sl.index('idx_users_email').on(table.email),
    }),
);

/**
 * DAO for managing user entities.
 */
export class UserDAO extends BaseDAO<User> {
    /**
     * Creates a DAO instance for user operations.
     * @param adapter - Database adapter used to execute operations.
     */
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'user');
    }

    /**
     * Finds a user by their Auth0 subject identifier.
     * @param sub - Auth0 subject identifier.
     * @returns The user or null if not found.
     */
    public async findBySub(sub: string): Promise<User | null> {
        const results = await this.adapter.getByField('user', 'sub', sub);

        return (results[0] as User) ?? null;
    }

    /**
     * Finds a user by their email address.
     * @param email - Email address to search for.
     * @returns The user or null if not found.
     */
    public async findByEmail(email: string): Promise<User | null> {
        const results = await this.adapter.getByField('user', 'email', email);

        return (results[0] as User) ?? null;
    }
}
