/**
 * Aurora DSQL database adapter using Drizzle ORM and pg driver. Connects to Aurora DSQL via IAM auth tokens from @aws-sdk/dsql-signer.
 *
 * Type casts (`as unknown as`): Drizzle query results are typed as their table schema rows.
 * Casts narrow them to EntityMap types after codec hydration. This is safe because the
 * schema registry guarantees Drizzle table definitions match entity shapes.
 */

import { BaseDatabaseAdapter, type EntityMap, type EntityType, type QueryOptions } from '@data/adapter.js';
import { Platform } from '@data/types.js';
import { getEntityCodec } from '@data/codec.js';
import type { FileSyncStatus } from '@data/types.js';
import { DatabaseError } from '@data/types.js';
import { syncStatusTable } from '@data/dao/SyncStatusTable.js';
import { getMergedDSQLSchema } from '@data/schema.js';

/**
 * Aurora DSQL authentication token signer
 */
type DsqlSigner = {
    getDbConnectAdminAuthToken: () => Promise<string>;
};

/**
 * Constructor for DsqlSigner
 */
type DsqlSignerConstructor = new (config: { hostname: string; region: string }) => DsqlSigner;

/**
 * PostgreSQL client connection
 */
type PgClient = {
    connect: () => Promise<void>;
    end: () => Promise<void>;
};

/**
 * Constructor for PostgreSQL client
 */
type PgClientConstructor = new (config: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    ssl: boolean;
}) => PgClient;

/**
 * Drizzle select query builder with offset support
 */
type SelectOffsetBuilder = Promise<Record<string, unknown>[]> & {
    offset: (count: number) => Promise<Record<string, unknown>[]>;
    orderBy: (column: unknown) => SelectLimitBuilder;
    limit: (count: number) => SelectOffsetBuilder;
};

/**
 * Drizzle select query builder with limit support
 */
type SelectLimitBuilder = Promise<Record<string, unknown>[]> & {
    limit: (count: number) => SelectOffsetBuilder;
    orderBy: (column: unknown) => SelectLimitBuilder;
    offset: (count: number) => Promise<Record<string, unknown>[]>;
};

/**
 * Drizzle select query builder with orderBy support
 */
type SelectOrderByBuilder = Promise<Record<string, unknown>[]> & {
    orderBy: (column: unknown) => SelectLimitBuilder;
    limit: (count: number) => SelectOffsetBuilder;
    offset: (count: number) => Promise<Record<string, unknown>[]>;
};

/**
 * Drizzle select query builder with where clause support
 */
type SelectWhereBuilder = Promise<Record<string, unknown>[]> & {
    where: (condition: unknown) => SelectOrderByBuilder;
};

/**
 * Drizzle ORM database instance with query methods
 */
type DrizzleDatabase = {
    select: () => {
        from: (table: unknown) => SelectWhereBuilder;
    };
    insert: (table: unknown) => {
        values: (values: Record<string, unknown>) => {
            onConflictDoUpdate: (options: { target: unknown; set: Record<string, unknown> }) => Promise<void>;
        };
    };
    delete: (table: unknown) => {
        where: (condition: unknown) => Promise<void>;
    };
    transaction: <T>(fn: (tx: DrizzleDatabase) => Promise<T>) => Promise<T>;
};

/**
 * Minimal Drizzle table shape for adapter queries.
 */
type DrizzleTable = {
    id: unknown;
} & Record<string, unknown>;

/**
 * Factory function to create a Drizzle database from a pg client
 */
type DrizzleFactory = (client: PgClient, options: { schema: Record<string, unknown> }) => DrizzleDatabase;

/**
 * Drizzle equality comparison function
 */
type EqBuilder = (column: unknown, value: unknown) => unknown;

/**
 * Drizzle orderBy helper function
 */
type OrderByFn = (column: unknown) => unknown;

const { DsqlSigner } = (await import('@aws-sdk/dsql-signer')) as unknown as { DsqlSigner: DsqlSignerConstructor };
const { Client } = (await import('pg')) as unknown as { Client: PgClientConstructor };
const { drizzle } = (await import('drizzle-orm/node-postgres')) as unknown as { drizzle: DrizzleFactory };
const {
    eq,
    asc: drizzleAsc,
    desc: drizzleDesc,
} = (await import('drizzle-orm')) as unknown as {
    eq: EqBuilder;
    asc: OrderByFn;
    desc: OrderByFn;
};

/**
 * IAM-authenticated configuration for production Aurora DSQL connections.
 */
