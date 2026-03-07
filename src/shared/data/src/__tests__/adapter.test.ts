import { beforeAll, describe, it, expect } from 'vitest';
import type { DatabaseAdapter, EntityMap, EntityType, QueryOptions } from '@data/adapter.js';
import { BaseDatabaseAdapter } from '@data/adapter.js';
import { Platform } from '@data/types.js';
import { registerEntityCodec } from '@data/codec.js';
import type { FileSyncStatus } from '@data/types.js';
import type { Unit } from '@wh40k10e/types/entities.js';

/**
 * Extend PluginEntityMap with game-specific entity types used in these tests.
 * This mirrors the declaration merging that the wh40k10e plugin performs at runtime.
 */
declare module '@data/types.js' {
    interface PluginEntityMap {
        unit: Unit;
        factionModel: MockHydratableEntity;
    }
}

/**
 * Mock entity class for testing codec serialization and hydration.
 */
class MockHydratableEntity {
    readonly id: string;
    readonly name: string;
    readonly sourceFiles: string[];

    constructor(data: { id: string; name: string; sourceFiles: string[] }) {
        this.id = data.id;
        this.name = data.name;
        this.sourceFiles = data.sourceFiles;
    }

    toJSON(): Record<string, unknown> {
        return { id: this.id, name: this.name, sourceFiles: this.sourceFiles };
    }

    static fromJSON(raw: Record<string, unknown>): MockHydratableEntity {
        return new MockHydratableEntity({
            id: raw.id as string,
            name: raw.name as string,
            sourceFiles: raw.sourceFiles as string[],
        });
    }
}

class MockDatabaseAdapter extends BaseDatabaseAdapter {
    readonly platform = Platform.SQLite;
    private store = new Map<string, Map<string, unknown>>();
    private syncStore = new Map<string, FileSyncStatus>();
    initialized = false;
    closed = false;

    async initialize(): Promise<void> {
        this.initialized = true;
    }

    async close(): Promise<void> {
        this.closed = true;
    }

    async get<T extends EntityType>(store: T, id: string): Promise<EntityMap[T] | null> {
        const storeData = this.store.get(store);

        return (storeData?.get(id) as EntityMap[T]) ?? null;
    }

    async getAll<T extends EntityType>(store: T, options?: QueryOptions<EntityMap[T]>): Promise<EntityMap[T][]> {
        const storeData = this.store.get(store);
        const results = storeData ? (Array.from(storeData.values()) as EntityMap[T][]) : [];

        return this.applyQueryOptions(results, options);
    }

    async getByField<T extends EntityType>(
        store: T,
        field: keyof EntityMap[T],
        value: string,
        options?: QueryOptions<EntityMap[T]>,
    ): Promise<EntityMap[T][]> {
        const all = await this.getAll(store);
        const filtered = all.filter((item) => (item as unknown as Record<string, unknown>)[field as string] === value);

        return this.applyQueryOptions(filtered, options);
    }

    async count<T extends EntityType>(store: T, field?: keyof EntityMap[T], value?: string): Promise<number> {
        if (field && value !== undefined) {
            const results = await this.getByField(store, field, value);

            return results.length;
        }

        const all = await this.getAll(store);

        return all.length;
    }

    private applyQueryOptions<T>(results: T[], options?: QueryOptions<T>): T[] {
        if (!options) {
            return results;
        }

        let sorted = results;

        if (options.orderBy) {
            const dir = options.direction ?? 'asc';
            const field = options.orderBy;

            sorted = [...results].sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];

                if (aVal < bVal) {
                    return dir === 'asc' ? -1 : 1;
                }

                if (aVal > bVal) {
                    return dir === 'asc' ? 1 : -1;
                }

                return 0;
            });
        }

        const offset = options.offset ?? 0;
        const sliced = sorted.slice(offset);

        if (options.limit !== undefined) {
            return sliced.slice(0, options.limit);
        }

        return sliced;
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

    async setSyncStatus(fileKey: string, sha: string, etag?: string): Promise<void> {
        this.syncStore.set(fileKey, {
            fileKey,
            sha,
            lastSynced: new Date(),
            etag,
        });
    }

    async deleteSyncStatus(fileKey: string): Promise<void> {
        this.syncStore.delete(fileKey);
    }
}

