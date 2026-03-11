import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { Faction } from '@/types/entities.js';
import { parseGameSystem } from '@armoury/providers-bsdata/xmlParser';
import type { CoreRules } from '@/models/CoreRules.js';
import { parseCoreRules } from '@/data/CoreRulesParser.js';
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
const { pgTable, text, jsonb, timestamp } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/** Drizzle table mapping for core rules entities. */
export const coreRulesTable = pgTable('core_rules', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    revision: text('revision').notNull(),
    battleScribeVersion: text('battle_scribe_version').notNull(),
    profileTypes: jsonb('profile_types'),
    costTypes: jsonb('cost_types'),
    sharedRules: jsonb('shared_rules'),
    categories: jsonb('categories'),
    constraints: jsonb('constraints'),
    sourceFile: text('source_file').notNull(),
    lastSynced: timestamp('last_synced', { mode: 'string' }),
});

/** Drizzle SQLite table mapping for core rules entities. */
export const coreRulesSqliteTable = sl.sqliteTable('core_rules', {
    id: sl.text('id').primaryKey(),
    name: sl.text('name').notNull(),
    revision: sl.text('revision').notNull(),
    battleScribeVersion: sl.text('battle_scribe_version').notNull(),
    profileTypes: sl.text('profile_types'),
    costTypes: sl.text('cost_types'),
    sharedRules: sl.text('shared_rules'),
    categories: sl.text('categories'),
    constraints: sl.text('constraints'),
    sourceFile: sl.text('source_file').notNull(),
    lastSynced: sl.text('last_synced'),
});

const CORE_RULES_FILE = 'Warhammer%2040%2C000.gst';

/**
 * DAO for syncing and caching Warhammer 40K core rules.
 * Fetches the core rules GST file from BSData, parses it, and discovers faction catalogues.
 */
class CoreRulesDAO extends BaseDAO<CoreRules> {
    /**
     * Creates a core rules DAO.
     * @param adapter - Database adapter instance
     * @param githubClient - GitHub client for BSData access
     */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        super(adapter, githubClient);
    }

    /** Returns the adapter store key for core rules. */
    protected getStoreKey(): string {
        return 'coreRules';
    }

    /** Returns the sync file key for core rules. */
    protected getSyncFileKey(): string {
        return 'core:wh40k-10e.gst';
    }

    /** Returns the remote file path for core rules. */
    protected override getRemoteFilePath(): string {
        return CORE_RULES_FILE;
    }

    /**
     * Downloads and parses the core rules GST file from BSData.
     * Also discovers and caches all faction catalogue files from the repository.
     * @returns Parsed CoreRules
     * @throws Error if file download or parsing fails
     */
    protected override async fetchRemoteData(): Promise<CoreRules> {
        const content = await this.githubClient.downloadFile(this.owner, this.repo, CORE_RULES_FILE);
        const gameSystem = parseGameSystem(content);
        const coreRules = parseCoreRules(gameSystem, CORE_RULES_FILE);

        await this.discoverFactions();

        return coreRules;
    }

    /**
     * Discovers faction catalogue files from the BSData repository.
     */
    private async discoverFactions(): Promise<void> {
        const files = await this.githubClient.listFiles(this.owner, this.repo, '');
        const factions: Faction[] = [];

        for (const file of files) {
            if (file.name.endsWith('.cat') && file.type === 'file') {
                const name = file.name
                    .replace('.cat', '')
                    .replace(/^Imperium - /, '')
                    .replace(/^Chaos - /, '')
                    .replace(/^Xenos - /, '');

                factions.push({
                    id: file.sha,
                    name,
                    sourceFile: file.name,
                    sourceSha: file.sha,
                    catalogueFile: file.name,
                });
            }
        }

        await this.adapter.transaction(async () => {
            await this.adapter.deleteAll('faction');
            await this.adapter.putMany('faction', factions);
        });
    }
}

export { CoreRulesDAO };