export interface DSQLIAMConfig {
    /** The Aurora DSQL cluster endpoint hostname. */
    clusterEndpoint: string;
    /** The AWS region of the DSQL cluster. */
    region: string;
    /** Override the default PostgreSQL port (5432). Useful for local testing with non-standard port mappings. */
    port?: number;
    /** Whether to use SSL for the connection. Defaults to `true` for production DSQL. */
    ssl?: boolean;
}

/**
 * Raw credential configuration for e2e testing against local PostgreSQL.
 */
export interface DSQLRawConfig {
    /** PostgreSQL hostname. */
    host: string;
    /** PostgreSQL port. */
    port: number;
    /** PostgreSQL username. */
    user: string;
    /** PostgreSQL password. */
    password: string;
    /** PostgreSQL database name. */
    database: string;
    /** Whether to use SSL for the connection. */
    ssl?: boolean;
}

/**
 * Configuration for the Aurora DSQL adapter. Accepts either IAM-based auth (production)
 * or raw credentials (e2e testing against Docker PostgreSQL).
 */
export type DSQLAdapterConfig = DSQLIAMConfig | DSQLRawConfig;

/**
 * Type alias for the active Drizzle database instance
 */
type DsqlDatabase = DrizzleDatabase;

/**
 * Database adapter for Amazon Aurora DSQL using Drizzle ORM. Authenticates via IAM-based auth tokens and uses the pg driver for PostgreSQL-compatible queries.
 */
export class DSQLAdapter extends BaseDatabaseAdapter {
    /**
     * The platform identifier for this adapter
     */
    readonly platform = Platform.AuroraDSQL;
    /**
     * Aurora DSQL connection configuration
     */
    private readonly config: DSQLAdapterConfig;
    /**
     * PostgreSQL client connection instance
     */
    private client: PgClient | null = null;
    /**
     * Drizzle ORM database instance
     */
    private db: DsqlDatabase | null = null;
    /**
     * Store-to-table mapping merged from core and plugin schemas
     */
    private storeToTable: Record<string, DrizzleTable> = {};
    /**
     * All Drizzle table definitions merged from core and plugin schemas
     */
    private allTables: Record<string, unknown> = {};
    /**
     * Currently active transaction context, if any
     */
    private activeTransaction: DsqlDatabase | null = null;

    /**
     * Creates a new DSQL adapter with the given configuration
     */
    constructor(config: DSQLAdapterConfig) {
        super();
        this.config = config;
    }

    /**
     * Connects to Aurora DSQL using IAM auth token and initializes Drizzle ORM
     */
    async initialize(): Promise<void> {
        try {
            let client: PgClient;

            if ('clusterEndpoint' in this.config) {
                const signer = new DsqlSigner({
                    hostname: this.config.clusterEndpoint,
                    region: this.config.region,
                });
                const token = await signer.getDbConnectAdminAuthToken();
                client = new Client({
                    host: this.config.clusterEndpoint,
                    user: 'admin',
                    password: token,
                    database: 'postgres',
                    port: this.config.port ?? 5432,
                    ssl: this.config.ssl ?? true,
                });
            } else {
                client = new Client({
                    host: this.config.host,
                    user: this.config.user,
                    password: this.config.password,
                    database: this.config.database,
                    port: this.config.port,
                    ssl: this.config.ssl ?? false,
                });
            }

            await client.connect();
            this.client = client;
            const mergedSchema = getMergedDSQLSchema();
            this.storeToTable = this.ensureStoreToTable(mergedSchema.storeToTable);
            this.allTables = mergedSchema.tables;
            this.db = drizzle(client, { schema: this.allTables });
        } catch (error) {
            throw new DatabaseError(
                `Failed to initialize Aurora DSQL: ${error instanceof Error ? error.message : String(error)}`,
                'INITIALIZE',
            );
        }
    }

    /**
     * Closes the PostgreSQL client connection
     */
    async close(): Promise<void> {
        if (this.client) {
            await this.client.end();
            this.client = null;
            this.db = null;
        }
    }

    /**
     * Retrieves a single entity by ID from the specified store
     */
    async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            const results = await db.select().from(table).where(eq(table.id, id)).limit(1);
            const row = results[0];

