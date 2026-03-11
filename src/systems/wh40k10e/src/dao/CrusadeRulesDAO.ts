import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { CrusadeRules } from '@/models/CrusadeRulesModel.js';
import { BaseDAO } from '@/dao/BaseDAO.js';

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
const { pgTable, text, integer, jsonb } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/** Drizzle table mapping for crusade rules entities. */
export const crusadeRulesTable = pgTable('crusade_rules', {
    id: text('id').primaryKey(),
    source: text('source').notNull(),
    name: text('name').notNull(),
    version: text('version').notNull(),
    startingSupplyLimit: integer('starting_supply_limit').notNull(),
    startingRequisitionPoints: integer('starting_requisition_points').notNull(),
    rpPerBattle: integer('rp_per_battle').notNull(),
    rankThresholds: jsonb('rank_thresholds'),
    xpGainRules: jsonb('xp_gain_rules'),
    requisitions: jsonb('requisitions'),
    battleHonours: jsonb('battle_honours'),
    battleScars: jsonb('battle_scars'),
    agendas: jsonb('agendas'),
    narrative: text('narrative'),
    sourceMechanics: jsonb('source_mechanics'),
});

/** Drizzle SQLite table mapping for crusade rules entities. */
export const crusadeRulesSqliteTable = sl.sqliteTable('crusade_rules', {
    id: sl.text('id').primaryKey(),
    source: sl.text('source').notNull(),
    name: sl.text('name').notNull(),
    version: sl.text('version').notNull(),
    startingSupplyLimit: sl.integer('starting_supply_limit').notNull(),
    startingRequisitionPoints: sl.integer('starting_requisition_points').notNull(),
    rpPerBattle: sl.integer('rp_per_battle').notNull(),
    rankThresholds: sl.text('rank_thresholds'),
    xpGainRules: sl.text('xp_gain_rules'),
    requisitions: sl.text('requisitions'),
    battleHonours: sl.text('battle_honours'),
    battleScars: sl.text('battle_scars'),
    agendas: sl.text('agendas'),
    narrative: sl.text('narrative'),
    sourceMechanics: sl.text('source_mechanics'),
});

/**
 * DAO for crusade rules. Uses a static ruleset until BSData extraction is available.
 * Does not sync from remote sources; always returns the same hardcoded rules.
 */
class CrusadeRulesDAO extends BaseDAO<CrusadeRules> {
    /**
     * Creates a crusade rules DAO.
     * @param adapter - Database adapter instance
     * @param githubClient - GitHub client for BSData access (unused for static rules)
     */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        super(adapter, githubClient);
    }

    /** Returns the adapter store key for crusade rules. */
    protected getStoreKey(): string {
        return 'crusadeRules';
    }

    /** Returns the sync file key for crusade rules. */
    protected getSyncFileKey(): string {
        return 'crusadeRules:static';
    }

    /**
     * Returns a static crusade rules definition.
     * @returns Static CrusadeRules object with hardcoded values
     */
    protected override async fetchRemoteData(): Promise<CrusadeRules> {
        return {
            id: 'crusade-core',
            source: 'core',
            name: 'Crusade Core Rules',
            version: '1.0',
            startingSupplyLimit: 10,
            startingRequisitionPoints: 5,
            rpPerBattle: 1,
            rankThresholds: [
                { rank: 'Battle-ready', minXP: 0, battleHonoursAllowed: 0 },
                { rank: 'Bloodied', minXP: 6, battleHonoursAllowed: 1 },
                { rank: 'Battle-hardened', minXP: 16, battleHonoursAllowed: 2 },
                { rank: 'Heroic', minXP: 31, battleHonoursAllowed: 3 },
                { rank: 'Legendary', minXP: 51, battleHonoursAllowed: 4 },
            ],
            xpGainRules: [],
            requisitions: [],
            battleHonours: [],
            battleScars: [],
            agendas: [],
            narrative: '',
            sourceMechanics: {},
        };
    }

    /**
     * Returns false since static rules do not require sync checks.
     */
    protected override async needsSync(): Promise<boolean> {
        return false;
    }
}

export { CrusadeRulesDAO };
