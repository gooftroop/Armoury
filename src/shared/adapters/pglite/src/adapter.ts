/**
 * Database adapter for PGlite using Drizzle ORM.
 *
 * Supports browser persistence via IndexedDB and Node.js testing via in-memory databases.
 * All platform-specific PGlite concerns are isolated here.
 */

import { BaseDatabaseAdapter, type EntityMap, type EntityType, type QueryOptions } from '@armoury/data-dao';
import { Platform } from '@armoury/data-dao';
import { getEntityCodec } from '@armoury/data-dao';
import type { FileSyncStatus } from '@armoury/data-dao';
import { DatabaseError } from '@armoury/data-dao';
import { getMergedDSQLSchema } from '@armoury/data-dao';
import { generateAllTablesDDL } from '@/ddl.js';

type PGliteInstance = {
    close: () => Promise<void>;
    exec: (sql: string) => Promise<void>;
};

type PGliteConstructor = new (dataDir?: string, options?: { relaxedDurability?: boolean }) => PGliteInstance;

type SelectOffsetBuilder = Promise<Record<string, unknown>[]> & {
    offset: (count: number) => Promise<Record<string, unknown>[]>;
    orderBy: (column: unknown) => SelectLimitBuilder;
    limit: (count: number) => SelectOffsetBuilder;
};

type SelectLimitBuilder = Promise<Record<string, unknown>[]> & {
    limit: (count: number) => SelectOffsetBuilder;
    orderBy: (column: unknown) => SelectLimitBuilder;
    offset: (count: number) => Promise<Record<string, unknown>[]>;
};

type SelectOrderByBuilder = Promise<Record<string, unknown>[]> & {
    orderBy: (column: unknown) => SelectLimitBuilder;
    limit: (count: number) => SelectOffsetBuilder;
    offset: (count: number) => Promise<Record<string, unknown>[]>;
};

type SelectWhereBuilder = Promise<Record<string, unknown>[]> & {
    where: (condition: unknown) => SelectOrderByBuilder;
};

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

type DrizzleTable = Record<string, unknown>;

type DrizzleFactory = (client: PGliteInstance, options: { schema: Record<string, unknown> }) => DrizzleDatabase;

type EqBuilder = (column: unknown, value: unknown) => unknown;

type OrderByFn = (column: unknown) => unknown;

type MigrateFunction = (db: DrizzleDatabase, config: { migrationsFolder: string }) => Promise<void>;

const { PGlite } = (await import('@electric-sql/pglite')) as unknown as { PGlite: PGliteConstructor };
const { drizzle } = (await import('drizzle-orm/pglite')) as unknown as { drizzle: DrizzleFactory };
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
 * Configuration for the PGlite adapter
 */
export interface PGliteAdapterConfig {
    /** Database path. Use 'memory://' for in-memory, 'idb://dbname' for IndexedDB persistence. */
    dataDir?: string;
    /** Optional migrations folder to apply via drizzle migrator. */
    migrationsFolder?: string;
}

/**
 * Executes raw SQL to create tables for PGlite.
 */
export async function createTablesFromSQL(client: PGliteInstance, sql: string): Promise<void> {
    if (!sql.trim()) {
        return;
    }

    await client.exec(sql);
}

type PGliteDatabase = DrizzleDatabase;

/**
 * Database adapter for PGlite using Drizzle ORM. Supports browser persistence and Node.js testing.
 */
export class PGliteAdapter extends BaseDatabaseAdapter {
    readonly platform = Platform.PGlite;
    private readonly config: PGliteAdapterConfig;
    private client: PGliteInstance | null = null;
    private db: PGliteDatabase | null = null;
    private storeToTable: Record<string, DrizzleTable> = {};
    private allTables: Record<string, unknown> = {};
    private activeTransaction: PGliteDatabase | null = null;
    private syncStatusTable: DrizzleTable | null = null;

    constructor(config: PGliteAdapterConfig = {}) {
        super();
        this.config = config;
    }
    async initialize(): Promise<void> {
        try {
            const client = new PGlite(this.config.dataDir);
            this.client = client;

            const mergedSchema = getMergedDSQLSchema();
            this.storeToTable = this.ensureStoreToTable(mergedSchema.storeToTable);
            this.allTables = mergedSchema.tables;
            this.db = drizzle(client, { schema: this.allTables });
            this.syncStatusTable = this.storeToTable['fileSyncStatus'] ?? null;

            if (this.config.migrationsFolder) {
                const { migrate } = (await import(
                    /* webpackIgnore: true */ 'drizzle-orm/pglite/migrator'
                )) as unknown as { migrate: MigrateFunction };
                await migrate(this.db, { migrationsFolder: this.config.migrationsFolder });
            } else {
                const ddl = generateAllTablesDDL();

                if (ddl.trim()) {
                    await client.exec(ddl);
                }
            }
        } catch (error) {
            throw new DatabaseError(
                `Failed to initialize PGlite: ${error instanceof Error ? error.message : String(error)}`,
                'INITIALIZE',
            );
        }
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }

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

    async putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void> {
        await this.transaction(async () => {
            for (const entity of entities) {
                await this.put(store, entity);
            }
        });
    }

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

    async getSyncStatus(fileKey: string): Promise<FileSyncStatus | null> {
        const db = this.getDatabase();
        const syncStatusTable = this.syncStatusTable;

        if (!syncStatusTable) {
            throw new DatabaseError('Sync status table not registered', 'SELECT');
        }

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

    async setSyncStatus(fileKey: string, sha: string, etag?: string): Promise<void> {
        const db = this.getDatabase();
        const syncStatusTable = this.syncStatusTable;

        if (!syncStatusTable) {
            throw new DatabaseError('Sync status table not registered', 'INSERT');
        }

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

    async deleteSyncStatus(fileKey: string): Promise<void> {
        const db = this.getDatabase();
        const syncStatusTable = this.syncStatusTable;

        if (!syncStatusTable) {
            throw new DatabaseError('Sync status table not registered', 'DELETE');
        }

        try {
            await db.delete(syncStatusTable).where(eq(syncStatusTable.fileKey, fileKey));
        } catch (error) {
            throw new DatabaseError(
                `Failed to deleteSyncStatus: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    private getDatabase(): PGliteDatabase {
        if (!this.db) {
            throw new DatabaseError('PGlite adapter not initialized', 'INITIALIZE');
        }

        return this.activeTransaction ?? this.db;
    }

    private getTable(store: EntityType): DrizzleTable {
        const table = this.storeToTable[store as string];

        if (!table) {
            throw new DatabaseError(`Unknown entity store: ${store}. Is the plugin schema registered?`, 'SELECT');
        }

        return table;
    }

    private ensureStoreToTable(storeToTable: Record<string, unknown>): Record<string, DrizzleTable> {
        const resolved: Record<string, DrizzleTable> = {};

        for (const [store, table] of Object.entries(storeToTable)) {
            if (!this.isDrizzleTable(table)) {
                throw new DatabaseError(
                    `Invalid PGlite table registered for store: ${store}. Is the plugin schema registered?`,
                    'INITIALIZE',
                );
            }

            resolved[store] = table;
        }

        return resolved;
    }

    private isDrizzleTable(value: unknown): value is DrizzleTable {
        if (typeof value !== 'object' || value === null) {
            return false;
        }

        const symbols = Object.getOwnPropertySymbols(value);

        return symbols.some((s) => s.toString().includes('Columns'));
    }

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