            return row ? this.deserializeEntity(store, row) : null;
        } catch (error) {
            throw new DatabaseError(
                `Failed to get ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'SELECT',
            );
        }
    }

    /**
     * Retrieves all entities from the specified store
     */
    async getAll<T extends EntityType>(store: T, options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            let query = db.select().from(table).where(eq(table.id, table.id));

            if (options?.orderBy) {
                const column = table[options.orderBy as keyof typeof table];
                const orderFn = options.direction === 'desc' ? drizzleDesc : drizzleAsc;
                query = query.orderBy(orderFn(column)) as typeof query;
            }

            if (options?.limit !== undefined) {
                query = query.limit(options.limit) as typeof query;
            }

            if (options?.offset !== undefined) {
                query = query.offset(options.offset) as typeof query;
            }

            const rows = await query;

            return rows.map((row) => this.deserializeEntity(store, row));
        } catch (error) {
            throw new DatabaseError(
                `Failed to getAll ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'SELECT',
            );
        }
    }

    /**
     * Retrieves entities matching a specific field value
     */
    async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
        options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            const column = table[field as keyof typeof table];
            let query = db.select().from(table).where(eq(column, value));

            if (options?.orderBy) {
                const orderColumn = table[options.orderBy as keyof typeof table];
                const orderFn = options.direction === 'desc' ? drizzleDesc : drizzleAsc;
                query = query.orderBy(orderFn(orderColumn)) as typeof query;
            }

            if (options?.limit !== undefined) {
                query = query.limit(options.limit) as typeof query;
            }

            if (options?.offset !== undefined) {
                query = query.offset(options.offset) as typeof query;
            }

            const rows = await query;

            return rows.map((row) => this.deserializeEntity(store, row));
        } catch (error) {
            throw new DatabaseError(
                `Failed to getByField ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'SELECT',
            );
        }
    }

    /**
     * Inserts or updates an entity in the specified store (upsert)
     */
    async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        const table = this.getTable(store);
        const db = this.getDatabase();
        const serialized = this.serializeEntity(store, entity);

        try {
            await db.insert(table).values(serialized).onConflictDoUpdate({
                target: table.id,
                set: serialized,
            });
        } catch (error) {
            throw new DatabaseError(
                `Failed to put ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'INSERT',
            );
        }
    }

    /**
     * Inserts or updates multiple entities within a transaction
     */
    async putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void> {
        await this.transaction(async () => {
            for (const entity of entities) {
                await this.put(store, entity);
            }
        });
    }

    /**
     * Deletes a single entity by ID
     */
    async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            await db.delete(table).where(eq(table.id, id));
        } catch (error) {
            throw new DatabaseError(
                `Failed to delete ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    /**
     * Deletes all entities from the specified store
     */
    async deleteAll<T extends EntityType>(store: T): Promise<void> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            await db.delete(table).where(eq(table.id, table.id));
        } catch (error) {
            throw new DatabaseError(
                `Failed to deleteAll ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    /**
     * Deletes entities matching a specific field value
     */
    async deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            const column = table[field as keyof typeof table];
            await db.delete(table).where(eq(column, value));
        } catch (error) {
            throw new DatabaseError(
                `Failed to deleteByField ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    /**
     * Executes a function within a database transaction
     */
    async transaction<R>(fn: () => Promise<R>): Promise<R> {
        const db = this.getDatabase();

        return db.transaction(async (tx) => {
            const previous = this.activeTransaction;
            this.activeTransaction = tx;

            try {
                return await fn();
            } finally {
                this.activeTransaction = previous;
            }
        });
    }

    /**
     * Retrieves the sync status for a BattleScribe data file
     */
    async getSyncStatus(fileKey: string): Promise<FileSyncStatus | null> {
        const db = this.getDatabase();

        try {
            const results = await db
                .select()
                .from(syncStatusTable)
                .where(eq(syncStatusTable.fileKey, fileKey))
                .limit(1);
            const record = results[0];

            if (!record) {
                return null;
            }

            return {
                fileKey: String(record.fileKey),
                sha: String(record.sha),
                lastSynced: new Date(String(record.lastSynced)),
                etag: record.etag ? String(record.etag) : undefined,
            };
        } catch (error) {
            throw new DatabaseError(
                `Failed to getSyncStatus: ${error instanceof Error ? error.message : String(error)}`,
                'SELECT',
            );
        }
    }

    /**
     * Updates the sync status for a BattleScribe data file
     */
    async setSyncStatus(fileKey: string, sha: string, etag?: string): Promise<void> {
        const db = this.getDatabase();

        try {
            await db
                .insert(syncStatusTable)
                .values({
                    fileKey,
                    sha,
                    lastSynced: new Date().toISOString(),
                    etag,
                })
                .onConflictDoUpdate({
                    target: syncStatusTable.fileKey,
                    set: {
                        sha,
                        lastSynced: new Date().toISOString(),
                        etag,
                    },
                });
        } catch (error) {
            throw new DatabaseError(
                `Failed to setSyncStatus: ${error instanceof Error ? error.message : String(error)}`,
                'INSERT',
            );
        }
    }

    /**
     * Removes the sync status entry for a BattleScribe data file
     */
    async deleteSyncStatus(fileKey: string): Promise<void> {
        const db = this.getDatabase();

        try {
            await db.delete(syncStatusTable).where(eq(syncStatusTable.fileKey, fileKey));
        } catch (error) {
            throw new DatabaseError(
                `Failed to deleteSyncStatus: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    /**
     * Returns the active database context (transaction or main connection)
     */
    private getDatabase(): DsqlDatabase {
        if (!this.db) {
            throw new DatabaseError('Aurora DSQL adapter not initialized', 'INITIALIZE');
        }

        return this.activeTransaction ?? this.db;
    }

    /**
     * Resolves the Drizzle table reference for an entity store.
     */
    private getTable(store: EntityType): DrizzleTable {
        const table = this.storeToTable[store as string];

        if (!table) {
            throw new DatabaseError(`Unknown entity store: ${store}. Is the plugin schema registered?`, 'SELECT');
        }

        return table;
    }

    /**
     * Ensures registered tables have the minimal Drizzle table shape.
     */
    private ensureStoreToTable(storeToTable: Record<string, unknown>): Record<string, DrizzleTable> {
        const resolved: Record<string, DrizzleTable> = {};

        for (const [store, table] of Object.entries(storeToTable)) {
            if (!this.isDrizzleTable(table)) {
                throw new DatabaseError(
                    `Invalid DSQL table registered for store: ${store}. Is the plugin schema registered?`,
                    'INITIALIZE',
                );
            }

            resolved[store] = table;
        }

        return resolved;
    }

    /**
     * Type guard for Drizzle table values.
     */
    private isDrizzleTable(value: unknown): value is DrizzleTable {
        return typeof value === 'object' && value !== null && 'id' in value;
    }

    /**
     * Converts an entity to a plain object for database storage
     */
    private serializeEntity<T extends EntityType>(store: T, entity: EntityMap[T]): Record<string, unknown> {
        let base: Record<string, unknown>;

        const codec = getEntityCodec(store);

        if (codec) {
            base = codec.serialize(entity) as Record<string, unknown>;
        } else {
            base = { ...entity } as Record<string, unknown>;
        }

        const serialized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(base)) {
            serialized[key] = this.normalizeSerializedValue(value);
        }

        return serialized;
    }

    /**
     * Converts a database row back to an entity object
     */
    private deserializeEntity<T extends EntityType>(store: T, row: Record<string, unknown>): EntityMap[T] {
        const entity: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(row)) {
            entity[key] = this.normalizeDeserializedValue(value);
        }

        const codec = getEntityCodec(store);

        if (codec) {
            return codec.hydrate(entity) as EntityMap[T];
        }

        return entity as unknown as EntityMap[T];
    }

    /**
     * Normalizes serialized values for storage, converting dates and JSON-like values.
     */
    private normalizeSerializedValue(value: unknown): unknown {
        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Array.isArray(value)) {
            return JSON.stringify(value);
        }

        if (value && typeof value === 'object') {
            return JSON.stringify(value);
        }

        return value;
    }

    /**
     * Normalizes deserialized values by parsing JSON strings into objects or arrays.
     */
    private normalizeDeserializedValue(value: unknown): unknown {
        if (typeof value !== 'string') {
            return value;
        }

        const trimmed = value.trim();

        if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
            return value;
        }

        try {
            const parsed = JSON.parse(trimmed) as unknown;

            if (parsed && typeof parsed === 'object') {
                return parsed;
            }

            return value;
        } catch {
            return value;
        }
    }

    /**
     * Returns the count of entities in the specified store, optionally filtered by a field.
     * Note: This currently performs a full select to count rows; can be optimized with raw SQL count.
     */
    async count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            const query = db.select().from(table);

            if (field && value !== undefined) {
                const column = table[field as keyof typeof table];
                const rows = await query.where(eq(column, value));

                return rows.length;
            }

            const rows = await query.where(eq(table.id, table.id));

            return rows.length;
        } catch (error) {
            throw new DatabaseError(
                `Failed to count ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'SELECT',
            );
        }
    }
}
