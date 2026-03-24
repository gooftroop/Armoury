/**
 * @requirements
 * REQ-1: TTLSyncBaseDAO extends RemoteDataDAO → covered by "is an instance of RemoteDataDAO"
 * REQ-2: data is stale when elapsed time exceeds staleAfterMs → covered by "needsSync() returns false within TTL and true after TTL"
 * REQ-3: needsSync() returns true when no sync status exists → covered by "needsSync() returns true when no sync status exists"
 * REQ-4: onPostFetch() stores current timestamp sync status after successful fetch → covered by "load() stores sync status timestamp after successful fetch"
 * REQ-5: staleAfterMs defaults to 7 days when omitted → covered by "uses DEFAULT_STALE_AFTER_MS when staleAfterMs is not provided"
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerPluginEntity } from '@/adapter.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { RemoteDataDAO } from '@/dao/RemoteDataDAO.js';
import { DEFAULT_STALE_AFTER_MS, TTLSyncBaseDAO } from '@/dao/TTLSyncBaseDAO.js';

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
        testEntity: TestModel;
    }
}

registerPluginEntity('testEntity', {});

class TestTTLDAO extends TTLSyncBaseDAO<TestModel> {
    fetchRemoteDataFn = vi.fn<() => Promise<TestModel>>();

    protected getStoreKey(): string {
        return 'testEntity';
    }

    protected getSyncFileKey(): string {
        return 'test:ttl-file';
    }

    protected override async fetchRemoteData(): Promise<TestModel> {
        return this.fetchRemoteDataFn();
    }

    async readNeedsSync(): Promise<boolean> {
        return this.needsSync();
    }
}

describe('TTLSyncBaseDAO', () => {
    let adapter: MockDatabaseAdapter;

    beforeEach(() => {
        adapter = new MockDatabaseAdapter();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    });

    it('is an instance of RemoteDataDAO', () => {
        const dao = new TestTTLDAO(adapter);

        expect(dao).toBeInstanceOf(RemoteDataDAO);
    });

    it('needsSync() returns true when no sync status exists', async () => {
        const dao = new TestTTLDAO(adapter, 1000);

        await expect(dao.readNeedsSync()).resolves.toBe(true);
    });

    it('needsSync() returns false within TTL and true after TTL', async () => {
        const staleAfterMs = 2000;
        const dao = new TestTTLDAO(adapter, staleAfterMs);

        await adapter.setSyncStatus('test:ttl-file', 'seed');

        vi.advanceTimersByTime(staleAfterMs - 1);
        await expect(dao.readNeedsSync()).resolves.toBe(false);

        vi.advanceTimersByTime(2);
        await expect(dao.readNeedsSync()).resolves.toBe(true);
    });

    it('load() stores sync status timestamp after successful fetch', async () => {
        const dao = new TestTTLDAO(adapter, 1000);
        const data = new TestModel({ id: '', name: 'remote' });

        dao.fetchRemoteDataFn.mockResolvedValueOnce(data);
        await dao.load();

        const status = await adapter.getSyncStatus('test:ttl-file');
        expect(status).not.toBeNull();
        expect(status?.fileKey).toBe('test:ttl-file');
        expect(status?.sha).toBe('test:ttl-file');
        expect(status?.lastSynced.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    });

    it('uses DEFAULT_STALE_AFTER_MS when staleAfterMs is not provided', async () => {
        const dao = new TestTTLDAO(adapter);

        await adapter.setSyncStatus('test:ttl-file', 'seed');

        vi.advanceTimersByTime(DEFAULT_STALE_AFTER_MS - 1);
        await expect(dao.readNeedsSync()).resolves.toBe(false);

        vi.advanceTimersByTime(2);
        await expect(dao.readNeedsSync()).resolves.toBe(true);
    });
});
