import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IWahapediaClient } from '@armoury/clients-wahapedia';
import type { ChapterApproved } from '@/models/ChapterApproved.js';
import { hydrateChapterApproved } from '@/models/ChapterApproved.js';
import { ChapterApprovedParser } from '@/data/ChapterApprovedParser.js';
import { TTLSyncBaseDAO } from '@armoury/data-dao';

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
const { pgTable, text, jsonb } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

/** Drizzle table mapping for chapter approved entities. */
export const chapterApprovedTable = pgTable('chapter_approved', {
    id: text('id').primaryKey(),
    version: text('version').notNull(),
    primaryMissions: jsonb('primary_missions'),
    secondaryMissions: jsonb('secondary_missions'),
    deploymentZones: jsonb('deployment_zones'),
    challengerCards: jsonb('challenger_cards'),
    twistCards: jsonb('twist_cards'),
    tournamentMissions: jsonb('tournament_missions'),
    terrainLayouts: jsonb('terrain_layouts'),
});

/** Drizzle SQLite table mapping for chapter approved entities. */
export const chapterApprovedSqliteTable = sl.sqliteTable('chapter_approved', {
    id: sl.text('id').primaryKey(),
    version: sl.text('version').notNull(),
    primaryMissions: sl.text('primary_missions'),
    secondaryMissions: sl.text('secondary_missions'),
    deploymentZones: sl.text('deployment_zones'),
    challengerCards: sl.text('challenger_cards'),
    twistCards: sl.text('twist_cards'),
    tournamentMissions: sl.text('tournament_missions'),
    terrainLayouts: sl.text('terrain_layouts'),
});

const WAHAPEDIA_CA_URL = 'https://wahapedia.ru/wh40k10ed/the-rules/chapter-approved-2025-26/';
const CHAPTER_APPROVED_ID = 'chapter-approved-2025-26';
const SYNC_KEY = 'wahapedia:chapter-approved-2025-26';

/** Re-fetch from Wahapedia if cached data is older than 7 days. */
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * DAO for syncing and caching Chapter Approved mission data from Wahapedia.
 * Uses TTL-based sync (7 days) instead of SHA-based checks since Wahapedia is not a Git repository.
 * Extends TTLSyncBaseDAO for shared load/sync/memoization infrastructure.
 */
class ChapterApprovedDAO extends TTLSyncBaseDAO<ChapterApproved> {
    private readonly wahapediaClient: IWahapediaClient;
    private readonly parser: ChapterApprovedParser;

    /**
     * Creates a Chapter Approved DAO.
     * @param adapter - Database adapter instance
     * @param wahapediaClient - Wahapedia client for fetching mission data
     */
    constructor(adapter: DatabaseAdapter, wahapediaClient: IWahapediaClient) {
        super(adapter, STALE_AFTER_MS);
        this.wahapediaClient = wahapediaClient;
        this.parser = new ChapterApprovedParser();
    }

    /** Returns the adapter store key for chapter approved data. */
    protected getStoreKey(): string {
        return 'chapterApproved';
    }

    /** Returns the sync file key for chapter approved data. */
    protected getSyncFileKey(): string {
        return SYNC_KEY;
    }

    /** Returns the entity ID for chapter approved data. */
    protected override getEntityId(): string {
        return CHAPTER_APPROVED_ID;
    }

    /**
     * Fetches Chapter Approved data from Wahapedia and hydrates it.
     * @returns Hydrated ChapterApproved from Wahapedia
     * @throws Error if Wahapedia fetch fails
     */
    protected override async fetchRemoteData(): Promise<ChapterApproved> {
        const parsed = await this.wahapediaClient.fetch(WAHAPEDIA_CA_URL, this.parser);

        return hydrateChapterApproved({ ...parsed, id: CHAPTER_APPROVED_ID });
    }
}

export { ChapterApprovedDAO };
