/**
 * Abstract base DAO for entities synced from HTTP sources with TTL-based freshness.
 *
 * Instead of checking a Git SHA, considers data stale after a configurable time period.
 * Suitable for data sources that don't provide version hashes, such as web scraping targets.
 *
 * @module TTLSyncBaseDAO
 *
 * @requirements
 * 1. Must extend RemoteDataDAO for shared load/sync infrastructure.
 * 2. Must consider data stale when elapsed time since last sync exceeds staleAfterMs.
 * 3. Must always return true from needsSync() when no sync status exists.
 * 4. Must store the current timestamp as sync status after successful fetch.
 * 5. Must default staleAfterMs to 7 days when not specified.
 */

import type { DatabaseAdapter } from '../adapter.ts';
import { RemoteDataDAO } from './RemoteDataDAO.ts';

/** Default TTL: 7 days in milliseconds. */
const DEFAULT_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Abstract base DAO for entities synced from an HTTP source with TTL-based freshness.
 * Instead of checking a Git SHA, considers data stale after a configurable time period.
 * Subclasses implement store keys, entity IDs, and the remote fetch logic.
 */
abstract class TTLSyncBaseDAO<T> extends RemoteDataDAO<T> {
    /** Time in milliseconds after which cached data is considered stale. */
    private readonly staleAfterMs: number;

    /**
     * Creates a TTL-based sync DAO.
     * @param adapter - Database adapter instance
     * @param staleAfterMs - Milliseconds after which cached data is considered stale (defaults to 7 days)
     */
    constructor(adapter: DatabaseAdapter, staleAfterMs: number = DEFAULT_STALE_AFTER_MS) {
        super(adapter);
        this.staleAfterMs = staleAfterMs;
    }

    /**
     * Checks if cached data is stale based on TTL.
     * Returns true if no sync status exists or if the elapsed time exceeds the TTL.
     * @returns true if data needs to be re-fetched, false if still fresh
     */
    protected override async needsSync(): Promise<boolean> {
        const status = await this.adapter.getSyncStatus(this.getSyncFileKey());

        if (!status) {
            return true;
        }

        const lastSynced = new Date(status.lastSynced).getTime();

        return Date.now() - lastSynced > this.staleAfterMs;
    }

    /**
     * Stores the current timestamp as sync status after a successful fetch.
     * Uses the entity ID as a placeholder for the SHA field since TTL sync
     * does not track file hashes.
     */
    protected override async onPostFetch(_data: T): Promise<void> {
        await this.adapter.setSyncStatus(this.getSyncFileKey(), this.getEntityId());
    }
}

export { TTLSyncBaseDAO, DEFAULT_STALE_AFTER_MS };
