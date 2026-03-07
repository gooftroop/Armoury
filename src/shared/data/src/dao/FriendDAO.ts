import type { DatabaseAdapter } from '@data/adapter.js';
import { BaseDAO } from '@data/dao/BaseDAO.js';
import type { Friend, FriendStatus } from '@models/FriendModel.js';

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

const pgCoreModule = (await import('drizzle-orm/pg-core')) as unknown as PgCoreModule;
const { pgTable, text, boolean, timestamp, index } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;
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

/** Drizzle SQLite table mapping for friend relationship entities. */
export const friendsSqliteTable = sl.sqliteTable(
    'friends',
    {
        id: sl
            .text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        ownerId: sl.text('owner_id').notNull(),
        userId: sl.text('user_id').notNull(),
        status: sl.text('status').notNull(),
        canShareArmyLists: sl.integer('can_share_army_lists', { mode: 'boolean' }).notNull(),
        canViewMatchHistory: sl.integer('can_view_match_history', { mode: 'boolean' }).notNull(),
        createdAt: sl.text('created_at').notNull(),
        updatedAt: sl.text('updated_at').notNull(),
    },
    (table) => ({
        ownerIdIndex: sl.index('idx_friends_ownerId').on(table.ownerId),
        userIdIndex: sl.index('idx_friends_userId').on(table.userId),
    }),
);

/**
 * DAO for managing friend entities.
 */
export class FriendDAO extends BaseDAO<Friend> {
    /**
     * Creates a DAO instance for friend operations.
     * @param adapter - Database adapter used to execute operations.
     */
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'friend');
    }

    /**
     * Lists friends filtered by status.
     * @param status - Friend status to filter by.
     * @returns Array of matching friends.
     */
    public async listByStatus(status: FriendStatus): Promise<Friend[]> {
        const results = await this.adapter.getByField('friend', 'status', status);

        return results as Friend[];
    }

    /**
     * Lists friends owned by a specific user.
     * @param ownerId - The owner's user ID.
     * @returns Array of friend records belonging to the owner.
     */
    public async listByOwner(ownerId: string): Promise<Friend[]> {
        const results = await this.adapter.getByField('friend', 'ownerId', ownerId);

        return results as Friend[];
    }
}
