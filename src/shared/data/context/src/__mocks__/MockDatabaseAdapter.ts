import { Platform } from '@armoury/data-dao';
import type { DatabaseAdapter, EntityMap, EntityType, FileSyncStatus, QueryOptions } from '@armoury/data-dao';

/**
 * @requirements
 * - REQ-MOCK-001: Provide a minimal in-memory DatabaseAdapter for data-context unit tests.
 * - REQ-MOCK-002: Must not import any internal data-dao source files — only public package exports.
 */

/**
 * Minimal in-memory mock adapter for data-context tests.
 * Implements the full DatabaseAdapter interface with simple Map-based storage.
 * Does not depend on any data-dao internals (codecs, hydration, schema).
 */
export class MockDatabaseAdapter implements DatabaseAdapter {
    readonly platform = Platform.SQLite;
    private store = new Map<string, Map<string, unknown>>();
    private syncStore = new Map<string, FileSyncStatus>();
    initialized = false;

    async initialize(): Promise<void> {
        this.initialized = true;
    }

    async close(): Promise<void> {
        this.initialized = false;
    }

    async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        return (this.store.get(store)?.get(id) as EntityMap[T]) ?? null;
    }

    async getAll<T extends EntityType>(store: T, _options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]> {
        return Array.from(this.store.get(store)?.values() ?? []) as EntityMap[T][];
    }

    async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
        _options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]> {
        const all = await this.getAll(store);

        return all.filter((item) => (item as unknown as Record<string, unknown>)[field as string] === value);
    }

    async count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number> {
        if (field && value !== undefined) {
            return (await this.getByField(store, field, value)).length;
        }

        return (await this.getAll(store)).length;
    }

    async put<T extends EntityType>(store: T, entity: EntityMap[T]): Promise<void> {
        if (!this.store.has(store)) {
            this.store.set(store, new Map());
        }

        this.store.get(store)!.set((entity as { id: string }).id, entity);
    }

    async putMany<T extends EntityType>(store: T, entities: EntityMap[T][]): Promise<void> {
        for (const entity of entities) {
            await this.put(store, entity);
        }
    }

    async delete<T extends EntityType>(store: T, id: string): Promise<void> {
        this.store.get(store)?.delete(id);
    }

    async deleteAll<T extends EntityType>(store: T): Promise<void> {
        this.store.delete(store);
    }

    async deleteByField<T extends EntityType>(store: T, field: keyof EntityMap[T], value: string): Promise<void> {
        const items = await this.getByField(store, field, value);

        for (const item of items) {
            await this.delete(store, (item as { id: string }).id);
        }
    }

    async transaction<R>(fn: () => Promise<R>): Promise<R> {
        return fn();
    }

    async getSyncStatus(fileKey: string): Promise<FileSyncStatus | null> {
        return this.syncStore.get(fileKey) ?? null;
    }

    async getAllSyncStatuses(): Promise<FileSyncStatus[]> {
        return Array.from(this.syncStore.values());
    }

    async setSyncStatus(fileKey: string, sha: string, etag?: string): Promise<void> {
        this.syncStore.set(fileKey, { fileKey, sha, lastSynced: new Date(), etag });
    }

    async deleteSyncStatus(fileKey: string): Promise<void> {
        this.syncStore.delete(fileKey);
    }

    clear(): void {
        this.store.clear();
        this.syncStore.clear();
    }
}
