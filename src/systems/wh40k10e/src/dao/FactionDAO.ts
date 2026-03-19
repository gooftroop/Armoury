import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import type { FactionConfig } from '@/config/factionMap.js';
import { parseCatalogue } from '@armoury/providers-bsdata';
import { mergeCatalogues } from '@/models/mergeCatalogues.js';
import type { FactionData } from '@/models/FactionData.js';
import { parseFactionData } from '@/data/FactionDataParser.js';
import type { BattleScribeCatalogue } from '@armoury/providers-bsdata';
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
const { pgTable, text } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/** Drizzle table mapping for faction entities. */
export const factionsTable = pgTable('factions', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    sourceFile: text('source_file').notNull(),
    sourceSha: text('source_sha').notNull(),
    catalogueFile: text('catalogue_file').notNull(),
});

/** Drizzle SQLite table mapping for faction entities. */
export const factionsSqliteTable = sl.sqliteTable('factions', {
    id: sl.text('id').primaryKey(),
    name: sl.text('name').notNull(),
    sourceFile: sl.text('source_file').notNull(),
    sourceSha: sl.text('source_sha').notNull(),
    catalogueFile: sl.text('catalogue_file').notNull(),
});

/**
 * DAO for syncing and caching Warhammer 40K faction data models.
 * Handles multi-catalogue merging and stores extracted units, weapons, and abilities.
 *
 * Uses a static download cache so catalogue files shared across factions
 * (e.g. 'Imperium - Space Marines.cat' used by SM + 11 chapters) are
 * downloaded exactly once per sync cycle.
 */
class FactionDAO extends BaseDAO<FactionData> {
    /**
     * Module-scoped download cache shared across all FactionDAO instances.
     * Maps encoded file names to their in-flight or resolved download promises.
     * Prevents duplicate downloads when multiple factions reference the same
     * catalogue file (e.g. Space Marines base shared by all chapter DAOs).
     */
    private static readonly downloadCache = new Map<string, Promise<string>>();

    private readonly factionConfig: FactionConfig;

    /**
     * Creates a faction DAO for the provided faction configuration.
     * @param adapter - Database adapter instance
     * @param githubClient - GitHub client for BSData access
     * @param factionConfig - Faction configuration with source files to download and merge
     */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient, factionConfig: FactionConfig) {
        super(adapter, githubClient);
        this.factionConfig = factionConfig;
    }

    /** Returns the adapter store key for faction models. */
    protected getStoreKey(): string {
        return 'factionModel';
    }

    /** Returns the sync file key scoped to the faction config ID. */
    protected getSyncFileKey(): string {
        return `factionModel:${this.factionConfig.id}`;
    }

    /** Returns the faction config ID as the entity storage key. */
    protected override getEntityId(): string {
        return this.factionConfig.id;
    }

    /**
     * Loads the faction model and ensures related entities are stored in the database.
     * Calls parent load() then stores units, weapons, and abilities in a transaction.
     * @returns Loaded FactionData with all entities persisted
     */
    override async load(): Promise<FactionData> {
        const model = await super.load();
        await this.storeFactionEntities(model);

        return model;
    }

    /**
     * Downloads and parses all faction catalogues, merges them, and builds a FactionData.
     * Handles multi-file factions by downloading each catalogue file and merging them.
     * @returns Merged FactionData with all units, weapons, and abilities
     * @throws Error if any catalogue file download or parsing fails
     */
    protected override async fetchRemoteData(): Promise<FactionData> {
        const catalogues: BattleScribeCatalogue[] = [];

        for (const fileName of this.factionConfig.files) {
            const encodedFileName = encodeURIComponent(fileName);
            const content = await FactionDAO.cachedDownload(this.githubClient, this.owner, this.repo, encodedFileName);
            const catalogue = parseCatalogue(content);
            catalogues.push(catalogue);
            const sha = await this.githubClient.getFileSha(this.owner, this.repo, encodedFileName);
            await this.adapter.setSyncStatus(`factionModel:${fileName}`, sha);
        }

        const mergedCatalogue = mergeCatalogues(...catalogues);
        const factionModel = parseFactionData(mergedCatalogue, this.factionConfig.files);
        factionModel.id = this.factionConfig.id;

        return factionModel;
    }

    /**
     * Uses the primary file for sync status lookup.
     */
    protected override getRemoteFilePath(): string {
        return encodeURIComponent(this.getPrimaryFile());
    }

    /**
     * Extracts and stores units, weapons, and abilities for this faction.
     * @param model - Faction data model
     */
    private async storeFactionEntities(model: FactionData): Promise<void> {
        const factionId = this.factionConfig.id;

        await this.adapter.transaction(async () => {
            await this.adapter.deleteByField('unit', 'factionId', factionId);

            for (const unit of model.units) {
                await this.adapter.put('unit', { ...unit, factionId });
            }

            for (const weapon of model.weapons) {
                await this.adapter.put('weapon', weapon);
            }

            for (const ability of model.abilities) {
                await this.adapter.put('ability', ability);
            }
        });
    }

    /**
     * Returns the primary catalogue file for this faction.
     */
    private getPrimaryFile(): string {
        return this.factionConfig.files[0];
    }

    /**
     * Downloads a file using the shared cache.
     * If the file is already being downloaded (or has been downloaded), returns
     * the existing promise. Otherwise starts a new download and caches the promise.
     *
     * On failure the cache entry is evicted so the next caller retries.
     */
    private static cachedDownload(
        githubClient: IGitHubClient,
        owner: string,
        repo: string,
        encodedFileName: string,
    ): Promise<string> {
        const cacheKey = `${owner}/${repo}/${encodedFileName}`;
        const existing = FactionDAO.downloadCache.get(cacheKey);

        if (existing) {
            return existing;
        }

        const promise = githubClient.downloadFile(owner, repo, encodedFileName).catch((error) => {
            // Evict on failure so the next caller retries instead of getting a cached rejection.
            FactionDAO.downloadCache.delete(cacheKey);
            throw error;
        });

        FactionDAO.downloadCache.set(cacheKey, promise);

        return promise;
    }

    /**
     * Clears the static download cache.
     * Intended for testing or when a full re-download is needed.
     */
    static clearDownloadCache(): void {
        FactionDAO.downloadCache.clear();
    }
}

export { FactionDAO };
