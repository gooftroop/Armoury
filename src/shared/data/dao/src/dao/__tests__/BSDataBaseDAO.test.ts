import { beforeEach, describe, it, expect, vi } from 'vitest';
import { BSDataBaseDAO } from '@/dao/BSDataBaseDAO.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import type { IGitHubClient } from '@armoury/clients-github/types';
import { registerPluginEntity } from '@/adapter.js';

/**
 * Test model for BSDataBaseDAO testing.
 */
class TestModel {
    readonly id: string;
    readonly name: string;

    constructor(data: { id: string; name: string }) {
        this.id = data.id;
        this.name = data.name;
    }
}

declare module '../../types.ts' {
    interface PluginEntityMap {
        testEntity: TestModel;
    }
}

registerPluginEntity('testEntity', {});

/**
 * Concrete DAO implementation for testing the abstract BSDataBaseDAO.
 */
class TestDAO extends BSDataBaseDAO<TestModel> {
    fetchRemoteDataFn = vi.fn();

    protected getStoreKey(): string {
        return 'testEntity';
    }

    protected getSyncFileKey(): string {
        return 'test:file.gst';
    }

    protected override async fetchRemoteData(): Promise<TestModel> {
        return this.fetchRemoteDataFn();
    }
}

/**
 * Creates a mock GitHub client with all methods stubbed.
 */
function createMockGitHubClient(): IGitHubClient {
    return {
        listFiles: vi.fn(),
        getFileSha: vi.fn(),
        downloadFile: vi.fn(),
        checkForUpdates: vi.fn(),
    };
}

