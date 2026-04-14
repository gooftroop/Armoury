/**
 * Database adapter for React Native/Expo mobile apps using SQLite.
 *
 * Uses expo-sqlite for the underlying database connection and Drizzle ORM
 * for query building. All platform-specific SQLite concerns are isolated here.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { BaseDatabaseAdapter, type EntityMap, type EntityType, type QueryOptions } from '@armoury/data-dao';
import { getMergedSQLiteSchema } from '@armoury/data-dao';
import { Platform } from '@armoury/data-dao';
import { getEntityCodec } from '@armoury/data-dao';
import type { FileSyncStatus } from '@armoury/data-dao';
import { DatabaseError } from '@armoury/data-dao';

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
};

type DrizzleTable = Record<string, unknown>;

type DrizzleFactory = (client: SQLiteDatabase, options: { schema: Record<string, unknown> }) => DrizzleDatabase;

type EqBuilder = (column: unknown, value: unknown) => unknown;

type OrderByFn = (column: unknown) => unknown;

/**
 * Database adapter for React Native/Expo mobile apps using SQLite.
 */
export class SQLiteAdapter extends BaseDatabaseAdapter {
    readonly platform = Platform.SQLite;
    private expoDb: SQLiteDatabase;
    private db: DrizzleDatabase | null = null;
    private storeToTable: Record<string, DrizzleTable> = {};
    private allTables: Record<string, unknown> = {};
    private syncStatusTable: DrizzleTable | null = null;
    private eq: EqBuilder | null = null;
    private drizzleAsc: OrderByFn | null = null;
    private drizzleDesc: OrderByFn | null = null;

    /**
     * Creates a new SQLiteAdapter with the given expo-sqlite database instance.
     * @param database - The expo-sqlite SQLiteDatabase instance to use for all operations
     */
    constructor(database: SQLiteDatabase) {
        super();
        this.expoDb = database;
    }

    async initialize(): Promise<void> {
        try {
            const { drizzle } = (await import('drizzle-orm/expo-sqlite')) as unknown as { drizzle: DrizzleFactory };
            const { eq, asc, desc } = (await import('drizzle-orm')) as unknown as {
                eq: EqBuilder;
                asc: OrderByFn;
                desc: OrderByFn;
            };

            this.eq = eq;
            this.drizzleAsc = asc;
            this.drizzleDesc = desc;

            const schema = getMergedSQLiteSchema();
            this.storeToTable = this.ensureStoreToTable(schema.storeToTable);
            this.allTables = schema.tables;
            this.db = drizzle(this.expoDb, { schema: this.allTables });
            this.syncStatusTable = this.storeToTable['fileSyncStatus'] ?? null;
        } catch (error) {
            throw new DatabaseError(
                `Failed to initialize SQLite: ${error instanceof Error ? error.message : String(error)}`,
                'INITIALIZE',
            );
        }
    }
    /**
     * Closes the SQLite database connection.
     * @throws {DatabaseError} If connection closure fails
     */
    async close(): Promise<void> {
        await this.expoDb.closeAsync();
        this.db = null;
    }