describe('DatabaseAdapter interface', () => {
    beforeAll(() => {
        registerEntityCodec('factionModel', {
            serialize: (entity) => {
                const model = entity as MockHydratableEntity;

                return typeof model.toJSON === 'function'
                    ? (model.toJSON() as Record<string, unknown>)
                    : ({ ...(entity as Record<string, unknown>) } as Record<string, unknown>);
            },
            hydrate: (raw) => MockHydratableEntity.fromJSON(raw),
        });
    });
    it('MockDatabaseAdapter implements DatabaseAdapter', () => {
        const adapter: DatabaseAdapter = new MockDatabaseAdapter();
        expect(adapter.platform).toBe('sqlite');
    });

    it('initialize and close work', async () => {
        const adapter = new MockDatabaseAdapter();
        await adapter.initialize();
        expect(adapter.initialized).toBe(true);

        await adapter.close();
        expect(adapter.closed).toBe(true);
    });

    it('CRUD operations work for units', async () => {
        const adapter = new MockDatabaseAdapter();

        const unit: Unit = {
            id: 'unit-1',
            name: 'Intercessors',
            sourceFile: 'test.cat',
            sourceSha: 'abc123',
            factionId: 'space-marines',
            movement: '6"',
            toughness: 4,
            save: '3+',
            wounds: 2,
            leadership: 6,
            objectiveControl: 2,
            composition: [],
            rangedWeapons: [],
            meleeWeapons: [],
            wargearOptions: [],
            wargearAbilities: [],
            abilities: [],
            structuredAbilities: [],
            constraints: [],
            leader: undefined,
            keywords: ['Infantry'],
            factionKeywords: ['Adeptus Astartes'],
            imageUrl: '',
        };

        await adapter.put('unit', unit);

        const retrieved = await adapter.get('unit', 'unit-1');
        expect(retrieved).toEqual(unit);

        const all = await adapter.getAll('unit');
        expect(all).toHaveLength(1);

        await adapter.delete('unit', 'unit-1');
        const deleted = await adapter.get('unit', 'unit-1');
        expect(deleted).toBeNull();
    });

    it('getByField filters correctly', async () => {
        const adapter = new MockDatabaseAdapter();

        const unit1: Unit = {
            id: 'unit-1',
            name: 'Intercessors',
            sourceFile: 'sm.cat',
            sourceSha: 'abc',
            factionId: 'space-marines',
            movement: '6"',
            toughness: 4,
            save: '3+',
            wounds: 2,
            leadership: 6,
            objectiveControl: 2,
            composition: [],
            rangedWeapons: [],
            meleeWeapons: [],
            wargearOptions: [],
            wargearAbilities: [],
            abilities: [],
            structuredAbilities: [],
            constraints: [],
            leader: undefined,
            keywords: [],
            factionKeywords: [],
            imageUrl: '',
        };

        const unit2: Unit = {
            ...unit1,
            id: 'unit-2',
            name: 'Hellblasters',
            factionId: 'space-marines',
        };

        const unit3: Unit = {
            ...unit1,
            id: 'unit-3',
            name: 'Ork Boyz',
            factionId: 'orks',
        };

        await adapter.putMany('unit', [unit1, unit2, unit3]);

        const smUnits = await adapter.getByField('unit', 'factionId', 'space-marines');
        expect(smUnits).toHaveLength(2);
    });

    it('sync status operations work', async () => {
        const adapter = new MockDatabaseAdapter();

        await adapter.setSyncStatus('core.gst', 'sha123', 'etag456');

        const status = await adapter.getSyncStatus('core.gst');
        expect(status).not.toBeNull();
        expect(status!.sha).toBe('sha123');
        expect(status!.etag).toBe('etag456');

        await adapter.deleteSyncStatus('core.gst');
        const deleted = await adapter.getSyncStatus('core.gst');
        expect(deleted).toBeNull();
    });

    it('deleteAll clears store', async () => {
        const adapter = new MockDatabaseAdapter();

        const unit: Unit = {
            id: 'unit-1',
            name: 'Test',
            sourceFile: 'test.cat',
            sourceSha: 'abc',
            factionId: 'test',
            movement: '',
            toughness: 0,
            save: '',
            wounds: 0,
            leadership: 0,
            objectiveControl: 0,
            composition: [],
            rangedWeapons: [],
            meleeWeapons: [],
            wargearOptions: [],
            wargearAbilities: [],
            abilities: [],
            structuredAbilities: [],
            constraints: [],
            leader: undefined,
            keywords: [],
            factionKeywords: [],
            imageUrl: '',
        };

        await adapter.putMany('unit', [unit, { ...unit, id: 'unit-2' }]);
        expect(await adapter.getAll('unit')).toHaveLength(2);

        await adapter.deleteAll('unit');
        expect(await adapter.getAll('unit')).toHaveLength(0);
    });

    it('transaction executes function', async () => {
        const adapter = new MockDatabaseAdapter();

        const result = await adapter.transaction(async () => {
            return 'success';
        });

        expect(result).toBe('success');
    });

    describe('QueryOptions support', () => {
        it('getAll with limit returns bounded results', async () => {
            const adapter = new MockDatabaseAdapter();
            const base: Unit = {
                id: '',
                name: '',
                sourceFile: 'test.cat',
                sourceSha: 'abc',
                factionId: 'sm',
                movement: '6"',
                toughness: 4,
                save: '3+',
                wounds: 2,
                leadership: 6,
                objectiveControl: 2,
                composition: [],
                rangedWeapons: [],
                meleeWeapons: [],
                wargearOptions: [],
                wargearAbilities: [],
                abilities: [],
                structuredAbilities: [],
                constraints: [],
                leader: undefined,
                keywords: [],
                factionKeywords: [],
                imageUrl: '',
            };

            await adapter.putMany('unit', [
                { ...base, id: 'u1', name: 'Alpha' },
                { ...base, id: 'u2', name: 'Bravo' },
                { ...base, id: 'u3', name: 'Charlie' },
            ]);

            const limited = await adapter.getAll('unit', { limit: 2 });
            expect(limited).toHaveLength(2);
        });

        it('getAll with offset skips entries', async () => {
            const adapter = new MockDatabaseAdapter();
            const base: Unit = {
                id: '',
                name: '',
                sourceFile: 'test.cat',
                sourceSha: 'abc',
                factionId: 'sm',
                movement: '6"',
                toughness: 4,
                save: '3+',
                wounds: 2,
                leadership: 6,
                objectiveControl: 2,
                composition: [],
                rangedWeapons: [],
                meleeWeapons: [],
                wargearOptions: [],
                wargearAbilities: [],
                abilities: [],
                structuredAbilities: [],
                constraints: [],
                leader: undefined,
                keywords: [],
                factionKeywords: [],
                imageUrl: '',
            };

            await adapter.putMany('unit', [
                { ...base, id: 'u1', name: 'Alpha' },
                { ...base, id: 'u2', name: 'Bravo' },
                { ...base, id: 'u3', name: 'Charlie' },
            ]);

            const offset = await adapter.getAll('unit', { offset: 1 });
            expect(offset).toHaveLength(2);
        });

        it('getAll with orderBy sorts results', async () => {
            const adapter = new MockDatabaseAdapter();
            const base: Unit = {
                id: '',
                name: '',
                sourceFile: 'test.cat',
                sourceSha: 'abc',
                factionId: 'sm',
                movement: '6"',
                toughness: 4,
                save: '3+',
                wounds: 2,
                leadership: 6,
                objectiveControl: 2,
                composition: [],
                rangedWeapons: [],
                meleeWeapons: [],
                wargearOptions: [],
                wargearAbilities: [],
                abilities: [],
                structuredAbilities: [],
                constraints: [],
                leader: undefined,
                keywords: [],
                factionKeywords: [],
                imageUrl: '',
            };

            await adapter.putMany('unit', [
                { ...base, id: 'u3', name: 'Charlie' },
                { ...base, id: 'u1', name: 'Alpha' },
                { ...base, id: 'u2', name: 'Bravo' },
            ]);

            const sorted = await adapter.getAll('unit', { orderBy: 'name', direction: 'asc' });
            expect(sorted.map((u) => u.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);

            const descSorted = await adapter.getAll('unit', { orderBy: 'name', direction: 'desc' });
            expect(descSorted.map((u) => u.name)).toEqual(['Charlie', 'Bravo', 'Alpha']);
        });

        it('getAll with limit + offset + orderBy paginates correctly', async () => {
            const adapter = new MockDatabaseAdapter();
            const base: Unit = {
                id: '',
                name: '',
                sourceFile: 'test.cat',
                sourceSha: 'abc',
                factionId: 'sm',
                movement: '6"',
                toughness: 4,
                save: '3+',
                wounds: 2,
                leadership: 6,
                objectiveControl: 2,
                composition: [],
                rangedWeapons: [],
                meleeWeapons: [],
                wargearOptions: [],
                wargearAbilities: [],
                abilities: [],
                structuredAbilities: [],
                constraints: [],
                leader: undefined,
                keywords: [],
                factionKeywords: [],
                imageUrl: '',
            };

            await adapter.putMany('unit', [
                { ...base, id: 'u1', name: 'Alpha' },
                { ...base, id: 'u2', name: 'Bravo' },
                { ...base, id: 'u3', name: 'Charlie' },
                { ...base, id: 'u4', name: 'Delta' },
                { ...base, id: 'u5', name: 'Echo' },
            ]);

            const page2 = await adapter.getAll('unit', { orderBy: 'name', direction: 'asc', limit: 2, offset: 2 });
            expect(page2.map((u) => u.name)).toEqual(['Charlie', 'Delta']);
        });
    });

    describe('count', () => {
        it('returns 0 for empty store', async () => {
            const adapter = new MockDatabaseAdapter();
            const result = await adapter.count('unit');
            expect(result).toBe(0);
        });

        it('returns total count of entities', async () => {
            const adapter = new MockDatabaseAdapter();
            const base: Unit = {
                id: '',
                name: '',
                sourceFile: 'test.cat',
                sourceSha: 'abc',
                factionId: 'sm',
                movement: '6"',
                toughness: 4,
                save: '3+',
                wounds: 2,
                leadership: 6,
                objectiveControl: 2,
                composition: [],
                rangedWeapons: [],
                meleeWeapons: [],
                wargearOptions: [],
                wargearAbilities: [],
                abilities: [],
                structuredAbilities: [],
                constraints: [],
                leader: undefined,
                keywords: [],
                factionKeywords: [],
                imageUrl: '',
            };

            await adapter.putMany('unit', [
                { ...base, id: 'u1', name: 'Alpha' },
                { ...base, id: 'u2', name: 'Bravo' },
            ]);

            expect(await adapter.count('unit')).toBe(2);
        });

        it('returns filtered count when field and value provided', async () => {
            const adapter = new MockDatabaseAdapter();
            const base: Unit = {
                id: '',
                name: '',
                sourceFile: 'test.cat',
                sourceSha: 'abc',
                factionId: '',
                movement: '6"',
                toughness: 4,
                save: '3+',
                wounds: 2,
                leadership: 6,
                objectiveControl: 2,
                composition: [],
                rangedWeapons: [],
                meleeWeapons: [],
                wargearOptions: [],
                wargearAbilities: [],
                abilities: [],
                structuredAbilities: [],
                constraints: [],
                leader: undefined,
                keywords: [],
                factionKeywords: [],
                imageUrl: '',
            };

            await adapter.putMany('unit', [
                { ...base, id: 'u1', factionId: 'sm' },
                { ...base, id: 'u2', factionId: 'sm' },
                { ...base, id: 'u3', factionId: 'orks' },
            ]);

            expect(await adapter.count('unit', 'factionId', 'sm')).toBe(2);
            expect(await adapter.count('unit', 'factionId', 'orks')).toBe(1);
            expect(await adapter.count('unit', 'factionId', 'eldar')).toBe(0);
        });
    });

    describe('factionModel EntityType', () => {
        it('should support put and get for factionModel', async () => {
            const adapter = new MockDatabaseAdapter();

            const model = new MockHydratableEntity({
                id: 'faction-model-1',
                name: 'Test Faction Model',
                sourceFiles: ['test.cat'],
            });

            await adapter.put('factionModel', model);

            const retrieved = await adapter.get('factionModel', 'faction-model-1');
            expect(retrieved).toEqual(model);
        });

        it('should support getAll for factionModel', async () => {
            const adapter = new MockDatabaseAdapter();

            const modelOne = new MockHydratableEntity({
                id: 'faction-model-1',
                name: 'Test Faction Model',
                sourceFiles: ['test.cat'],
            });
            const modelTwo = new MockHydratableEntity({
                id: 'faction-model-2',
                name: 'Another Faction Model',
                sourceFiles: ['test-two.cat'],
            });

            await adapter.putMany('factionModel', [modelOne, modelTwo]);

            const all = await adapter.getAll('factionModel');
            expect(all).toHaveLength(2);
            expect(all).toContainEqual(modelOne);
            expect(all).toContainEqual(modelTwo);
        });
    });
});
