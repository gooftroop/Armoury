import type { Account } from '@armoury/models';
import type { Friend } from '@armoury/models';
import type { Match } from '@armoury/models';
import type { UserPresence } from '@armoury/models';
import type { User } from '@armoury/models';
import type { Campaign, CampaignParticipant } from '@armoury/models';
import type { IGitHubClient } from '@armoury/clients-github';

/**
 * Supported database platforms for the adapter pattern.
 * Each platform is optimized for a specific deployment environment.
 */
export enum Platform {
    /** SQLite - file-based relational database for mobile and desktop applications */
    SQLite = 'sqlite',
    /** AuroraDSQL - AWS Aurora serverless database for server-side applications */
    AuroraDSQL = 'aurora-dsql',
    /** PGlite - WASM PostgreSQL for browser persistence and Node.js testing */
    PGlite = 'pglite',
}

/**
 * Tracks synchronization status of a data file.
 * Used to detect changes and avoid redundant downloads from GitHub.
 */
export interface FileSyncStatus {
    /** Unique identifier for the file (e.g., "wh40k10e.gst", "necrons.cat") */
    fileKey: string;
    /** SHA hash of the file content for change detection */
    sha: string;
    /** Timestamp of the last successful synchronization */
    lastSynced: Date;
    /** Optional ETag from GitHub for efficient cache validation */
    etag?: string;
}

/**
 * Result of a data synchronization operation.
 * Provides a summary of which DAOs synced successfully and which failed.
 * Used by the UI to display partial sync failures (toast) or total failures (error state).
 */
export interface SyncResult {
    /** Whether the sync operation completed without any failures. True only when failures is empty. */
    success: boolean;
    /** Total number of DAOs that were attempted. */
    total: number;
    /** Names of DAOs that synced successfully. */
    succeeded: string[];
    /** DAOs that failed to sync, with the DAO name and error message. */
    failures: Array<{ dao: string; error: string }>;
    /** ISO 8601 timestamp of when the sync operation completed. */
    timestamp: string;
}

/** Sort direction for ordered queries. */
export type SortDirection = 'asc' | 'desc';

/**
 * Options for querying entities with pagination and sorting.
 * All fields are optional — when omitted, defaults to no limit, no offset, no sorting.
 */
export interface QueryOptions<T> {
    /** Maximum number of entities to return. */
    limit?: number;
    /** Number of entities to skip before returning results. Used with limit for pagination. */
    offset?: number;
    /** Field to sort results by. Must be a key of the entity type. */
    orderBy?: keyof T;
    /** Sort direction. Defaults to 'asc' if orderBy is provided. */
    direction?: SortDirection;
}

/**
 * Extension point for plugin-defined entity type mappings.
 * Game system plugins augment this interface via declaration merging.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginEntityMap extends Record<never, never> {}

/**
 * Discriminated union type mapping entity type strings to their corresponding TypeScript types.
 * Used with generic database adapter methods to provide type-safe access to entities.
 */
export type CoreEntityMap = {
    fileSyncStatus: FileSyncStatus;
    account: Account;
    friend: Friend;
    user: User;
    match: Match;
    userPresence: UserPresence;
    campaign: Campaign;
    campaignParticipant: CampaignParticipant;
};

/**
 * Full entity map including core entities plus plugin-provided entities.
 * Plugin-provided entity types are registered by game system plugins.
 */
export type EntityMap = CoreEntityMap & PluginEntityMap;

/** Union type representing all supported entity types in the database. */
export type EntityType = keyof EntityMap;

/**
 * Core database adapter interface providing platform-agnostic CRUD operations and sync tracking.
 * Implementations support SQLite (mobile), PGlite (web), and Aurora DSQL (server).
 */
export interface DatabaseAdapter {
    readonly platform: Platform;
    initialize(): Promise<void>;
    close(): Promise<void>;
    get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null>;
    getAll<T extends EntityType>(store: T, options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]>;
    getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
        options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]>;
    count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number>;
    put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void>;
    putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void>;
    delete<T extends EntityType>(store: T, id: string): Promise<void>;
    deleteAll<T extends EntityType>(store: T): Promise<void>;
    deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void>;
    transaction<R>(fn: () => Promise<R>): Promise<R>;
    getSyncStatus(fileKey: string): Promise<FileSyncStatus | null>;
    setSyncStatus(fileKey: string, sha: string, etag?: string): Promise<void>;
    deleteSyncStatus(fileKey: string): Promise<void>;
}

/** SQLite schema extension contributed by core or a plugin. */
export interface SQLiteSchemaExtension {
    tables: Record<string, unknown>;
    storeToTable: Record<string, unknown>;
}

/** DSQL (Drizzle) schema extension contributed by core or a plugin. */
export interface DSQLSchemaExtension {
    tables: Record<string, unknown>;
    storeToTable: Record<string, unknown>;
}

/**
 * Umbrella schema extension — plugins provide whichever platforms they support.
 * At minimum, plugins should provide all three to support web, mobile, and server.
 */
export interface SchemaExtension {
    sqlite?: SQLiteSchemaExtension;
    dsql?: DSQLSchemaExtension;
}

