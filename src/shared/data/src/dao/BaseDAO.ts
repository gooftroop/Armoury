import type { DatabaseAdapter, EntityMap, EntityType } from '@data/adapter.js';

/**
 * Abstract base class that provides CRUD operations for a single entity store.
 */
export abstract class BaseDAO<T> {
    protected readonly adapter: DatabaseAdapter;
    protected readonly store: string;

    /**
     * Creates a new DAO bound to a specific store name.
     * @param adapter - Database adapter used to execute operations.
     * @param store - Store name used by the adapter for this entity type.
     */
    public constructor(adapter: DatabaseAdapter, store: string) {
        this.adapter = adapter;
        this.store = store;
    }

    /**
     * Retrieves a single entity by its ID.
     * @param id - Primary key ID of the entity.
     * @returns The entity if found, otherwise null.
     */
    public async get(id: string): Promise<T | null> {
        const result = await this.adapter.get(this.getStore(), id);

        return result as T | null;
    }

    /**
     * Lists all entities from the store.
     * @returns Array of all entities in the store.
     */
    public async list(): Promise<T[]> {
        const results = await this.adapter.getAll(this.getStore());

        return results as T[];
    }

    /**
     * Saves an entity to the store, inserting or updating by ID.
     * @param entity - Entity instance to persist.
     */
    public async save(entity: T): Promise<void> {
        await this.adapter.put(this.getStore(), entity as EntityMap[EntityType]);
    }

    /**
     * Saves multiple entities to the store in a batch.
     * @param entities - Entities to persist.
     */
    public async saveMany(entities: T[]): Promise<void> {
        await this.adapter.putMany(this.getStore(), entities as EntityMap[EntityType][]);
    }

    /**
     * Deletes a single entity by ID.
     * @param id - Primary key ID of the entity.
     */
    public async delete(id: string): Promise<void> {
        await this.adapter.delete(this.getStore(), id);
    }

    /**
     * Deletes all entities from the store.
     */
    public async deleteAll(): Promise<void> {
        await this.adapter.deleteAll(this.getStore());
    }

    /**
     * Counts the total number of entities in the store.
     * @returns The count of entities.
     */
    public async count(): Promise<number> {
        return this.adapter.count(this.getStore());
    }

    /**
     * Returns the store name asserted to the adapter entity type.
     * @returns Store name as an EntityType.
     */
    protected getStore(): EntityType {
        return this.store as EntityType;
    }
}
