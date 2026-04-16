import type { DatabaseAdapter, EntityMap, EntityType, FileSyncStatus, QueryOptions } from '@armoury/data-dao';
import { Platform } from '@armoury/data-dao';

/**
 * In-memory mock implementation of the campaigns database adapter.
 */
export class MockDatabaseAdapter implements DatabaseAdapter {
    public readonly platform = Platform.PGlite;
    private stores: Map<EntityType, Map<string, EntityMap[EntityType]>>;

    /**
     * Initializes the adapter with empty stores.
     */
    public constructor() {
        this.stores = new Map();
    }

    /**
     * Initializes the adapter (noop for in-memory storage).
     */
    public async initialize(): Promise<void> {
        this.ensureStore('campaign');
        this.ensureStore('campaignParticipant');
    }

    public async close(): Promise<void> {
        return;
    }

    /**
     * Clears all in-memory stores.
     */
    public clear(): void {
        this.stores.clear();
    }

    /**
     * Retrieves an entity by ID.
     */
    public async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        return collection.get(id) ?? null;
    }

    public async getAll<T extends EntityType>(
        store: T,
        _options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        return Array.from(collection.values());
    }

    public async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
        _options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;
        const results: EntityMap[T][] = [];

        for (const entity of collection.values()) {
            if (String(entity[field]) === value) {
                results.push(entity);
            }
        }

        return results;
    }

    public async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;
        const entityId = (entity as EntityMap[T] & { id: string }).id;

        collection.set(entityId, entity);
    }

    public async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        collection.delete(id);
    }

    public async count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        if (!field || value === undefined) {
            return collection.size;
        }

        let count = 0;

        for (const entity of collection.values()) {
            if (String(entity[field]) === value) {
                count += 1;
            }
        }

        return count;
    }

    public async deleteByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
    ): Promise<void> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        for (const [id, entity] of collection.entries()) {
            if (String(entity[field]) === value) {
                collection.delete(id);
            }
        }
    }

    public async putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void> {
        for (const entity of entities) {
            await this.put(store, entity);
        }
    }

    public async deleteAll<T extends EntityType>(store: T): Promise<void> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        collection.clear();
    }

    public async transaction<R>(fn: () => Promise<R>): Promise<R> {
        return fn();
    }

    public async getSyncStatus(_fileKey: string): Promise<FileSyncStatus | null> {
        return null;
    }

    public async getAllSyncStatuses(): Promise<FileSyncStatus[]> {
        return [];
    }

    public async setSyncStatus(_fileKey: string, _sha: string, _etag?: string): Promise<void> {
        return;
    }

    public async deleteSyncStatus(_fileKey: string): Promise<void> {
        return;
    }

    private ensureStore<T extends EntityType>(store: T): Map<string, EntityMap[T]> {
        const existing = this.stores.get(store) as Map<string, EntityMap[T]> | undefined;

        if (existing) {
            return existing;
        }

        const created = new Map<string, EntityMap[T]>();

        this.stores.set(store, created as Map<string, EntityMap[EntityType]>);

        return created;
    }
}
