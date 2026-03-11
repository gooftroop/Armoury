import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChapterApprovedDAO } from '../ChapterApprovedDAO.ts';
import type { ChapterApproved } from '../../models/ChapterApproved.ts';
import { MockDatabaseAdapter } from '../../__mocks__/MockDatabaseAdapter.ts';
import { MockWahapediaClient } from '../../__mocks__/MockWahapediaClient.ts';
import type { EntityType } from '@armoury/data-dao/adapter';

const CHAPTER_APPROVED_STORE = 'chapterApproved' as EntityType;
const CHAPTER_APPROVED_ID = 'chapter-approved-2025-26';
const SYNC_KEY = 'wahapedia:chapter-approved-2025-26';
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

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

describe('ChapterApprovedDAO (integration)', () => {
    let adapter: MockDatabaseAdapter;
    let wahapediaClient: MockWahapediaClient;
    let dao: ChapterApprovedDAO;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
        wahapediaClient = new MockWahapediaClient();
        dao = new ChapterApprovedDAO(adapter, wahapediaClient);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('load() propagates parser errors from Wahapedia fetch', async () => {
        await expect(dao.load()).rejects.toThrow('ChapterApprovedParser.parse() is not yet implemented');
        expect(wahapediaClient.fetchedUrls.length).toBe(1);
    });

    it('returns cached data when sync status is fresh', async () => {
        const fixture = createFixture();
        await adapter.put(CHAPTER_APPROVED_STORE, fixture as never);
        await adapter.setSyncStatus(SYNC_KEY, CHAPTER_APPROVED_ID);

        const result = await dao.load();

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('version');
        expect(result.id).toBe(CHAPTER_APPROVED_ID);
        expect(wahapediaClient.fetchedUrls.length).toBe(0);
    });

    it('re-fetches when sync status is stale', async () => {
        vi.useFakeTimers();
        const now = new Date('2026-02-01T00:00:00Z');
        vi.setSystemTime(now);

        const fixture = createFixture();
        await adapter.put(CHAPTER_APPROVED_STORE, fixture as never);

        const staleDate = new Date(now.getTime() - (STALE_AFTER_MS + 24 * 60 * 60 * 1000));
        const syncStore = (adapter as unknown as { syncStore: Map<string, unknown> }).syncStore;
        syncStore.set(SYNC_KEY, {
            fileKey: SYNC_KEY,
            sha: CHAPTER_APPROVED_ID,
            lastSynced: staleDate,
        });

        await expect(dao.load()).rejects.toThrow('ChapterApprovedParser.parse() is not yet implemented');
        expect(wahapediaClient.fetchedUrls.length).toBe(1);
    });

    it('refresh() clears cached state and retries on next load', async () => {
        const fixture = createFixture();
        await adapter.put(CHAPTER_APPROVED_STORE, fixture as never);
        await adapter.setSyncStatus(SYNC_KEY, CHAPTER_APPROVED_ID);

        const deleteSpy = vi.spyOn(adapter, 'deleteSyncStatus');

        await dao.load();

        await expect(dao.refresh()).rejects.toThrow('ChapterApprovedParser.parse() is not yet implemented');
        expect(deleteSpy).toHaveBeenCalledWith(SYNC_KEY);

        await expect(dao.load()).rejects.toThrow('ChapterApprovedParser.parse() is not yet implemented');
        expect(wahapediaClient.fetchedUrls.length).toBe(2);
    });
});
