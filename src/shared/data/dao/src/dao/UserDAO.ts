/**
 * @requirements
 * - Drizzle table definitions for user entities (Postgres and SQLite variants)
 * - `usersTable` is used by the Postgres adapter; `usersSqliteTable` by the SQLite adapter
 * - `id` IS the Auth0 sub — no separate UUID, no `sub` column
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
        id: text('id').primaryKey(),
        email: text('email').notNull(),
        name: text('name').notNull(),
        picture: text('picture'),
        accountId: text('account_id'),
        createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        emailIndex: index('idx_users_email').on(table.email),
    }),
);

/** Drizzle SQLite table mapping for user entities. */
export const usersSqliteTable = sl.sqliteTable(
    'users',
    {
        id: sl.text('id').primaryKey(),
        email: sl.text('email').notNull(),
        name: sl.text('name').notNull(),
        picture: sl.text('picture'),
        accountId: sl.text('account_id'),
        createdAt: sl.text('created_at').notNull(),
        updatedAt: sl.text('updated_at').notNull(),
    },
    (table) => ({
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
     * Finds a user by their email address.
     * @param email - Email to search for.
     * @returns Array of matching users (typically 0 or 1).
     */
    public async findByEmail(email: string): Promise<User[]> {
        return this.adapter.getByField('user', 'email', email);
    }
}
