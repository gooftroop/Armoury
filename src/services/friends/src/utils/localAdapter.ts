import type { DatabaseAdapter, EntityMap, EntityType } from '@/types.js';

type QueryResult = {
    rows: Record<string, unknown>[];
};

type PgClient = {
    connect: () => Promise<void>;
    end: () => Promise<void>;
    query: (text: string, values?: unknown[]) => Promise<QueryResult>;
};

type PgClientConstructor = new (config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean;
}) => PgClient;

/**
 * PostgreSQL connection configuration for local development.
 */
export interface LocalAdapterConfig {
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

    /** Whether to enable SSL. */
    ssl: boolean;
}

type StoreConfig = {
    tableName: string;
    primaryKey: string;
    fieldToColumn: Record<string, string>;
};

const { Client } = (await import('pg')) as unknown as { Client: PgClientConstructor };

const STORE_CONFIGS: Record<EntityType, StoreConfig> = {
    friend: {
        tableName: 'friends',
        primaryKey: 'id',
        fieldToColumn: {
            id: 'id',
            ownerId: 'owner_id',
            userId: 'user_id',
            status: 'status',
            canShareArmyLists: 'can_share_army_lists',
            canViewMatchHistory: 'can_view_match_history',
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    },
    userPresence: {
        tableName: 'user_presence',
        primaryKey: 'user_id',
        fieldToColumn: {
            userId: 'user_id',
            status: 'status',
            connectionId: 'connection_id',
            lastSeen: 'last_seen',
        },
    },
};

/**
 * PostgreSQL database adapter for local development and testing.
 *
 * Maps friend entity fields to snake_case database columns and handles
 * UPSERT, query-by-field, and nested transaction semantics.
 */
export class LocalDatabaseAdapter implements DatabaseAdapter {
    private readonly config: LocalAdapterConfig;
    private client: PgClient | null = null;
    private transactionDepth = 0;

    /**
     * Creates a new local adapter instance.
     *
     * @param config - PostgreSQL connection configuration.
     */
    public constructor(config: LocalAdapterConfig) {
        this.config = config;
    }

    /**
     * Establishes the PostgreSQL connection.
     */
    public async initialize(): Promise<void> {
        if (this.client) {
            return;
        }

        const client = new Client({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            ssl: this.config.ssl,
        });

        await client.connect();

        this.client = client;
    }

    /**
     * Retrieves a single entity by ID.
     *
     * @param store - Entity type name.
     * @param id - Entity identifier.
     * @returns The entity or null if not found.
     */
    public async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        const config = this.getStoreConfig(store);
        const result = await this.query(`SELECT * FROM ${config.tableName} WHERE ${config.primaryKey} = $1 LIMIT 1`, [
            id,
        ]);

        const row = result.rows[0];

        if (!row) {
            return null;
        }

        return this.mapRowToEntity(store, row);
    }

    /**
     * Retrieves all entities of a given type.
     *
     * @param store - Entity type name.
     * @returns Array of all entities.
     */
    public async getAll<T extends EntityType>(store: T): Promise<EntityMap[T][]> {
        const config = this.getStoreConfig(store);
        const result = await this.query(`SELECT * FROM ${config.tableName}`);

        return result.rows.map((row) => this.mapRowToEntity(store, row));
    }

    /**
     * Retrieves entities matching a field value.
     *
     * @param store - Entity type name.
     * @param field - Entity field to match.
     * @param value - Value to match against.
     * @returns Array of matching entities.
     */
    public async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
    ): Promise<EntityMap[T][]> {
        const config = this.getStoreConfig(store);
        const column = config.fieldToColumn[String(field)];

        if (!column) {
            throw new Error(`Unsupported field ${String(field)} for store ${store}`);
        }

        const result = await this.query(`SELECT * FROM ${config.tableName} WHERE ${column} = $1`, [value]);

        return result.rows.map((row) => this.mapRowToEntity(store, row));
    }

    /**
     * Stores an entity using UPSERT semantics.
     *
     * @param store - Entity type name.
     * @param entity - Entity to store.
     */
    public async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        const config = this.getStoreConfig(store);
        const fields = Object.keys(config.fieldToColumn);
        const columns = fields.map((field) => config.fieldToColumn[field]);
        const entityRecord = entity as unknown as Record<string, unknown>;
        const values = fields.map((field) => entityRecord[field] ?? null);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
        const updates = columns.map((column) => `${column} = EXCLUDED.${column}`).join(', ');
        const sql = `INSERT INTO ${config.tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${config.primaryKey}) DO UPDATE SET ${updates}`;

        await this.query(sql, values);
    }

    /**
     * Deletes an entity by ID.
     *
     * @param store - Entity type name.
     * @param id - Entity identifier.
     */
    public async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        const config = this.getStoreConfig(store);

        await this.query(`DELETE FROM ${config.tableName} WHERE ${config.primaryKey} = $1`, [id]);
    }

    /**
     * Deletes entities matching a field value.
     *
     * @param store - Entity type name.
     * @param field - Entity field to match.
     * @param value - Value to match against.
     */
    public async deleteByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
    ): Promise<void> {
        const config = this.getStoreConfig(store);
        const column = config.fieldToColumn[String(field)];

        if (!column) {
            throw new Error(`Unsupported field ${String(field)} for store ${store}`);
        }

        await this.query(`DELETE FROM ${config.tableName} WHERE ${column} = $1`, [value]);
    }

    /**
     * Executes a function within a database transaction.
     *
     * @param fn - Function to execute transactionally.
     * @returns The result of the transactional function.
     */
    public async transaction<R>(fn: () => Promise<R>): Promise<R> {
        const client = this.getClient();
        const isRootTransaction = this.transactionDepth === 0;
        this.transactionDepth += 1;

        if (isRootTransaction) {
            await client.query('BEGIN');
        }

        try {
            const result = await fn();

            if (isRootTransaction) {
                await client.query('COMMIT');
            }

            return result;
        } catch (error) {
            if (isRootTransaction) {
                await client.query('ROLLBACK');
            }

            throw error;
        } finally {
            this.transactionDepth = Math.max(0, this.transactionDepth - 1);
        }
    }

    public async getSyncStatus(): Promise<null> {
        return null;
    }

    public async getAllSyncStatuses(): Promise<unknown[]> {
        return [];
    }

    public async setSyncStatus(): Promise<void> {}

    public async deleteSyncStatus(): Promise<void> {}

    private getClient(): PgClient {
        if (!this.client) {
            throw new Error('Local database adapter not initialized');
        }

        return this.client;
    }

    private getStoreConfig<T extends EntityType>(store: T): StoreConfig {
        return STORE_CONFIGS[store];
    }

    private async query(text: string, values?: unknown[]): Promise<QueryResult> {
        const client = this.getClient();

        return client.query(text, values);
    }

    private mapRowToEntity<T extends EntityType>(store: T, row: Record<string, unknown>): EntityMap[T] {
        const config = this.getStoreConfig(store);
        const columnToField = Object.fromEntries(
            Object.entries(config.fieldToColumn).map(([field, column]) => [column, field]),
        ) as Record<string, string>;
        const entity: Record<string, unknown> = {};

        for (const [column, value] of Object.entries(row)) {
            const field = columnToField[column] ?? column;

            entity[field] = value;
        }

        return entity as unknown as EntityMap[T];
    }
}
