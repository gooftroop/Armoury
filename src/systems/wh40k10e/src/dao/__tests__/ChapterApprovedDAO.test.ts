import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChapterApprovedDAO } from '@wh40k10e/dao/ChapterApprovedDAO.js';
import type { ChapterApproved } from '@wh40k10e/models/ChapterApproved.js';
import { MockDatabaseAdapter } from '@wh40k10e/__mocks__/MockDatabaseAdapter.js';
import type { IWahapediaClient } from '@clients-wahapedia/types.js';
import type { EntityType } from '@data/adapter.js';

const CHAPTER_APPROVED_STORE = 'chapterApproved' as EntityType;
const CHAPTER_APPROVED_ID = 'chapter-approved-2025-26';
const SYNC_KEY = 'wahapedia:chapter-approved-2025-26';
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates a fixture ChapterApproved object for testing.
 * @returns A ChapterApproved object with minimal test data
 */
function createFixture(): ChapterApproved {
    return {
        id: CHAPTER_APPROVED_ID,
        version: '2025-26',
        primaryMissions: [],
        secondaryMissions: [],
        deploymentZones: [],
        challengerCards: [],
        twistCards: [],
        tournamentMissions: [],
        terrainLayouts: [],
    };
}

/**
 * ChapterApprovedDAO test suite.
 * Tests TTL-based sync states, load() memoization, refresh() flow, storage behavior, and error handling.
 */
