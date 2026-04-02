/**
 * @requirements
 * REQ-1: load() memoizes promise to prevent duplicate concurrent fetches → covered by "memoizes concurrent load() calls"
 * REQ-2: refresh() clears memoization and sync status → covered by "refresh() clears cached promise and sync status before forced fetch"
 * REQ-3: load() checks needsSync() unless forceSync=true → covered by "checks needsSync() for load() but bypasses it for refresh()"
 * REQ-4: returns cached data when sync not needed and data exists → covered by "returns cached adapter data when sync is not needed"
 * REQ-5: fetchRemoteData() runs when sync needed or cache missing → covered by "fetches remote data when sync is needed" and "fetches remote data when cache is missing even if sync not needed"
 * REQ-6: onPostFetch() runs after successful remote fetch → covered by "calls onPostFetch() after successful fetch"
 * REQ-7: ensureEntityId() assigns stable id to fetched entity → covered by "assigns stable entity ID before persisting fetched data"
 * REQ-8: fetched data is stored via adapter.put() before returning → covered by "stores fetched data in adapter before returning"
 * REQ-9: memoized promise clears on error to allow retry → covered by "clears memoized promise after error and allows retry"
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerPluginEntity } from '@/adapter.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { RemoteDataDAO } from '@/dao/RemoteDataDAO.js';

class TestModel {
    id: string;
    readonly name: string;

    constructor(data: { id: string; name: string }) {
        this.id = data.id;
        this.name = data.name;
    }
}

declare module '../../types.js' {
    interface PluginEntityMap {
        remoteTestEntity: TestModel;
    }
}

registerPluginEntity('remoteTestEntity', {});

class TestRemoteDAO extends RemoteDataDAO<TestModel> {
    fetchRemoteDataFn = vi.fn<() => Promise<TestModel>>();
    needsSyncFn = vi.fn<() => Promise<boolean>>();
    onPostFetchFn = vi.fn<(data: TestModel) => Promise<void>>();

    protected getStoreKey(): string {
        return 'remoteTestEntity';
    }

    protected getSyncFileKey(): string {
        return 'test:remote-file';
    }

    protected override async fetchRemoteData(): Promise<TestModel> {
        return this.fetchRemoteDataFn();
    }

    protected override async needsSync(): Promise<boolean> {
        return this.needsSyncFn();
    }

    protected override async onPostFetch(data: TestModel): Promise<void> {
        await this.onPostFetchFn(data);
    }
}

describe('RemoteDataDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: TestRemoteDAO;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
        dao = new TestRemoteDAO(adapter);
        dao.needsSyncFn.mockResolvedValue(true);
        dao.onPostFetchFn.mockResolvedValue();
    });

    it('memoizes concurrent load() calls', async () => {
        const data = new TestModel({ id: '', name: 'remote' });
        const deferred = Promise.resolve(data);

        dao.fetchRemoteDataFn.mockReturnValue(deferred);

        const promiseA = dao.load();
        const promiseB = dao.load();
        const [resultA, resultB] = await Promise.all([promiseA, promiseB]);

        expect(resultA).toBe(data);
        expect(resultB).toBe(data);
        expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
    });

    it('refresh() clears cached promise and sync status before forced fetch', async () => {
        const first = new TestModel({ id: '', name: 'first' });
        const refreshed = new TestModel({ id: '', name: 'refreshed' });
        const deleteSyncStatusSpy = vi.spyOn(adapter, 'deleteSyncStatus');

        await adapter.setSyncStatus('test:remote-file', 'old-sha');
        dao.fetchRemoteDataFn.mockResolvedValueOnce(first);
        await dao.load();

        dao.fetchRemoteDataFn.mockResolvedValueOnce(refreshed);
        const result = await dao.refresh();

        expect(deleteSyncStatusSpy).toHaveBeenCalledWith('test:remote-file');
        await expect(adapter.getSyncStatus('test:remote-file')).resolves.toBeNull();
        expect(result).toBe(refreshed);
        expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(2);
    });

    it('checks needsSync() for load() but bypasses it for refresh()', async () => {
        const cached = new TestModel({ id: 'test:remote-file', name: 'cached' });
        const refreshed = new TestModel({ id: '', name: 'refreshed' });

        await adapter.put('remoteTestEntity', cached);
        dao.needsSyncFn.mockResolvedValueOnce(false);

        const loadResult = await dao.load();

        expect(loadResult).toEqual(cached);
        expect(dao.needsSyncFn).toHaveBeenCalledTimes(1);
        expect(dao.fetchRemoteDataFn).not.toHaveBeenCalled();

        dao.fetchRemoteDataFn.mockResolvedValueOnce(refreshed);
        await dao.refresh();

        expect(dao.needsSyncFn).toHaveBeenCalledTimes(1);
        expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
    });

    it('returns cached adapter data when sync is not needed', async () => {
        const cached = new TestModel({ id: 'test:remote-file', name: 'cached' });

        await adapter.put('remoteTestEntity', cached);
        dao.needsSyncFn.mockResolvedValueOnce(false);

        const result = await dao.load();

        expect(result).toEqual(cached);
        expect(dao.fetchRemoteDataFn).not.toHaveBeenCalled();
    });

    it('fetches remote data when sync is needed', async () => {
        const data = new TestModel({ id: '', name: 'remote' });

        dao.needsSyncFn.mockResolvedValueOnce(true);
        dao.fetchRemoteDataFn.mockResolvedValueOnce(data);

        const result = await dao.load();

        expect(result).toBe(data);
        expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
    });

    it('fetches remote data when cache is missing even if sync not needed', async () => {
        const data = new TestModel({ id: '', name: 'remote' });

        dao.needsSyncFn.mockResolvedValueOnce(false);
        dao.fetchRemoteDataFn.mockResolvedValueOnce(data);

        const result = await dao.load();

        expect(result).toBe(data);
        expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(1);
    });

    it('calls onPostFetch() after successful fetch', async () => {
        const data = new TestModel({ id: '', name: 'remote' });

        dao.fetchRemoteDataFn.mockResolvedValueOnce(data);
        await dao.load();

        expect(dao.onPostFetchFn).toHaveBeenCalledTimes(1);
        expect(dao.onPostFetchFn).toHaveBeenCalledWith(data);
    });

    it('assigns stable entity ID before persisting fetched data', async () => {
        const data = new TestModel({ id: '', name: 'remote' });

        dao.fetchRemoteDataFn.mockResolvedValueOnce(data);
        await dao.load();

        const stored = await adapter.get('remoteTestEntity', 'test:remote-file');
        expect(stored).not.toBeNull();
        expect(stored?.id).toBe('test:remote-file');
    });

    it('stores fetched data in adapter before returning', async () => {
        const data = new TestModel({ id: '', name: 'remote' });
        const putSpy = vi.spyOn(adapter, 'put');

        dao.fetchRemoteDataFn.mockResolvedValueOnce(data);
        const result = await dao.load();

        expect(result).toBe(data);
        expect(putSpy).toHaveBeenCalledTimes(1);
        expect(putSpy).toHaveBeenCalledWith('remoteTestEntity', data);
        await expect(adapter.get('remoteTestEntity', 'test:remote-file')).resolves.toEqual(data);
    });

    it('clears memoized promise after error and allows retry', async () => {
        const error = new Error('remote fetch failed');
        const data = new TestModel({ id: '', name: 'retry-success' });

        dao.fetchRemoteDataFn.mockRejectedValueOnce(error);
        dao.fetchRemoteDataFn.mockResolvedValueOnce(data);

        await expect(dao.load()).rejects.toThrow('remote fetch failed');

        const retryResult = await dao.load();
        expect(retryResult).toBe(data);
        expect(dao.fetchRemoteDataFn).toHaveBeenCalledTimes(2);
    });
});
