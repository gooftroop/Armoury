export { registerHydrator, getHydrator, hasHydrator, clearHydrationRegistry } from '@/hydration.js';
export { registerEntityCodec, getEntityCodec, hasEntityCodec, clearCodecRegistry, type EntityCodec } from '@/codec.js';
export {
    registerSchemaExtension,
    getSchemaExtensions,
    clearSchemaExtensions,
    getMergedSQLiteSchema,
    getMergedDSQLSchema,
} from '@/schema.js';
export { Platform, DatabaseError, isDatabaseError } from '@/types.js';
export { BaseDatabaseAdapter } from '@/adapter.js';
export type { DatabaseAdapter, EntityType, EntityMap, QueryOptions, SortDirection } from '@/adapter.js';
export { registerPluginEntity } from '@/adapter.js';
export type { SchemaExtension, SQLiteSchemaExtension, DSQLSchemaExtension } from '@/schema.js';
export type {
    FileSyncStatus,
    SyncResult,
    GameSystem,
    GameSystemManifest,
    GameContextResult,
    DataSourceConfig,
    ArmyDAO,
    CampaignDAO,
    EntityKindDefinition,
    PluginValidationRule,
    ValidationRuleResult,
    EntityHydrator,
} from '@/types.js';
export { PluginRegistry } from '@/pluginRegistry.js';

export { BaseDAO } from '@/dao/BaseDAO.js';
export { RemoteDataDAO } from '@/dao/RemoteDataDAO.js';
export { BSDataBaseDAO } from '@/dao/BSDataBaseDAO.js';
export { TTLSyncBaseDAO, DEFAULT_STALE_AFTER_MS } from '@/dao/TTLSyncBaseDAO.js';
export { AccountDAO, accountsTable } from '@/dao/AccountDAO.js';
export { FriendDAO, friendsTable } from '@/dao/FriendDAO.js';
export { MatchDAO, matchesTable } from '@/dao/MatchDAO.js';
export { UserPresenceDAO, userPresenceTable } from '@/dao/UserPresenceDAO.js';
export { UserDAO, usersTable } from '@/dao/UserDAO.js';
export { CampaignDAO as CampaignDAOImpl, campaignsTable } from '@/dao/CampaignDAO.js';
export { CampaignParticipantDAO, campaignParticipantsTable } from '@/dao/CampaignParticipantDAO.js';
export { syncStatusTable } from '@/dao/SyncStatusTable.js';
