import { beforeEach, describe, it, expect } from 'vitest';
import {
    registerSchemaExtension,
    getSchemaExtensions,
    clearSchemaExtensions,
    getMergedSQLiteSchema,
    getMergedDSQLSchema,
    type SchemaExtension,
    type SQLiteSchemaExtension,
    type DSQLSchemaExtension,
} from '../schema.ts';

describe('Schema Extension Registry', () => {
    beforeEach(() => {
        clearSchemaExtensions();
    });

    describe('registerSchemaExtension', () => {
        it('should add extension to registry', () => {
            const extension: SchemaExtension = {
                sqlite: {
                    tables: { test: { name: 'test' } },
                    storeToTable: { test: { name: 'test' } },
                },
            };

            registerSchemaExtension(extension);

            const extensions = getSchemaExtensions();
            expect(extensions).toHaveLength(1);
            expect(extensions[0]).toEqual(extension);
        });

        it('should allow multiple extensions to be registered', () => {
            const ext1: SchemaExtension = {
                sqlite: {
                    tables: { test1: { name: 'test1' } },
                    storeToTable: { test1: { name: 'test1' } },
                },
            };

            const ext2: SchemaExtension = {
                sqlite: {
                    tables: { test2: { name: 'test2' } },
                    storeToTable: { test2: { name: 'test2' } },
                },
            };

            registerSchemaExtension(ext1);
            registerSchemaExtension(ext2);

            const extensions = getSchemaExtensions();
            expect(extensions).toHaveLength(2);
            expect(extensions[0]).toEqual(ext1);
            expect(extensions[1]).toEqual(ext2);
        });
    });

    describe('getSchemaExtensions', () => {
        it('should return empty array when no extensions registered', () => {
            const extensions = getSchemaExtensions();
            expect(extensions).toEqual([]);
        });

        it('should return all registered extensions', () => {
            const ext1: SchemaExtension = { sqlite: { tables: {}, storeToTable: {} } };
            const ext2: SchemaExtension = {
                dsql: { tables: { test: { name: 'test' } }, storeToTable: {} },
            };

            registerSchemaExtension(ext1);
            registerSchemaExtension(ext2);

            const extensions = getSchemaExtensions();
            expect(extensions).toHaveLength(2);
            expect(extensions).toContain(ext1);
            expect(extensions).toContain(ext2);
        });
    });

    describe('clearSchemaExtensions', () => {
        it('should clear all registered extensions', () => {
            registerSchemaExtension({ sqlite: { tables: {}, storeToTable: {} } });
            registerSchemaExtension({
                dsql: { tables: { test: { name: 'test' } }, storeToTable: {} },
            });

            expect(getSchemaExtensions()).toHaveLength(2);

            clearSchemaExtensions();

            expect(getSchemaExtensions()).toHaveLength(0);
        });
    });

    describe('getMergedSQLiteSchema', () => {
        it('should return empty schema when no extensions registered', () => {
            const merged = getMergedSQLiteSchema();

            expect(merged.tables).toEqual({});
            expect(merged.storeToTable).toEqual({});
        });

        it('should return single extension schema when only one registered', () => {
            const unitsTable = { name: 'units' };
            const extension: SQLiteSchemaExtension = {
                tables: { units: unitsTable },
                storeToTable: { unit: unitsTable },
            };

            registerSchemaExtension({ sqlite: extension });

            const merged = getMergedSQLiteSchema();

            expect(merged.tables).toEqual(extension.tables);
            expect(merged.storeToTable).toEqual(extension.storeToTable);
        });

        it('should merge tables from multiple extensions', () => {
            const unitsTable = { name: 'units' };
            const weaponsTable = { name: 'weapons' };

            const ext1: SQLiteSchemaExtension = {
                tables: { units: unitsTable },
                storeToTable: {},
            };

            const ext2: SQLiteSchemaExtension = {
                tables: { weapons: weaponsTable },
                storeToTable: {},
            };

            registerSchemaExtension({ sqlite: ext1 });
            registerSchemaExtension({ sqlite: ext2 });

            const merged = getMergedSQLiteSchema();

            expect(merged.tables).toEqual({
                units: unitsTable,
                weapons: weaponsTable,
            });
        });

        it('should merge storeToTable mappings from multiple extensions', () => {
            const unitsTable = { name: 'units' };
            const weaponsTable = { name: 'weapons' };
            const abilitiesTable = { name: 'abilities' };
            const stratagemTable = { name: 'stratagems' };

            const ext1: SQLiteSchemaExtension = {
                tables: {},
                storeToTable: { unit: unitsTable, weapon: weaponsTable },
            };

            const ext2: SQLiteSchemaExtension = {
                tables: {},
                storeToTable: { ability: abilitiesTable, stratagem: stratagemTable },
            };

            registerSchemaExtension({ sqlite: ext1 });
            registerSchemaExtension({ sqlite: ext2 });

            const merged = getMergedSQLiteSchema();

            expect(merged.storeToTable).toEqual({
                unit: unitsTable,
                weapon: weaponsTable,
                ability: abilitiesTable,
                stratagem: stratagemTable,
            });
        });

        it('should skip extensions without sqlite property', () => {
            const testTable = { name: 'test' };
            const sqliteExt: SchemaExtension = {
                sqlite: {
                    tables: { test: testTable },
                    storeToTable: { test: testTable },
                },
            };

            const dsqlOnlyExt: SchemaExtension = {
                dsql: {
                    tables: { test: { name: 'test' } },
                    storeToTable: { test: { name: 'test' } },
                },
            };

            registerSchemaExtension(sqliteExt);
            registerSchemaExtension(dsqlOnlyExt);

            const merged = getMergedSQLiteSchema();

            expect(merged.tables).toEqual({ test: testTable });
            expect(merged.storeToTable).toEqual({ test: testTable });
        });
    });

    describe('getMergedDSQLSchema', () => {
        it('should return empty schema when no extensions registered', () => {
            const merged = getMergedDSQLSchema();

            expect(merged.tables).toEqual({});
            expect(merged.storeToTable).toEqual({});
        });

        it('should return single extension schema when only one registered', () => {
            const mockTable = { name: 'units', columns: [] };
            const extension: DSQLSchemaExtension = {
                tables: { units: mockTable },
                storeToTable: { unit: mockTable },
            };

            registerSchemaExtension({ dsql: extension });

            const merged = getMergedDSQLSchema();

            expect(merged.tables).toEqual(extension.tables);
            expect(merged.storeToTable).toEqual(extension.storeToTable);
        });

        it('should merge tables from multiple extensions', () => {
            const unitsTable = { name: 'units' };
            const weaponsTable = { name: 'weapons' };
            const abilitiesTable = { name: 'abilities' };

            const ext1: DSQLSchemaExtension = {
                tables: { units: unitsTable, weapons: weaponsTable },
                storeToTable: {},
            };

            const ext2: DSQLSchemaExtension = {
                tables: { abilities: abilitiesTable },
                storeToTable: {},
            };

            registerSchemaExtension({ dsql: ext1 });
            registerSchemaExtension({ dsql: ext2 });

            const merged = getMergedDSQLSchema();

            expect(merged.tables).toEqual({
                units: unitsTable,
                weapons: weaponsTable,
                abilities: abilitiesTable,
            });
        });

        it('should merge storeToTable mappings from multiple extensions', () => {
            const unitsTable = { name: 'units' };
            const weaponsTable = { name: 'weapons' };
            const abilitiesTable = { name: 'abilities' };

            const ext1: DSQLSchemaExtension = {
                tables: {},
                storeToTable: { unit: unitsTable, weapon: weaponsTable },
            };

            const ext2: DSQLSchemaExtension = {
                tables: {},
                storeToTable: { ability: abilitiesTable },
            };

            registerSchemaExtension({ dsql: ext1 });
            registerSchemaExtension({ dsql: ext2 });

            const merged = getMergedDSQLSchema();

            expect(merged.storeToTable).toEqual({
                unit: unitsTable,
                weapon: weaponsTable,
                ability: abilitiesTable,
            });
        });

        it('should skip extensions without dsql property', () => {
            const testTable = { name: 'test' };
            const sqliteOnlyExt: SchemaExtension = {
                sqlite: {
                    tables: { test: testTable },
                    storeToTable: { test: testTable },
                },
            };

            const mockTable = { name: 'test' };
            const dsqlExt: SchemaExtension = {
                dsql: {
                    tables: { test: mockTable },
                    storeToTable: { test: mockTable },
                },
            };

            registerSchemaExtension(sqliteOnlyExt);
            registerSchemaExtension(dsqlExt);

            const merged = getMergedDSQLSchema();

            expect(merged.tables).toEqual({ test: mockTable });
            expect(merged.storeToTable).toEqual({ test: mockTable });
        });
    });

    describe('Multi-platform extensions', () => {
        it('should handle extensions with both platforms', () => {
            const mockTable = { name: 'units' };

            const extension: SchemaExtension = {
                sqlite: {
                    tables: { units: mockTable },
                    storeToTable: { unit: mockTable },
                },
                dsql: {
                    tables: { units: mockTable },
                    storeToTable: { unit: mockTable },
                },
            };

            registerSchemaExtension(extension);

            const sqliteMerged = getMergedSQLiteSchema();
            const dsqlMerged = getMergedDSQLSchema();

            expect(sqliteMerged.tables).toEqual({ units: mockTable });
            expect(dsqlMerged.tables).toEqual({ units: mockTable });
        });
    });
});
