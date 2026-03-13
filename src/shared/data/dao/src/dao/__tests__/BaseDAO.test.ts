import { beforeEach, describe, it, expect, vi } from 'vitest';
import { BaseDAO } from '@/dao/BaseDAO.js';
import { MockDatabaseAdapter } from '@/__mocks__/MockDatabaseAdapter.js';
import { registerPluginEntity } from '@/adapter.js';

type TestEntity = {
    id: string;
    name: string;
};

declare module '../../types.js' {
    interface PluginEntityMap {
        baseTestEntity: TestEntity;
    }
}

registerPluginEntity('baseTestEntity', {});

class TestDAO extends BaseDAO<TestEntity> {
    public constructor(adapter: MockDatabaseAdapter) {
        super(adapter, 'baseTestEntity');
    }
}

function makeEntity(overrides: Partial<TestEntity> = {}): TestEntity {
    return {
        id: 'entity-1',
        name: 'Test Entity',
        ...overrides,
    };
}

describe('BaseDAO', () => {
    let adapter: MockDatabaseAdapter;
    let dao: TestDAO;

    beforeEach(async () => {
        adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        dao = new TestDAO(adapter);
    });

    describe('constructor', () => {
        it('creates a concrete BaseDAO instance', () => {
            expect(dao).toBeInstanceOf(TestDAO);
        });
    });

    describe('CRUD operations', () => {
        it('get() retrieves an entity by ID', async () => {
            const entity = makeEntity({ id: 'e-1' });
            await adapter.put('baseTestEntity', entity);

            const retrieved = await dao.get('e-1');

            expect(retrieved).toEqual(entity);
        });

        it('get() returns null when entity does not exist', async () => {
            const retrieved = await dao.get('missing');

            expect(retrieved).toBeNull();
        });

        it('list() returns all entities', async () => {
            await adapter.put('baseTestEntity', makeEntity({ id: 'e-1' }));
            await adapter.put('baseTestEntity', makeEntity({ id: 'e-2' }));

            const all = await dao.list();

            expect(all).toHaveLength(2);
        });

        it('save() persists an entity to the store', async () => {
            const entity = makeEntity({ id: 'e-3' });

            await dao.save(entity);

            const retrieved = await adapter.get('baseTestEntity', 'e-3');
            expect(retrieved).toEqual(entity);
        });

        it('saveMany() persists multiple entities', async () => {
            const entities = [makeEntity({ id: 'e-1' }), makeEntity({ id: 'e-2' })];

            await dao.saveMany(entities);

            const all = await dao.list();
            expect(all).toHaveLength(2);
        });

        it('delete() removes an entity by ID', async () => {
            const entity = makeEntity({ id: 'e-1' });
            await adapter.put('baseTestEntity', entity);

            await dao.delete('e-1');

            const retrieved = await adapter.get('baseTestEntity', 'e-1');
            expect(retrieved).toBeNull();
        });

        it('deleteAll() removes all entities', async () => {
            await adapter.put('baseTestEntity', makeEntity({ id: 'e-1' }));
            await adapter.put('baseTestEntity', makeEntity({ id: 'e-2' }));

            await dao.deleteAll();

            const all = await dao.list();
            expect(all).toEqual([]);
        });

        it('count() returns the number of entities', async () => {
            await adapter.put('baseTestEntity', makeEntity({ id: 'e-1' }));
            await adapter.put('baseTestEntity', makeEntity({ id: 'e-2' }));

            const count = await dao.count();

            expect(count).toBe(2);
        });
    });

    describe('Edge cases', () => {
        it('list() returns empty array when store is empty', async () => {
            const all = await dao.list();

            expect(all).toEqual([]);
        });

        it('delete() resolves when entity does not exist', async () => {
            await expect(dao.delete('missing')).resolves.toBeUndefined();
        });
    });

    describe('Error handling', () => {
        it('save() propagates adapter errors', async () => {
            const error = new Error('Adapter failure');
            vi.spyOn(adapter, 'put').mockRejectedValueOnce(error);

            await expect(dao.save(makeEntity())).rejects.toThrow('Adapter failure');
        });
    });
});
