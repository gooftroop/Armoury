import type { DatabaseAdapter, EntityMap, EntityType } from '@matches/src/types.js';

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
 * Configuration for the local PostgreSQL database adapter.
 */
export interface LocalAdapterConfig {
    /** Database host address. */
    host: string;

    /** Database port number. */
    port: number;

    /** Database user name. */
    user: string;

    /** Database user password. */
    password: string;

    /** Database name. */
    database: string;

    /** Whether to use SSL for the connection. */
    ssl: boolean;
}

type StoreConfig = {
    tableName: string;
    primaryKey: string;
    fieldToColumn: Record<string, string>;
    jsonFields: Set<string>;
};

const { Client } = (await import('pg')) as unknown as { Client: PgClientConstructor };

const STORE_CONFIGS: Record<EntityType, StoreConfig> = {
    match: {
        tableName: 'matches',
        primaryKey: 'id',
        fieldToColumn: {
            id: 'id',
            systemId: 'system_id',
            players: 'players',
            turn: 'turn',
            score: 'score',
            outcome: 'outcome',
            campaignId: 'campaign_id',
            matchData: 'match_data',
            notes: 'notes',
            playedAt: 'played_at',
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
        jsonFields: new Set(['players', 'turn', 'score', 'outcome', 'matchData']),
    },
    matchSubscription: {
        tableName: 'match_subscriptions',
        primaryKey: 'id',
        fieldToColumn: {
            id: 'id',
            connectionId: 'connection_id',
            matchId: 'match_id',
            userId: 'user_id',
        },
        jsonFields: new Set(),
    },
    wsConnection: {
        tableName: 'ws_connections',
        primaryKey: 'connection_id',
        fieldToColumn: {
            connectionId: 'connection_id',
            userId: 'user_id',
            connectedAt: 'connected_at',
        },
        jsonFields: new Set(),
    },
};

export class LocalDatabaseAdapter implements DatabaseAdapter {
    private readonly config: LocalAdapterConfig;
    private client: PgClient | null = null;
    private transactionDepth = 0;

    /**
     * Creates a new local database adapter instance.
     * @param config Database connection configuration.
     */
    public constructor(config: LocalAdapterConfig) {
        this.config = config;
    }

    /**
     * Initializes the database connection.
     * @returns Promise that resolves when connection is established.
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
     * Retrieves an entity by ID.
     * @param store Entity store type.
     * @param id Entity identifier.
     * @returns Entity or null if not found.
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
     * @param store Entity store type.
     * @returns Array of all entities.
     */
    public async getAll<T extends EntityType>(store: T): Promise<EntityMap[T][]> {
        const config = this.getStoreConfig(store);
        const result = await this.query(`SELECT * FROM ${config.tableName}`);

        return result.rows.map((row) => this.mapRowToEntity(store, row));
    }

    /**
     * Retrieves entities by matching a field value.
     * @param store Entity store type.
     * @param field Field name to match.
     * @param value Field value to search for.
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
     * Stores or updates an entity.
     * @param store Entity store type.
     * @param entity Entity to store.
     * @returns Promise that resolves when entity is stored.
     */
    public async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        const config = this.getStoreConfig(store);
        const fields = Object.keys(config.fieldToColumn);
        const columns = fields.map((field) => config.fieldToColumn[field]);
        const entityRecord = entity as unknown as Record<string, unknown>;
        const values = fields.map((field) => this.prepareValue(config, field, entityRecord));
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
        const updates = columns.map((column) => `${column} = EXCLUDED.${column}`).join(', ');
        const query = `INSERT INTO ${config.tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${config.primaryKey}) DO UPDATE SET ${updates}`;

        await this.query(query, values);
    }

    /**
     * Deletes an entity by ID.
     * @param store Entity store type.
     * @param id Entity identifier.
     * @returns Promise that resolves when entity is deleted.
     */
    public async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        const config = this.getStoreConfig(store);

        await this.query(`DELETE FROM ${config.tableName} WHERE ${config.primaryKey} = $1`, [id]);
    }

    /**
     * Deletes entities by matching a field value.
     * @param store Entity store type.
     * @param field Field name to match.
     * @param value Field value to search for.
     * @returns Promise that resolves when matching entities are deleted.
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
     * Executes a transactional operation with automatic rollback on error.
     * @param fn Async function to execute within the transaction.
     * @returns Result of the transaction function.
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

    private prepareValue(config: StoreConfig, field: string, entity: Record<string, unknown>): unknown {
        const value = entity[field];

        if (value === undefined) {
            return null;
        }

        if (value === null) {
            return null;
        }

        if (config.jsonFields.has(field)) {
            return JSON.stringify(value);
        }

        return value;
    }

    private mapRowToEntity<T extends EntityType>(store: T, row: Record<string, unknown>): EntityMap[T] {
        const config = this.getStoreConfig(store);
        const columnToField = Object.fromEntries(
            Object.entries(config.fieldToColumn).map(([field, column]) => [column, field]),
        ) as Record<string, string>;
        const entity: Record<string, unknown> = {};

        for (const [column, value] of Object.entries(row)) {
            const field = columnToField[column] ?? column;
            const mapped = this.parseJsonField(config, field, value);

            entity[field] = mapped;
        }

        return entity as unknown as EntityMap[T];
    }

    private parseJsonField(config: StoreConfig, field: string, value: unknown): unknown {
        if (!config.jsonFields.has(field)) {
            return value;
        }

        if (typeof value !== 'string') {
            return value;
        }

        try {
            return JSON.parse(value) as unknown;
        } catch {
            return value;
        }
    }
}
