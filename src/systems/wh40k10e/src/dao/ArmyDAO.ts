import type { DatabaseAdapter } from '@armoury/data-dao';
import { BaseDAO } from '@armoury/data-dao';
import type { Army } from '@/models/ArmyModel.js';

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
const { pgTable, text, integer, jsonb, timestamp, index } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/** Drizzle table mapping for army entities. */
export const armiesTable = pgTable(
    'armies',
    {
        id: text('id').primaryKey(),
        ownerId: text('owner_id').notNull(),
        name: text('name').notNull(),
        factionId: text('faction_id').notNull(),
        detachmentId: text('detachment_id'),
        warlordUnitId: text('warlord_unit_id'),
        battleSize: text('battle_size').notNull(),
        pointsLimit: integer('points_limit').notNull(),
        units: jsonb('units').notNull(),
        totalPoints: integer('total_points').notNull(),
        notes: text('notes').notNull(),
        versions: jsonb('versions').notNull(),
        currentVersion: integer('current_version').notNull(),
        createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        ownerIdIndex: index('idx_armies_ownerId').on(table.ownerId),
        factionIdIndex: index('idx_armies_factionId').on(table.factionId),
    }),
);

/** Drizzle SQLite table mapping for army entities. */
export const armiesSqliteTable = sl.sqliteTable(
    'armies',
    {
        id: sl.text('id').primaryKey(),
        ownerId: sl.text('owner_id').notNull(),
        name: sl.text('name').notNull(),
        factionId: sl.text('faction_id').notNull(),
        detachmentId: sl.text('detachment_id'),
        warlordUnitId: sl.text('warlord_unit_id'),
        battleSize: sl.text('battle_size').notNull(),
        pointsLimit: sl.integer('points_limit').notNull(),
        units: sl.text('units').notNull(),
        totalPoints: sl.integer('total_points').notNull(),
        notes: sl.text('notes').notNull(),
        versions: sl.text('versions').notNull(),
        currentVersion: sl.integer('current_version').notNull(),
        createdAt: sl.text('created_at').notNull(),
        updatedAt: sl.text('updated_at').notNull(),
    },
    (table) => ({
        ownerIdIndex: sl.index('idx_armies_ownerId').on(table.ownerId),
        factionIdIndex: sl.index('idx_armies_factionId').on(table.factionId),
    }),
);

/**
 * DAO for user-managed army data.
 * Provides CRUD operations and query methods for Army entities stored in the database.
 */
class ArmyDAO extends BaseDAO<Army> {
    /**
     * Creates an army DAO.
     * @param adapter - Database adapter instance
     */
    constructor(adapter: DatabaseAdapter) {
        super(adapter, 'army');
    }

    /**
     * Lists armies belonging to a specific owner.
     * @param ownerId - Owner's account ID
     * @returns Array of armies owned by the specified user
     */
    async listByOwner(ownerId: string): Promise<Army[]> {
        const results = await this.adapter.getByField(this.getStore(), 'ownerId' as never, ownerId);

        return results as Army[];
    }

    /**
     * Lists armies for a specific faction.
     * @param factionId - Faction ID to filter by
     * @returns Array of armies using the specified faction
     */
    async listByFaction(factionId: string): Promise<Army[]> {
        const results = await this.adapter.getByField(this.getStore(), 'factionId' as never, factionId);

        return results as Army[];
    }
}

export { ArmyDAO };
