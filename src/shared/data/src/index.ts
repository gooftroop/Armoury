/**
 * Data-layer exports for adapters, schemas, hydration, and codecs.
 */
export { registerHydrator, getHydrator, hasHydrator, clearHydrationRegistry } from '@data/hydration.js';
export {
    registerEntityCodec,
    getEntityCodec,
    hasEntityCodec,
    clearCodecRegistry,
    type EntityCodec,
} from '@data/codec.js';
export {
    registerSchemaExtension,
    getSchemaExtensions,
    clearSchemaExtensions,
    getMergedSQLiteSchema,
    getMergedDSQLSchema,
} from '@data/schema.js';
export { Platform, DatabaseError, isDatabaseError } from '@data/types.js';
export { BaseDatabaseAdapter } from '@data/adapter.js';
export type { DatabaseAdapter, EntityType, EntityMap, QueryOptions, SortDirection } from '@data/adapter.js';
export type { SchemaExtension, SQLiteSchemaExtension, DSQLSchemaExtension } from '@data/schema.js';

export { DataContext } from '@data/DataContext.js';
export type { DataContextShape } from '@data/DataContext.js';
export { DataContextBuilder } from '@data/DataContextBuilder.js';
export type {
    FileSyncStatus,
    GameSystem,
    GameSystemManifest,
    GameContextResult,
    DataSourceConfig,
    ArmyDAO,
    CampaignDAO,
} from '@data/types.js';