    /**
     * Retrieves a single entity by ID from the specified store.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @param id - The unique identifier of the entity to retrieve
     * @returns The entity if found, or null if not found
     * @throws {DatabaseError} If the query fails
     */
    async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            const results = await db.select().from(table).where(this.getEq()(table.id, id)).limit(1);
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
     * Retrieves all entities from the specified store.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @returns Array of all entities in the store, or empty array if none exist
     * @throws {DatabaseError} If the query fails
     */
    async getAll<T extends EntityType>(store: T, options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            let query = db.select().from(table).where(this.getEq()(table.id, table.id));

            if (options?.orderBy) {
                const column = table[options.orderBy as keyof typeof table];
                const orderFn = options.direction === 'desc' ? this.getDesc() : this.getAsc();
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
     * Retrieves entities matching a specific field value.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @param field - The field name to filter by (e.g., 'factionId', 'ownerId')
     * @param value - The value to match against the field
     * @returns Array of entities matching the field value, or empty array if none found
     * @throws {DatabaseError} If the query fails
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
            let query = db.select().from(table).where(this.getEq()(column, value));

            if (options?.orderBy) {
                const orderColumn = table[options.orderBy as keyof typeof table];
                const orderFn = options.direction === 'desc' ? this.getDesc() : this.getAsc();
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
     * Returns the total number of entities in a store, optionally filtered by a field value.
     * Useful for pagination and summary statistics.
     * @template T - The entity type
     * @param store - The store name (e.g., 'unit', 'faction')
     * @param field - Optional field name to filter by
     * @param value - Optional value to match when filtering by field
     * @returns The count of matching entities
     * @throws {DatabaseError} If the query fails
     */
    async count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            const query = db.select().from(table);

            if (field && value !== undefined) {
                const column = table[field as keyof typeof table];
                const rows = await query.where(this.getEq()(column, value));

                return rows.length;
            }

            const rows = await query.where(this.getEq()(table.id, table.id));

            return rows.length;
        } catch (error) {
            throw new DatabaseError(
                `Failed to count ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'SELECT',
            );
        }
    }

    /**
     * Inserts or updates a single entity (upsert operation).
     * Uses INSERT OR REPLACE to handle both new inserts and updates.
     * FactionDataModel instances are serialized to JSON via toJSON() before storage.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @param entity - The entity to insert or update
     * @throws {DatabaseError} If the insert/update fails
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
     * Inserts or updates multiple entities within a single transaction.
     * All entities are inserted/updated atomically - if any operation fails, the entire transaction is rolled back.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @param entities - Array of entities to insert or update
     * @throws {DatabaseError} If any insert/update fails or transaction fails
     */
    async putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void> {
        await this.transaction(async () => {
            for (const entity of entities) {
                await this.put(store, entity);
            }
        });
    }

    /**
     * Deletes a single entity by ID.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @param id - The unique identifier of the entity to delete
     * @throws {DatabaseError} If the delete fails
     */
    async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            await db.delete(table).where(this.getEq()(table.id, id));
        } catch (error) {
            throw new DatabaseError(
                `Failed to delete ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    /**
     * Deletes all entities from the specified store.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @throws {DatabaseError} If the delete fails
     */
    async deleteAll<T extends EntityType>(store: T): Promise<void> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            await db.delete(table).where(this.getEq()(table.id, table.id));
        } catch (error) {
            throw new DatabaseError(
                `Failed to deleteAll ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    /**
     * Deletes entities matching a specific field value.
     * @template T - The entity type (unit, weapon, ability, etc.)
     * @param store - The store name (e.g., 'unit', 'faction', 'factionModel')
     * @param field - The field name to filter by (e.g., 'factionId', 'ownerId')
     * @param value - The value to match for deletion
     * @throws {DatabaseError} If the delete fails
     */
    async deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void> {
        const table = this.getTable(store);
        const db = this.getDatabase();

        try {
            const column = table[field as keyof typeof table];
            await db.delete(table).where(this.getEq()(column, value));
        } catch (error) {
            throw new DatabaseError(
                `Failed to deleteByField ${store}: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    /**
     * Executes a function within an exclusive SQLite transaction.
     * Uses expo-sqlite's withExclusiveTransactionAsync to ensure atomicity.
     * If the function throws, the transaction is rolled back.
     * @template R - The return type of the transaction function
     * @param fn - Async function to execute within the transaction
     * @returns The result of the transaction function
     * @throws {DatabaseError} If the transaction fails
     */
    async transaction<R>(fn: () => Promise<R>): Promise<R> {
        let result: R;

        await this.expoDb.withExclusiveTransactionAsync(async () => {
            result = await fn();
        });

        return result!;
    }

    /**
     * Retrieves the sync status for a BattleScribe data file.
     * Returns metadata about when the file was last synced and its current SHA hash.
     * @param fileKey - The unique identifier for the BattleScribe data file
     * @returns FileSyncStatus object if found, or null if no sync record exists
     * @throws {DatabaseError} If the query fails
     */
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
                .where(this.getEq()(syncStatusTable.fileKey, fileKey))
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
     * Retrieves all sync statuses for BattleScribe data files.
     * @returns Array of all FileSyncStatus objects
     * @throws {DatabaseError} If the query fails
     */
    async getAllSyncStatuses(): Promise<FileSyncStatus[]> {
        const db = this.getDatabase();
        const syncStatusTable = this.syncStatusTable;

        if (!syncStatusTable) {
            throw new DatabaseError('Sync status table not registered', 'SELECT');
        }

        try {
            const results = await db.select().from(syncStatusTable);

            return results.map((record) => ({
                fileKey: String(record.fileKey),
                sha: String(record.sha),
                lastSynced: new Date(String(record.lastSynced)),
                etag: record.etag ? String(record.etag) : undefined,
            }));
        } catch (error) {
            throw new DatabaseError(
                `Failed to getAllSyncStatuses: ${error instanceof Error ? error.message : String(error)}`,
                'SELECT',
            );
        }
    }

    /**
     * Updates the sync status for a BattleScribe data file.
     * Records the current timestamp and SHA hash, optionally storing an ETag for conditional requests.
     * @param fileKey - The unique identifier for the BattleScribe data file
     * @param sha - The SHA hash of the file content
     * @param etag - Optional ETag from the HTTP response for conditional requests
     * @throws {DatabaseError} If the insert/update fails
     */
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

    /**
     * Removes the sync status entry for a BattleScribe data file.
     * @param fileKey - The unique identifier for the BattleScribe data file
     * @throws {DatabaseError} If the delete fails
     */
    async deleteSyncStatus(fileKey: string): Promise<void> {
        const db = this.getDatabase();
        const syncStatusTable = this.syncStatusTable;

        if (!syncStatusTable) {
            throw new DatabaseError('Sync status table not registered', 'DELETE');
        }

        try {
            await db.delete(syncStatusTable).where(this.getEq()(syncStatusTable.fileKey, fileKey));
        } catch (error) {
            throw new DatabaseError(
                `Failed to deleteSyncStatus: ${error instanceof Error ? error.message : String(error)}`,
                'DELETE',
            );
        }
    }

    private getDatabase(): DrizzleDatabase {
        if (!this.db) {
            throw new DatabaseError('SQLite adapter not initialized', 'INITIALIZE');
        }

        return this.db;
    }

    private getEq(): EqBuilder {
        if (!this.eq) {
            throw new DatabaseError('SQLite adapter not initialized', 'INITIALIZE');
        }

        return this.eq;
    }

    private getAsc(): OrderByFn {
        if (!this.drizzleAsc) {
            throw new DatabaseError('SQLite adapter not initialized', 'INITIALIZE');
        }

        return this.drizzleAsc;
    }

    private getDesc(): OrderByFn {
        if (!this.drizzleDesc) {
            throw new DatabaseError('SQLite adapter not initialized', 'INITIALIZE');
        }

        return this.drizzleDesc;
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
                    `Invalid SQLite table registered for store: ${store}. Is the plugin schema registered?`,
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
}
