import { describe, it, expect, afterEach } from 'vitest';
import { registerSchemaExtension, clearSchemaExtensions, getMergedDSQLSchema } from '@armoury/data-dao/schema';
import { createTestDatabase } from '../helpers/pgliteTestDb.js';
import { PGliteAdapter } from '@armoury/adapters-pglite';

type ColumnBuilder = { primaryKey: () => ColumnBuilder; notNull: () => ColumnBuilder };
type TableBuilder = (name: string, columns: Record<string, ColumnBuilder>) => Record<string, ColumnBuilder>;
type PgCoreModule = {
    pgTable: TableBuilder;
    text: (...args: unknown[]) => ColumnBuilder;
    jsonb: (...args: unknown[]) => ColumnBuilder;
};

const pgCoreModule = (await import('drizzle-orm/pg-core')) as unknown as PgCoreModule;
const { pgTable, text, jsonb } = pgCoreModule;

describe('Schema Extension E2E', () => {
    let teardown: () => Promise<void>;

    afterEach(async () => {
        if (teardown) {
            await teardown();
            teardown = undefined!;
        }
    });

    it('should register core schema and resolve core tables', () => {
        const merged = getMergedDSQLSchema();

        expect(merged.storeToTable).toHaveProperty('account');
        expect(merged.storeToTable).toHaveProperty('friend');
        expect(merged.storeToTable).toHaveProperty('fileSyncStatus');
        expect(merged.storeToTable).toHaveProperty('match');
        expect(merged.storeToTable).toHaveProperty('userPresence');
        expect(merged.storeToTable).toHaveProperty('campaign');
    });

    it('should register plugin schema extensions alongside core', () => {
        const testFactionsTable = pgTable('test_factions', {
            id: text('id').primaryKey(),
            name: text('name').notNull(),
            data: jsonb('data'),
        });

        registerSchemaExtension({
            dsql: {
                tables: { testFactions: testFactionsTable },
                storeToTable: { testFaction: testFactionsTable },
            },
        });

        const merged = getMergedDSQLSchema();

        expect(merged.storeToTable).toHaveProperty('account');
        expect(merged.storeToTable).toHaveProperty('testFaction');
        expect(merged.tables).toHaveProperty('testFactions');
    });

    it('should register service schema extensions alongside core + plugin', () => {
        const wsConnectionsTable = pgTable('ws_connections', {
            id: text('connection_id').primaryKey(),
            userId: text('user_id').notNull(),
        });

        registerSchemaExtension({
            dsql: {
                tables: { wsConnections: wsConnectionsTable },
                storeToTable: { wsConnection: wsConnectionsTable },
            },
        });

        const merged = getMergedDSQLSchema();

        expect(merged.storeToTable).toHaveProperty('account');
        expect(merged.storeToTable).toHaveProperty('wsConnection');
    });

    it('should throw for unknown entity store in adapter', async () => {
        const testDb = await createTestDatabase();
        const adapter = new PGliteAdapter();
        await adapter.initialize();

        teardown = async () => {
            await adapter.close();
            await testDb.teardown();
        };

        await expect(adapter.get('nonExistentStore' as never, 'id-1')).rejects.toThrow(/Unknown entity store/);
    });

    it('should clear and re-register schema extensions', () => {
        const beforeClear = getMergedDSQLSchema();
        expect(Object.keys(beforeClear.storeToTable).length).toBeGreaterThan(0);

        clearSchemaExtensions();
        const afterClear = getMergedDSQLSchema();
        expect(Object.keys(afterClear.storeToTable)).toHaveLength(0);
    });
});
