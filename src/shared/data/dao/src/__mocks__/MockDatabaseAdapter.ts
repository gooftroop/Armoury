import { Platform, type DatabaseAdapter, type EntityType, type EntityMap, type QueryOptions } from '@/adapter.js';
import { getEntityCodec } from '@/codec.js';
import type { FileSyncStatus } from '@/types.js';

/**
 * Mock in-memory database adapter for testing.
 * Implements the DatabaseAdapter interface using in-memory Maps for entity and sync status storage.
 * Useful for unit tests and integration tests that don't require persistent storage.
 */
class MockDatabaseAdapter implements DatabaseAdapter {
    readonly platform = Platform.SQLite;
    private store = new Map<string, Map<string, unknown>>();
    private syncStore = new Map<string, FileSyncStatus>();
    initialized = false;

    /**
     * Initialize the mock adapter.
     * Sets the initialized flag to true.
     */
    async initialize(): Promise<void> {
        this.initialized = true;
    }

    /**
     * Close the mock adapter.
     * Sets the initialized flag to false.
     */
    async close(): Promise<void> {
        this.initialized = false;
    }

    /**
     * Retrieve a single entity by ID from the specified store.
     * @param store - The entity store name
     * @param id - The entity ID to retrieve
     * @returns The entity if found, null otherwise
     */
    async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        const entry = this.store.get(store)?.get(id) as EntityMap[T] | undefined;

        if (!entry) {
            return null;
        }

        const codec = getEntityCodec(store);

        if (codec) {
            return codec.hydrate(entry as unknown as Record<string, unknown>) as EntityMap[T];
        }

        return entry;
    }

    /**
     * Retrieve all entities from the specified store with optional query options.
     * @param store - The entity store name
     * @param options - Optional query options (ordering, pagination)
     * @returns Array of all entities in the store
     */
    async getAll<T extends EntityType>(store: T, options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]> {
        const storeData = this.store.get(store);

        if (!storeData) {
            return [];
        }

        let entries = Array.from(storeData.values()) as EntityMap[T][];

        const codec = getEntityCodec(store);

        if (codec) {
            entries = entries.map(
                (entry) => codec.hydrate(entry as unknown as Record<string, unknown>) as EntityMap[T],
            );
        }

        return this.applyQueryOptions(entries, options);
    }

    /**
     * Retrieve entities from a store by matching a field value.
     * @param store - The entity store name
     * @param field - The field name to match
     * @param value - The value to match
     * @param options - Optional query options (ordering, pagination)
     * @returns Array of entities matching the field value
     */
    async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
        options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]> {
        const all = await this.getAll(store);
        const filtered = all.filter((item) => (item as unknown as Record<string, unknown>)[field as string] === value);

        return this.applyQueryOptions(filtered, options);
    }

    /**
     * Count entities in a store, optionally filtered by field value.
     * @param store - The entity store name
     * @param field - Optional field name to filter by
     * @param value - Optional value to match
     * @returns Number of entities matching the criteria
     */
    async count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number> {
        if (field && value !== undefined) {
            const results = await this.getByField(store, field, value);

            return results.length;
        }

        const all = await this.getAll(store);

        return all.length;
    }

    /**
     * Store a single entity in the specified store.
     * @param store - The entity store name
     * @param entity - The entity to store
     */
    async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        if (!this.store.has(store)) {
            this.store.set(store, new Map());
        }

        const codec = getEntityCodec(store);
        const stored = codec ? (codec.serialize(entity) as unknown as EntityMap[T]) : entity;
        this.store.get(store)!.set((stored as { id: string }).id, stored);
    }

    /**
     * Store multiple entities in the specified store.
     * @param store - The entity store name
     * @param entities - Array of entities to store
     */
    async putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void> {
        for (const entity of entities) {
            await this.put(store, entity);
        }
    }

    /**
     * Delete a single entity by ID from the specified store.
     * @param store - The entity store name
     * @param id - The entity ID to delete
     */
    async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        this.store.get(store)?.delete(id);
    }

    /**
     * Delete all entities from the specified store.
     * @param store - The entity store name
     */
    async deleteAll<T extends EntityType>(store: T): Promise<void> {
        this.store.delete(store);
    }

    /**
     * Delete entities from a store by matching a field value.
     * @param store - The entity store name
     * @param field - The field name to match
     * @param value - The value to match
     */
    async deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void> {
        const items = await this.getByField(store, field, value);

        for (const item of items) {
            await this.delete(store, (item as { id: string }).id);
        }
    }

    /**
     * Execute a function within a transaction context.
     * In the mock adapter, this simply executes the function without transaction semantics.
     * @param fn - The function to execute
     * @returns The result of the function
     */
    async transaction<R>(fn: () => Promise<R>): Promise<R> {
        return fn();
    }

    /**
     * Retrieve the sync status for a file.
     * @param fileKey - The file key to look up
     * @returns The sync status if found, null otherwise
     */
    async getSyncStatus(fileKey: string): Promise<FileSyncStatus | null> {
        return this.syncStore.get(fileKey) ?? null;
    }

    /**
     * Set the sync status for a file.
     * @param fileKey - The file key
     * @param sha - The file SHA hash
     * @param etag - Optional ETag for HTTP caching
     */
    async setSyncStatus(fileKey: string, sha: string, etag?: string): Promise<void> {
        this.syncStore.set(fileKey, {
            fileKey,
            sha,
            lastSynced: new Date(),
            etag,
        });
    }

    /**
     * Delete the sync status for a file.
     * @param fileKey - The file key to delete
     */
    async deleteSyncStatus(fileKey: string): Promise<void> {
        this.syncStore.delete(fileKey);
    }

    /**
     * Clear all entities and sync statuses from the mock adapter.
     * Useful for test cleanup.
     */
    clear(): void {
        this.store.clear();
        this.syncStore.clear();
    }

    private applyQueryOptions<T>(results: T[], options?: QueryOptions<T>): T[] {
        if (!options) {
            return results;
        }

        let sorted = results;

        if (options.orderBy) {
            const dir = options.direction ?? 'asc';
            const field = options.orderBy;

            sorted = [...results].sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];

                if (aVal < bVal) {
                    return dir === 'asc' ? -1 : 1;
                }

                if (aVal > bVal) {
                    return dir === 'asc' ? 1 : -1;
                }

                return 0;
            });
        }

        const offset = options.offset ?? 0;
        const sliced = sorted.slice(offset);

        if (options.limit !== undefined) {
            return sliced.slice(0, options.limit);
        }

        return sliced;
    }
}

export { MockDatabaseAdapter };
