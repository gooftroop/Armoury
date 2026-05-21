/**
 * @requirements
 * - Drizzle table definitions for user entities (Postgres and SQLite variants)
 * - `usersTable` is used by the Postgres adapter; `usersSqliteTable` by the SQLite adapter
 * - `sub` column retained through Wave 2 of the Auth0 migration (Task 15 reads it)
 * - `legacyId` column stores the old UUID PK during the Auth0 sub migration window
 */
import type { DatabaseAdapter } from '@/adapter.js';
import { BaseDAO } from '@/dao/BaseDAO.js';
import type { User } from '@armoury/models';
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import * as sl from 'drizzle-orm/sqlite-core';

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
        legacyId: text('legacy_id'),
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
        legacyId: sl.text('legacy_id'),
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
     *
     * After the Wave 1 migration, `users.id` holds the Auth0 sub directly,
     * so this is an alias for `get(sub)`. The `sub` column is retained through
     * Wave 2 (Task 15) and dropped in Task 17.
     *
     * @param sub - Auth0 subject identifier (equals `users.id` post-migration).
     * @returns The user or null if not found.
     */
    public async findBySub(sub: string): Promise<User | null> {
        return this.get(sub);
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
