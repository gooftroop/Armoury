import type { DatabaseAdapter } from '@/adapter.js';
import { BaseDAO } from '@/dao/BaseDAO.js';
import { registerEntityCodec, type EntityCodec } from '@/codec.js';
import type { UserPresence } from '@armoury/models';
import { pgTable, text } from 'drizzle-orm/pg-core';
import * as sl from 'drizzle-orm/sqlite-core';

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