/** DAO interface for army entity operations. */
export interface ArmyDAO {
    save(army: unknown): Promise<void>;
    saveMany(armies: unknown[]): Promise<void>;
    get(id: string): Promise<unknown>;
    list(): Promise<unknown[]>;
    listByOwner(ownerId: string): Promise<unknown[]>;
    listByFaction(factionId: string): Promise<unknown[]>;
    delete(id: string): Promise<void>;
    deleteAll(): Promise<void>;
    count(): Promise<number>;
}

/** DAO interface for campaign entity operations. */
export interface CampaignDAO {
    save(campaign: unknown): Promise<void>;
    saveMany(campaigns: unknown[]): Promise<void>;
    get(id: string): Promise<unknown>;
    list(): Promise<unknown[]>;
    listByOrganizer(organizerId: string): Promise<unknown[]>;
    listByStatus(status: string): Promise<unknown[]>;
    listByType(type: string): Promise<unknown[]>;
    delete(id: string): Promise<void>;
    deleteAll(): Promise<void>;
    count(): Promise<number>;
}

/**
 * Result of a game system's createGameContext() call.
 * Provides the system-specific DAOs and game data context
 * that the DataContextBuilder wires into the DataContext.
 */
export interface GameContextResult<TGameData = unknown> {
    armies?: ArmyDAO;
    campaigns?: CampaignDAO;
    game?: TGameData;
    /** Eagerly syncs all reference data. Called by DataContextBuilder before returning. */
    sync?: () => Promise<SyncResult>;
}

/** Defines a kind of entity that a game system plugin registers. */
export interface EntityKindDefinition {
    kind: string;
    displayName: string;
    requiresHydration: boolean;
}

/** Configuration for a game system's community data source. */
export interface DataSourceConfig {
    type: 'github';
    owner: string;
    repo: string;
    coreFile: string;
    description: string;
    licenseStatus: string;
}

/** A validation rule provided by a game system plugin. */
export interface PluginValidationRule {
    id: string;
    name: string;
    validate: (army: unknown, factionData: unknown) => ValidationRuleResult[];
}

/** Result from a single validation rule check. */
export interface ValidationRuleResult {
    ruleId: string;
    passed: boolean;
    severity: 'error' | 'warning' | 'info';
    message: string;
}

/** Hydrator function for deserializing complex entities from storage. */
export type EntityHydrator<T = unknown> = (raw: Record<string, unknown>) => T;

/**
 * Core interface that all game system implementations must implement.
 * Provides data source configuration, entity definitions, validation rules,
 * and schema/hydration hooks used by the core data layer.
 */
export interface GameSystem {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly dataSource: DataSourceConfig;
    entityKinds: EntityKindDefinition[];
    validationRules: PluginValidationRule[];
    getHydrators(): Map<string, EntityHydrator>;
    getSchemaExtension(): SchemaExtension;
    register(): void | Promise<void>;
    createGameContext(adapter: DatabaseAdapter, githubClient: IGitHubClient): GameContextResult;
}

/**
 * Static display metadata for a game system plugin.
 * Stored as manifest.json in each system's public/ folder and copied to
 * web/mobile at build time. The landing page reads these manifests to
 * discover available systems without hardcoding.
 *
 * NOTE: The game system's display name (e.g., "Warhammer 40,000") is NOT
 * included here — it comes from BSData core rules at runtime. The manifest
 * only contains presentation metadata that is independent of BSData.
 */
export interface GameSystemManifest {
    /** Unique system identifier matching the GameSystem.id (e.g., 'wh40k10e'). */
    id: string;
    /** Short splash text displayed on the tile hero area (e.g., '40K'). */
    splashText: string;
    /** Human-readable system title displayed on the tile card (e.g., 'Warhammer 40,000'). */
    title: string;
    /** Edition or version subtitle displayed below the title (e.g., '10th Edition'). */
    subtitle: string;
    /** Brief description of the system displayed on the tile card. */
    description: string;
    /** CSS gradient start color for the tile hero (oklch format). */
    gradientStart: string;
    /** CSS gradient midpoint color for the tile hero (oklch format). */
    gradientMid: string;
    /** CSS gradient end color for the tile hero (oklch format). */
    gradientEnd: string;
    /** Color of the splash text overlay (oklch format with alpha). */
    splashTextColor: string;
    /** Accent style for the tile top border. */
    accent: 'gold' | 'muted';
    /** Path to the system's CSS theme overlay file, relative to manifest. */
    themeCSS: string;
    /** Path to the system's Tamagui theme partial file, relative to manifest. */
    themeTamagui: string;
    /** Path to the system's React Native StyleSheet theme file, relative to manifest. */
    themeStyleSheet: string;
    /** Semantic version of the manifest format. */
    manifestVersion: string;
}

export type { IGitHubClient, GitHubFileInfo } from '@armoury/clients-github';

/** Error thrown when database operations fail. */
export class DatabaseError extends Error {
    readonly operation: string;

    constructor(message: string, operation: string) {
        super(message);
        this.name = 'DatabaseError';
        this.operation = operation;
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

/** Type guard to narrow an unknown error to DatabaseError. */
export function isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
}
