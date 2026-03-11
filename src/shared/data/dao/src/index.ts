export { registerHydrator, getHydrator, hasHydrator, clearHydrationRegistry } from './hydration.ts';
export { registerEntityCodec, getEntityCodec, hasEntityCodec, clearCodecRegistry, type EntityCodec } from './codec.ts';
export {
    registerSchemaExtension,
    getSchemaExtensions,
    clearSchemaExtensions,
    getMergedSQLiteSchema,
    getMergedDSQLSchema,
} from './schema.ts';
export { Platform, DatabaseError, isDatabaseError } from './types.ts';
export { BaseDatabaseAdapter } from './adapter.ts';
export type { DatabaseAdapter, EntityType, EntityMap, QueryOptions, SortDirection } from './adapter.ts';
export type { SchemaExtension, SQLiteSchemaExtension, DSQLSchemaExtension } from './schema.ts';
export type {
    FileSyncStatus,
    GameSystem,
    GameSystemManifest,
    GameContextResult,
    DataSourceConfig,
    ArmyDAO,
    CampaignDAO,
} from './types.ts';
export { PluginRegistry } from './pluginRegistry.ts';

export { BaseDAO } from './dao/BaseDAO.ts';
export { RemoteDataDAO } from './dao/RemoteDataDAO.ts';
export { BSDataBaseDAO } from './dao/BSDataBaseDAO.ts';
export { TTLSyncBaseDAO, DEFAULT_STALE_AFTER_MS } from './dao/TTLSyncBaseDAO.ts';
export { AccountDAO, accountsTable } from './dao/AccountDAO.ts';
export { FriendDAO, friendsTable } from './dao/FriendDAO.ts';
export { MatchDAO, matchesTable } from './dao/MatchDAO.ts';
export { UserPresenceDAO, userPresenceTable } from './dao/UserPresenceDAO.ts';
export { UserDAO, usersTable } from './dao/UserDAO.ts';
export { CampaignDAO as CampaignDAOImpl, campaignsTable } from './dao/CampaignDAO.ts';
export { CampaignParticipantDAO, campaignParticipantsTable } from './dao/CampaignParticipantDAO.ts';
export { syncStatusTable } from './dao/SyncStatusTable.ts';
