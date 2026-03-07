/**
 * Abstract base DAO for entities synced from a remote data source.
 *
 * Provides memoized loading, cache-or-fetch logic, and entity ID management.
 * Subclasses implement the specifics of how remote data is fetched and how
 * sync status is tracked (e.g., Git SHA vs TTL timestamp).
 *
 * @module RemoteDataDAO
 *
 * @requirements
 * 1. Must memoize the load() promise to prevent duplicate concurrent fetches.
 * 2. Must clear memoization and sync status on refresh().
 * 3. Must check needsSync() before fetching remote data, unless forceSync is true.
 * 4. Must return cached data from adapter when sync is not needed and data exists.
 * 5. Must call fetchRemoteData() when sync is needed or no cached data exists.
 * 6. Must call onPostFetch() after successful remote fetch to update sync status.
 * 7. Must ensure fetched entities have a stable ID via ensureEntityId().
 * 8. Must store fetched data via adapter.put() before returning.
 * 9. Must clear memoized promise on error to allow retry.
 */

import type { DatabaseAdapter, EntityMap, EntityType } from '@data/adapter.js';

/**
 * Abstract base DAO for entities synced from a remote data source.
 * Provides memoized loading, cache-or-fetch logic, and entity ID management.
 * Subclasses implement the specifics of how remote data is fetched and how
 * sync status is tracked (e.g., Git SHA vs TTL timestamp).
 */
abstract class RemoteDataDAO<T> {
    /** Database adapter for persistence operations. */
    protected readonly adapter: DatabaseAdapter;

    /** Memoized promise for the current load operation, preventing duplicate fetches. */
    protected cachedPromise: Promise<T> | null = null;

    /**
     * Creates a remote data DAO.
     * @param adapter - Database adapter instance for persistence
     */
    constructor(adapter: DatabaseAdapter) {
        this.adapter = adapter;
    }

    /** Returns the entity store key used by the adapter. */
    protected abstract getStoreKey(): string;

    /** Returns the sync status file key used for tracking updates. */
    protected abstract getSyncFileKey(): string;

    /** Fetches and parses remote data from the data source. */
    protected abstract fetchRemoteData(): Promise<T>;

    /** Checks if the remote source has updates compared to local sync status. */
    protected abstract needsSync(): Promise<boolean>;

    /** Called after a successful remote fetch to update sync tracking (e.g., SHA or timestamp). */
    protected abstract onPostFetch(data: T): Promise<void>;

    /**
     * Returns the entity ID used for storage and lookup.
     * Defaults to the sync file key for singleton entities.
     * Subclasses may override for entity-specific IDs.
     */
    protected getEntityId(): string {
        return this.getSyncFileKey();
    }

    /**
     * Loads the data from cache or syncs from remote as needed.
     * Memoizes the load promise to avoid duplicate fetches.
     */
    async load(): Promise<T> {
        if (this.cachedPromise) {
            return this.cachedPromise;
        }

        const promise = this.loadWithSync(false);
        this.cachedPromise = promise;

        return promise;
    }

    /**
     * Forces a re-sync and returns the latest data.
     * Clears the memoized promise and sync status before fetching.
     */
    async refresh(): Promise<T> {
        this.cachedPromise = null;
        await this.adapter.deleteSyncStatus(this.getSyncFileKey());

        return this.loadWithSync(true);
    }

    /**
     * Loads data with optional force-sync behavior.
     * Checks cache first when sync is not needed, otherwise fetches from remote.
     * @param forceSync - Whether to force a remote sync
     */
    private async loadWithSync(forceSync: boolean): Promise<T> {
        try {
            const storeKey = this.getStoreKey() as EntityType;
            const entityId = this.getEntityId();
            const shouldSync = forceSync || (await this.needsSync());

            if (!shouldSync) {
                const existing = await this.adapter.get(storeKey, entityId);

                if (existing) {
                    return existing as T;
                }
            }

            const data = await this.fetchRemoteData();
            this.ensureEntityId(data, entityId);

            await this.adapter.put(storeKey, data as EntityMap[EntityType]);
            await this.onPostFetch(data);

            return data;
        } catch (error) {
            this.cachedPromise = null;
            throw error;
        }
    }

    /**
     * Ensures the entity has a stable ID for storage.
     * Sets the `id` property on the data object if it exists.
     * @param data - The entity instance
     * @param entityId - Stable ID to set when possible
     */
    private ensureEntityId(data: T, entityId: string): void {
        if (typeof data !== 'object' || data === null) {
            return;
        }

        if ('id' in data) {
            const record = data as { id?: string };
            record.id = entityId;
        }
    }
}

export { RemoteDataDAO };
