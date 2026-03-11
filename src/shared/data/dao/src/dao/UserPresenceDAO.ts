import type { DatabaseAdapter } from '../adapter.ts';
import { BaseDAO } from './BaseDAO.ts';
import { registerEntityCodec, type EntityCodec } from '../codec.ts';
import type { UserPresence } from '@armoury/models/UserPresenceModel';

type ColumnBuilder = {
    primaryKey: () => ColumnBuilder;
    notNull: () => ColumnBuilder;
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
const { pgTable, text } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/**
 * Drizzle table mapping for user presence entities.
 *
 * The Drizzle field is named `id` (mapped to SQL column `user_id`) so that the
 * adapter's `get(store, id)` / `delete(store, id)` queries work against the
 * primary key without special-casing. The entity codec layer maps `userId` on
 * the domain model to the `id` column when reading/writing rows.
 */
export const userPresenceTable = pgTable('user_presence', {
    id: text('user_id').primaryKey(),
    connectionId: text('connection_id'),
    status: text('status').notNull(),
    lastSeen: text('last_seen').notNull(),
});

/** Drizzle SQLite table mapping for user presence entities. */
export const userPresenceSqliteTable = sl.sqliteTable('user_presence', {
    id: sl.text('user_id').primaryKey(),
    connectionId: sl.text('connection_id'),
    status: sl.text('status').notNull(),
    lastSeen: sl.text('last_seen').notNull(),
});

const userPresenceCodec: EntityCodec<UserPresence> = {
    serialize: (entity) => ({
        id: entity.userId,
        connectionId: entity.connectionId,
        status: entity.status,
        lastSeen: entity.lastSeen,
    }),
    hydrate: (raw) => ({
        userId: String(raw.id ?? raw.userId),
        connectionId: raw.connectionId ? String(raw.connectionId) : null,
        status: String(raw.status) as UserPresence['status'],
        lastSeen: String(raw.lastSeen),
    }),
};

registerEntityCodec('userPresence', userPresenceCodec as EntityCodec);

/**
 * DAO for managing user presence entities.
 */
export class UserPresenceDAO extends BaseDAO<UserPresence> {
    /**
     * Creates a DAO instance for user presence operations.
     * @param adapter - Database adapter used to execute operations.
     */
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'userPresence');
    }

    /**
     * Finds a user presence record by its WebSocket connection ID.
     * @param connectionId - WebSocket connection identifier.
     * @returns The matching presence record, or null if not connected.
     */
    public async getByConnectionId(connectionId: string): Promise<UserPresence | null> {
        const results = await this.adapter.getByField(this.getStore(), 'connectionId' as never, connectionId);

        return (results[0] as UserPresence) ?? null;
    }
}
