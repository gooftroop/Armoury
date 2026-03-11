import type { DatabaseAdapter, EntityMap, EntityType } from '../types.ts';

/**
 * In-memory mock database adapter for unit testing.
 *
 * Provides isolated per-test storage with two entity stores (user and account).
 * Each store is a Map keyed by entity ID, supporting the full DatabaseAdapter interface
 * without any external dependencies.
 */
export class MockDatabaseAdapter implements DatabaseAdapter {
    private stores: Record<string, Map<string, unknown>> = {
        user: new Map(),
        account: new Map(),
    };

    /** No-op initialization. */
    public async initialize(): Promise<void> {}

    /** Retrieves an entity by ID from the in-memory store. */
    public async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        return (this.stores[store]?.get(id) as EntityMap[T]) ?? null;
    }

    /** Retrieves all entities of a given type. */
    public async getAll<T extends EntityType>(store: T): Promise<EntityMap[T][]> {
        return Array.from(this.stores[store]?.values() ?? []) as EntityMap[T][];
    }

    /** Retrieves entities matching a field value. */
    public async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
    ): Promise<EntityMap[T][]> {
        const all = await this.getAll(store);

        return all.filter((item) => {
            const record = item as unknown as Record<string, unknown>;

            return record[String(field)] === value;
        });
    }

    /** Stores an entity by its ID. */
    public async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        const record = entity as unknown as Record<string, unknown>;

        this.stores[store]?.set(record['id'] as string, entity);
    }

    /** Deletes an entity by ID. */
    public async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        this.stores[store]?.delete(id);
    }

    /** Deletes entities matching a field value. */
    public async deleteByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
    ): Promise<void> {
        const all = await this.getAll(store);

        for (const item of all) {
            const record = item as unknown as Record<string, unknown>;

            if (record[String(field)] === value) {
                this.stores[store]?.delete(record['id'] as string);
            }
        }
    }

    /** Executes a function directly (no real transaction). */
    public async transaction<R>(fn: () => Promise<R>): Promise<R> {
        return fn();
    }

    /** Clears all entity stores to reset state between tests. */
    public reset(): void {
        for (const store of Object.values(this.stores)) {
            store.clear();
        }
    }
}
