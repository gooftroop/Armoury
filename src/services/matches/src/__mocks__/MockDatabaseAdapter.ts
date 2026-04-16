import type { DatabaseAdapter, EntityMap, EntityType } from '@/types.js';

export class MockDatabaseAdapter implements DatabaseAdapter {
    private stores: Map<EntityType, Map<string, EntityMap[EntityType]>>;

    public constructor() {
        this.stores = new Map();
    }

    public async initialize(): Promise<void> {
        this.ensureStore('match');
    }

    public clear(): void {
        this.stores.clear();
    }

    public async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        return collection.get(id) ?? null;
    }

    public async getAll<T extends EntityType>(store: T): Promise<EntityMap[T][]> {
        const collection = this.ensureStore(store) as Map<string, EntityMap[T]>;

        return Array.from(collection.values());
    }

    public async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
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

    public async transaction<R>(fn: () => Promise<R>): Promise<R> {
        return fn();
    }

    public async getSyncStatus(): Promise<null> {
        return null;
    }

    public async getAllSyncStatuses(): Promise<unknown[]> {
        return [];
    }

    public async setSyncStatus(): Promise<void> {}

    public async deleteSyncStatus(): Promise<void> {}

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