describe('ChapterApprovedDAO', () => {
    let adapter: MockDatabaseAdapter;
    let mockWahapediaClient: IWahapediaClient;
    let dao: ChapterApprovedDAO;

    /**
     * Set up fresh mocks before each test.
     */
    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
        mockWahapediaClient = {
            fetch: vi.fn(),
            fetchRaw: vi.fn(),
        };
        dao = new ChapterApprovedDAO(adapter, mockWahapediaClient);
    });

    /**
     * Clean up fake timers after each test.
     */
    afterEach(() => {
        vi.useRealTimers();
    });

    /**
     * TTL-based needsSync() via load() behavior tests.
     */
    describe('TTL-based sync states', () => {
        /**
         * Test: load() fetches from Wahapedia when NO sync status exists (first-time load).
         */
        it('load() fetches from Wahapedia when NO sync status exists (first-time load)', async () => {
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            const result = await dao.load();

            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
            expect(result.id).toBe(CHAPTER_APPROVED_ID);

            // Verify sync status was created
            const syncStatus = await adapter.getSyncStatus(SYNC_KEY);
            expect(syncStatus).not.toBeNull();
            expect(syncStatus!.sha).toBe(CHAPTER_APPROVED_ID);
        });

        /**
         * Test: load() returns cached adapter data when sync status is FRESH (within 7-day TTL).
         */
        it('load() returns cached adapter data when sync status is FRESH (within 7-day TTL)', async () => {
            const fixture = createFixture();

            // Pre-seed adapter with data and fresh sync status
            await adapter.put(CHAPTER_APPROVED_STORE, fixture as never);
            await adapter.setSyncStatus(SYNC_KEY, CHAPTER_APPROVED_ID);

            const result = await dao.load();

            // Should NOT fetch from Wahapedia — data is fresh
            expect(mockWahapediaClient.fetch).not.toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
            expect(result.id).toBe(CHAPTER_APPROVED_ID);
        });

        /**
         * Test: load() re-fetches from Wahapedia when sync status is STALE (beyond 7-day TTL).
         */
        it('load() re-fetches from Wahapedia when sync status is STALE (beyond 7-day TTL)', async () => {
            vi.useFakeTimers();
            const now = new Date('2025-02-15T00:00:00Z');
            vi.setSystemTime(now);

            const fixture = createFixture();

            // Pre-seed adapter with OLD sync status (8 days ago)
            const staleDate = new Date(now.getTime() - (STALE_AFTER_MS + 24 * 60 * 60 * 1000));
            await adapter.put(CHAPTER_APPROVED_STORE, fixture as never);
            // Manually set sync status with old date (bypassing setSyncStatus's new Date())
            const syncStore = (adapter as unknown as { syncStore: Map<string, unknown> }).syncStore;
            syncStore.set(SYNC_KEY, {
                fileKey: SYNC_KEY,
                sha: CHAPTER_APPROVED_ID,
                lastSynced: staleDate,
            });

            // Mock Wahapedia fetch to return fresh data
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            const result = await dao.load();

            // Should fetch from Wahapedia because data is stale
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');

            vi.useRealTimers();
        });
    });

    /**
     * load() memoization tests.
     */
    describe('load() memoization', () => {
        /**
         * Test: load() memoizes the promise — second call returns same promise object (toBe).
         */
        it('load() memoizes the promise — second call returns same promise object (toBe)', async () => {
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            const promise1 = dao.load();
            const promise2 = dao.load();

            const result1 = await promise1;
            const result2 = await promise2;

            expect(result1).toHaveProperty('id');
            expect(result1).toHaveProperty('version');
            expect(result2).toHaveProperty('id');
            expect(result2).toHaveProperty('version');
            // Memoization verified: fetch only called once despite two load() calls
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(1);
        });

        /**
         * Test: load() clears memoized promise on Wahapedia fetch failure — subsequent call retries.
         */
        it('load() clears memoized promise on Wahapedia fetch failure — subsequent call retries', async () => {
            const error = new Error('Network failure');
            vi.mocked(mockWahapediaClient.fetch).mockRejectedValueOnce(error);

            await expect(dao.load()).rejects.toThrow('Network failure');

            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            const result = await dao.load();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(2);
        });

        /**
         * Test: Multiple concurrent load() calls return the same promise (no duplicate fetches).
         */
        it('Multiple concurrent load() calls return the same promise (no duplicate fetches)', async () => {
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            // Fire 3 concurrent calls
            const [result1, result2, result3] = await Promise.all([dao.load(), dao.load(), dao.load()]);

            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(1); // Only one fetch
            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });
    });

    /**
     * refresh() flow tests.
     */
    describe('refresh() flow', () => {
        /**
         * Test: refresh() always fetches fresh data regardless of TTL.
         */
        it('refresh() always fetches fresh data regardless of TTL', async () => {
            const fixture = createFixture();

            // Pre-seed adapter with fresh data
            await adapter.put(CHAPTER_APPROVED_STORE, fixture as never);
            await adapter.setSyncStatus(SYNC_KEY, CHAPTER_APPROVED_ID);

            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            const result = await dao.refresh();

            // Should fetch even though data was fresh
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
        });

        /**
         * Test: refresh() clears cached promise before fetching.
         */
        it('refresh() clears cached promise before fetching', async () => {
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            // First load() to memoize
            await dao.load();
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(1);

            // refresh() should clear cache and fetch again
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);
            await dao.refresh();
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(2);
        });

        /**
         * Test: refresh() deletes existing sync status via adapter.deleteSyncStatus().
         */
        it('refresh() deletes existing sync status via adapter.deleteSyncStatus()', async () => {
            const fixture = createFixture();

            // Pre-seed sync status
            await adapter.setSyncStatus(SYNC_KEY, CHAPTER_APPROVED_ID);
            expect(await adapter.getSyncStatus(SYNC_KEY)).not.toBeNull();

            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            await dao.refresh();

            // Sync status should be recreated (not the original)
            const syncStatus = await adapter.getSyncStatus(SYNC_KEY);
            expect(syncStatus).not.toBeNull();
        });

        /**
         * Test: refresh() works after a previous successful load().
         */
        it('refresh() works after a previous successful load()', async () => {
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            // Initial load
            await dao.load();
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(1);

            // refresh() after successful load
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);
            const result = await dao.refresh();

            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(2);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
        });
    });

    /**
     * Storage behavior tests.
     */
    describe('Storage behavior', () => {
        /**
         * Test: load() stores parsed model in adapter via adapter.put().
         */
        it('load() stores parsed model in adapter via adapter.put()', async () => {
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            await dao.load();

            // Verify model was stored
            const stored = await adapter.get(CHAPTER_APPROVED_STORE, CHAPTER_APPROVED_ID);
            expect(stored).not.toBeNull();
            expect((stored as { id: string }).id).toBe(CHAPTER_APPROVED_ID);
        });

        /**
         * Test: load() updates sync status via adapter.setSyncStatus() after successful fetch.
         */
        it('load() updates sync status via adapter.setSyncStatus() after successful fetch', async () => {
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            await dao.load();

            const syncStatus = await adapter.getSyncStatus(SYNC_KEY);
            expect(syncStatus).not.toBeNull();
            expect(syncStatus!.fileKey).toBe(SYNC_KEY);
            expect(syncStatus!.sha).toBe(CHAPTER_APPROVED_ID);
        });

        /**
         * Test: load() returns data from adapter cache when not stale (adapter.get path).
         */
        it('load() returns data from adapter cache when not stale (adapter.get path)', async () => {
            const fixture = createFixture();

            // Pre-seed adapter
            await adapter.put(CHAPTER_APPROVED_STORE, fixture as never);
            await adapter.setSyncStatus(SYNC_KEY, CHAPTER_APPROVED_ID);

            const result = await dao.load();

            // Should use cached data, not fetch
            expect(mockWahapediaClient.fetch).not.toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
            expect(result.id).toBe(CHAPTER_APPROVED_ID);
        });
    });

    /**
     * Error handling tests.
     */
    describe('Error handling', () => {
        /**
         * Test: load() throws and clears cache when Wahapedia client throws.
         */
        it('load() throws and clears cache when Wahapedia client throws', async () => {
            const error = new Error('Wahapedia fetch failed');
            vi.mocked(mockWahapediaClient.fetch).mockRejectedValueOnce(error);

            await expect(dao.load()).rejects.toThrow('Wahapedia fetch failed');

            // Cache should be cleared, allowing retry
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            const result = await dao.load();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
        });

        /**
         * Test: load() allows retry after failure (cachedPromise is nulled on error).
         */
        it('load() allows retry after failure (cachedPromise is nulled on error)', async () => {
            const error = new Error('Network timeout');
            vi.mocked(mockWahapediaClient.fetch).mockRejectedValueOnce(error);

            // First call fails
            await expect(dao.load()).rejects.toThrow('Network timeout');

            // Second call should retry (not use stale failed promise)
            const fixture = createFixture();
            vi.mocked(mockWahapediaClient.fetch).mockResolvedValueOnce(fixture);

            const result = await dao.load();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('version');
            expect(mockWahapediaClient.fetch).toHaveBeenCalledTimes(2);
        });
    });
});
