import type { FileSyncStatus } from '@data/types.js';
import { Platform } from '@data/types.js';

// Re-export all pure types for backward compatibility with existing '@data/adapter.js' imports
export type {
    SortDirection,
    QueryOptions,
    PluginEntityMap,
    CoreEntityMap,
    EntityMap,
    EntityType,
    DatabaseAdapter,
} from '@data/types.js';

// Re-export Platform for backward compatibility
export { Platform } from '@data/types.js';

import type { EntityType, EntityMap, QueryOptions, DatabaseAdapter } from '@data/types.js';

/**
 * Registry for plugin-provided entity types.
 * Plugins register their entity kinds and type mappings here.
 * The core only knows about base entity types; game-specific types come from plugins.
 */
const pluginEntityRegistry = new Map<string, unknown>();

/**
 * Registers a plugin entity type in the global registry.
 * Called during plugin initialization to make game-specific entity types available.
 * @param kind - The entity kind key to register (e.g., 'factionModel').
 * @param _metadata - Metadata associated with the entity kind.
 */
export function registerPluginEntity(kind: string, _metadata: unknown): void {
    pluginEntityRegistry.set(kind, _metadata);
}

/**
 * Abstract base class for database adapter implementations.
 * Provides the contract that all platform-specific adapters (SQLite, IndexedDB, Aurora DSQL) must implement.
 * Subclasses handle platform-specific initialization, connection management, and query execution.
 * All methods are abstract and must be implemented by concrete adapter classes.
 */
export abstract class BaseDatabaseAdapter implements DatabaseAdapter {
    /** The platform this adapter targets (SQLite, PGlite, or AuroraDSQL). Must be set by subclass. */
    abstract readonly platform: Platform;

    /**
     * Initializes the database connection and creates schema if needed.
     * Implementation varies by platform (e.g., SQLite opens file, PGlite creates tables from DDL).
     * Must be called before any other operations.
     * @returns Promise that resolves when initialization is complete.
     * @throws DatabaseError if initialization fails.
     */
    abstract initialize(): Promise<void>;

    /**
     * Closes the database connection and releases resources.
     * Implementation varies by platform (e.g., SQLite closes file handle, PGlite closes connection).
     * @returns Promise that resolves when the connection is closed.
     */
    abstract close(): Promise<void>;

    /**
     * Retrieves a single entity by its primary key ID.
     * @template T The entity type to retrieve.
     * @param store The entity type/store name (e.g., 'unit', 'faction').
     * @param id The primary key ID of the entity.
     * @returns Promise resolving to the entity if found, or null if not found.
     * @throws DatabaseError if the query fails.
     */
    abstract get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null>;

    /**
     * Retrieves all entities of a given type from the database.
     * Supports optional pagination and sorting via QueryOptions.
     * @template T The entity type to retrieve.
     * @param store The entity type/store name (e.g., 'unit', 'faction').
     * @param options Optional pagination and sorting options.
     * @returns Promise resolving to an array of entities.
     * @throws DatabaseError if the query fails.
     */
    abstract getAll<T extends EntityType>(store: T, options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]>;

    /**
     * Retrieves entities by matching a specific field value.
     * Supports optional pagination and sorting via QueryOptions.
     * @template T The entity type to query.
     * @param store The entity type/store name (e.g., 'unit', 'weapon').
     * @param field The field name to match against.
     * @param value The value to match (compared as string equality).
     * @param options Optional pagination and sorting options.
     * @returns Promise resolving to an array of matching entities.
     * @throws DatabaseError if the query fails.
     */
    abstract getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
        options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]>;

    /**
     * Returns the total number of entities in a store, optionally filtered by a field value.
     * @template T The entity type to count.
     * @param store The entity type/store name (e.g., 'unit', 'faction').
     * @param field Optional field name to filter by.
     * @param value Required if field is provided. The value to match.
     * @returns Promise resolving to the count of matching entities.
     * @throws DatabaseError if the query fails.
     */
    abstract count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number>;

    /**
     * Inserts or updates a single entity in the database.
     * @template T The entity type to store.
     * @param store The entity type/store name (e.g., 'unit', 'faction').
     * @param entity The entity object to store.
     * @returns Promise that resolves when the entity is stored.
     * @throws DatabaseError if the operation fails.
     */
    abstract put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void>;

    /**
     * Inserts or updates multiple entities in a single batch operation.
     * @template T The entity type to store.
     * @param store The entity type/store name (e.g., 'unit', 'faction').
     * @param entities Array of entity objects to store.
     * @returns Promise that resolves when all entities are stored.
     * @throws DatabaseError if the operation fails.
     */
    abstract putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void>;

    /**
     * Deletes a single entity by its primary key ID.
     * @template T The entity type to delete.
     * @param store The entity type/store name (e.g., 'unit', 'faction').
     * @param id The primary key ID of the entity to delete.
     * @returns Promise that resolves when the entity is deleted.
     * @throws DatabaseError if the operation fails.
     */
    abstract delete<T extends EntityType>(store: T, id: string): Promise<void>;

    /**
     * Deletes all entities of a given type from the database.
     * @template T The entity type to delete.
     * @param store The entity type/store name (e.g., 'unit', 'faction').
     * @returns Promise that resolves when all entities of the type are deleted.
     * @throws DatabaseError if the operation fails.
     */
    abstract deleteAll<T extends EntityType>(store: T): Promise<void>;

    /**
     * Deletes all entities matching a specific field value.
     * @template T The entity type to delete.
     * @param store The entity type/store name (e.g., 'unit', 'weapon').
     * @param field The field name to match against.
     * @param value The value to match (compared as string equality).
     * @returns Promise that resolves when all matching entities are deleted.
     * @throws DatabaseError if the operation fails.
     */
    abstract deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void>;

    /**
     * Executes a function within a database transaction.
     * All database operations within the function are atomic: either all succeed or all fail.
     * @template R The return type of the transaction function.
     * @param fn Async function containing database operations to execute atomically.
     * @returns Promise resolving to the return value of the function.
     * @throws DatabaseError if the transaction fails.
     */
    abstract transaction<R>(fn: () => Promise<R>): Promise<R>;

    /**
     * Retrieves the sync status metadata for a file.
     * @param fileKey Unique identifier for the file (e.g., 'core:wh40k-10e.gst', 'faction:Adeptus Astartes.cat').
     * @returns Promise resolving to the FileSyncStatus if found, or null if never synced.
     * @throws DatabaseError if the query fails.
     */
    abstract getSyncStatus(fileKey: string): Promise<FileSyncStatus | null>;

    /**
     * Stores or updates the sync status metadata for a file.
     * @param fileKey Unique identifier for the file (e.g., 'core:wh40k-10e.gst', 'faction:Adeptus Astartes.cat').
     * @param sha The Git SHA hash of the file.
     * @param etag Optional HTTP ETag header value for additional cache validation.
     * @returns Promise that resolves when the sync status is stored.
     * @throws DatabaseError if the operation fails.
     */
    abstract setSyncStatus(fileKey: string, sha: string, etag?: string): Promise<void>;

    /**
     * Deletes the sync status metadata for a file.
     * @param fileKey Unique identifier for the file (e.g., 'core:wh40k-10e.gst', 'faction:Adeptus Astartes.cat').
     * @returns Promise that resolves when the sync status is deleted.
     * @throws DatabaseError if the operation fails.
     */
    abstract deleteSyncStatus(fileKey: string): Promise<void>;
}