describe('BSDataBaseDAO', () => {
    let adapter: MockDatabaseAdapter;
    let githubClient: IGitHubClient;
    let dao: TestDAO;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
        githubClient = createMockGitHubClient();
        dao = new TestDAO(adapter, githubClient, 'owner', 'repo');
    });

    describe('needsSync() states (tested via load() behavior)', () => {
        it('load() fetches remote data when NO sync status exists in adapter (first sync)', async () => {
            const testData = new TestModel({ id: 'test:file.gst', name: 'Test' });

            dao.fetchRemoteDataFn.mockResolvedValue(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('sha123');

            const result = await dao.load();

            expect(result).toBe(testData);
            expect(dao.fetchRemoteDataFn).toHaveBeenCalled();
            expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
            await expect(adapter.getSyncStatus('test:file.gst')).resolves.toMatchObject({
                fileKey: 'test:file.gst',
                sha: 'sha123',
            });
        });

        it('load() uses cached adapter data when SHA matches (checkForUpdates returns false)', async () => {
            const cachedData = new TestModel({ id: 'test:file.gst', name: 'Cached' });

            await adapter.setSyncStatus('test:file.gst', 'sha123');
            await adapter.put('testEntity', cachedData);

            vi.mocked(githubClient.checkForUpdates).mockResolvedValue(false);

            const result = await dao.load();

            expect(result).toEqual(cachedData);
            expect(dao.fetchRemoteDataFn).not.toHaveBeenCalled();
            expect(githubClient.checkForUpdates).toHaveBeenCalledWith('owner', 'repo', 'test:file.gst', 'sha123');
        });

        it('load() re-fetches remote data when SHA differs (checkForUpdates returns true)', async () => {
            const oldData = new TestModel({ id: 'test:file.gst', name: 'Old' });
            const newData = new TestModel({ id: 'test:file.gst', name: 'New' });

            await adapter.setSyncStatus('test:file.gst', 'oldSha');
            await adapter.put('testEntity', oldData);

            vi.mocked(githubClient.checkForUpdates).mockResolvedValue(true);
            dao.fetchRemoteDataFn.mockResolvedValue(newData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('newSha');

            const result = await dao.load();

            expect(result).toBe(newData);
            expect(dao.fetchRemoteDataFn).toHaveBeenCalled();
            await expect(adapter.getSyncStatus('test:file.gst')).resolves.toMatchObject({
                fileKey: 'test:file.gst',
                sha: 'newSha',
            });
        });

        it('load() re-fetches remote data when checkForUpdates throws (defaults to true)', async () => {
            const newData = new TestModel({ id: 'test:file.gst', name: 'Fallback' });

            await adapter.setSyncStatus('test:file.gst', 'sha123');

            vi.mocked(githubClient.checkForUpdates).mockRejectedValue(new Error('Network error'));
            dao.fetchRemoteDataFn.mockResolvedValue(newData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('newSha');

            const result = await dao.load();

            expect(result).toBe(newData);
            expect(dao.fetchRemoteDataFn).toHaveBeenCalled();
        });
    });

    describe('load() memoization', () => {
        it('load() memoizes the promise — second call returns same promise object', async () => {
            const testData = new TestModel({ id: 'test:file.gst', name: 'Test' });

            dao.fetchRemoteDataFn.mockResolvedValue(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('sha123');

            const promise1 = dao.load();
            const promise2 = dao.load();

            // Both calls should resolve to the same data
            const result1 = await promise1;
            const result2 = await promise2;

            expect(result1).toBe(testData);
            expect(result2).toBe(testData);
            // Memoization verified: fetch only called once despite two load() calls
            expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
        });

        it('load() clears memoized promise when fetchRemoteData throws — subsequent call retries', async () => {
            const error = new Error('Fetch failed');
            const testData = new TestModel({ id: 'test:file.gst', name: 'Test' });

            dao.fetchRemoteDataFn.mockRejectedValueOnce(error);
            dao.fetchRemoteDataFn.mockResolvedValueOnce(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('sha123');

            await expect(dao.load()).rejects.toThrow('Fetch failed');

            const result = await dao.load();

            expect(result).toBe(testData);
            expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(2);
        });

        it('load() calls updateSyncStatus with new SHA after successful fetch', async () => {
            const testData = new TestModel({ id: 'test:file.gst', name: 'Test' });

            dao.fetchRemoteDataFn.mockResolvedValue(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('newSha456');

            await dao.load();

            const syncStatus = await adapter.getSyncStatus('test:file.gst');

            expect(syncStatus).not.toBeNull();
            expect(syncStatus!.sha).toBe('newSha456');
        });
    });

    describe('refresh() flow', () => {
        it('refresh() clears cached promise and forces re-sync regardless of sync status', async () => {
            const cachedData = new TestModel({ id: 'test:file.gst', name: 'Cached' });
            const refreshedData = new TestModel({ id: 'test:file.gst', name: 'Refreshed' });

            await adapter.setSyncStatus('test:file.gst', 'sha123');
            await adapter.put('testEntity', cachedData);

            vi.mocked(githubClient.checkForUpdates).mockResolvedValue(false);
            dao.fetchRemoteDataFn.mockResolvedValue(cachedData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('sha123');

            await dao.load();
            // load() returns cached data without fetching (checkForUpdates returned false)
            expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(0);

            dao.fetchRemoteDataFn.mockResolvedValue(refreshedData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('newSha');

            const result = await dao.refresh();

            expect(result).toBe(refreshedData);
            // refresh() forces a fetch regardless of sync status
            expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
        });

        it('refresh() deletes existing sync status before re-fetching', async () => {
            const testData = new TestModel({ id: 'test:file.gst', name: 'Test' });

            await adapter.setSyncStatus('test:file.gst', 'oldSha');

            dao.fetchRemoteDataFn.mockResolvedValue(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('newSha');

            const statusBefore = await adapter.getSyncStatus('test:file.gst');
            expect(statusBefore).not.toBeNull();

            await dao.refresh();

            const statusAfter = await adapter.getSyncStatus('test:file.gst');
            expect(statusAfter).not.toBeNull();
            expect(statusAfter!.sha).toBe('newSha');
        });

        it('refresh() re-fetches even if data was previously loaded successfully', async () => {
            const firstData = new TestModel({ id: 'test:file.gst', name: 'First' });
            const secondData = new TestModel({ id: 'test:file.gst', name: 'Second' });

            dao.fetchRemoteDataFn.mockResolvedValueOnce(firstData);
            vi.mocked(githubClient.getFileSha).mockResolvedValueOnce('sha1');

            await dao.load();

            dao.fetchRemoteDataFn.mockResolvedValueOnce(secondData);
            vi.mocked(githubClient.getFileSha).mockResolvedValueOnce('sha2');

            const result = await dao.refresh();

            expect(result).toBe(secondData);
            expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('Edge cases', () => {
        it('load() sets entity ID on fetched data via ensureEntityId', async () => {
            const testData = new TestModel({ id: '', name: 'Test' });

            dao.fetchRemoteDataFn.mockResolvedValue(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('sha123');

            await dao.load();

            const stored = await adapter.get('testEntity', 'test:file.gst');

            expect(stored).not.toBeNull();
            expect(stored!.id).toBe('test:file.gst');
        });

        it('load() calls adapter.put to store fetched data', async () => {
            const testData = new TestModel({ id: 'test:file.gst', name: 'Test' });

            dao.fetchRemoteDataFn.mockResolvedValue(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('sha123');

            await dao.load();

            const stored = await adapter.get('testEntity', 'test:file.gst');

            expect(stored).not.toBeNull();
            expect(stored).toEqual(testData);
        });

        it('Multiple concurrent load() calls return the same promise (no duplicate fetches)', async () => {
            const testData = new TestModel({ id: 'test:file.gst', name: 'Test' });

            dao.fetchRemoteDataFn.mockResolvedValue(testData);
            vi.mocked(githubClient.getFileSha).mockResolvedValue('sha123');

            const promise1 = dao.load();
            const promise2 = dao.load();
            const promise3 = dao.load();

            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

            expect(result1).toBe(testData);
            expect(result2).toBe(testData);
            expect(result3).toBe(testData);
            // Memoization verified: fetch only called once despite three concurrent load() calls
            expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
        });
    });
});
