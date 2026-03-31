/**
 * Composable schema extension system for database adapters.
 * Core and plugin schemas are registered independently and merged at adapter initialization.
 * This enables game system plugins to provide their own database tables without
 * modifying core adapter code.
 */

import { accountsTable, accountsSqliteTable } from '@/dao/AccountDAO.js';
import { campaignParticipantsTable, campaignParticipantsSqliteTable } from '@/dao/CampaignParticipantDAO.js';
import { campaignsTable, campaignsSqliteTable } from '@/dao/CampaignDAO.js';
import { friendsTable, friendsSqliteTable } from '@/dao/FriendDAO.js';
import { matchesTable, matchesSqliteTable } from '@/dao/MatchDAO.js';
import { syncStatusTable, syncStatusSqliteTable } from '@/dao/SyncStatusTable.js';
import { userPresenceTable, userPresenceSqliteTable } from '@/dao/UserPresenceDAO.js';
import { usersTable, usersSqliteTable } from '@/dao/UserDAO.js';

import type { SQLiteSchemaExtension, DSQLSchemaExtension, SchemaExtension } from '@/types.js';

// Re-export schema interfaces for backward compatibility with existing '@data/schema.js' imports
export type { SQLiteSchemaExtension, DSQLSchemaExtension, SchemaExtension } from '@/types.js';

// ============ REGISTRY ============

/** Global registry of schema extensions from core and plugins. */
const schemaRegistry: SchemaExtension[] = [];

/**
 * Registers a schema extension in the global registry.
 * Called by plugins during initialization and by core at module load time.
 * @param extension - The schema extension to register.
 */
export function registerSchemaExtension(extension: SchemaExtension): void {
    schemaRegistry.push(extension);
}

/**
 * Returns all registered schema extensions.
 * @returns Readonly array of registered schema extensions.
 */
export function getSchemaExtensions(): readonly SchemaExtension[] {
    return schemaRegistry;
}

/**
 * Clears all registered schema extensions.
 * Primarily used in tests to reset state between test runs.
 */
export function clearSchemaExtensions(): void {
    schemaRegistry.length = 0;
}

// ============ MERGE FUNCTIONS ============

/**
 * Merges all registered SQLite schema extensions into a single schema.
 * Combines Drizzle sqliteTable definitions and store-to-table mappings.
 * @returns Merged SQLite schema with all core and plugin tables.
 */
export function getMergedSQLiteSchema(): SQLiteSchemaExtension {
    const tables: Record<string, unknown> = {};
    const storeToTable: Record<string, unknown> = {};

    for (const extension of schemaRegistry) {
        if (!extension.sqlite) {
            continue;
        }

        Object.assign(tables, extension.sqlite.tables);
        Object.assign(storeToTable, extension.sqlite.storeToTable);
    }

    return { tables, storeToTable };
}

/**
 * Merges all registered DSQL schema extensions into a single schema.
 * Combines Drizzle table definitions and store-to-table mappings.
 * @returns Merged DSQL schema with all core and plugin tables.
 */
export function getMergedDSQLSchema(): DSQLSchemaExtension {
    const tables: Record<string, unknown> = {};
    const storeToTable: Record<string, unknown> = {};

    for (const extension of schemaRegistry) {
        if (!extension.dsql) {
            continue;
        }

        Object.assign(tables, extension.dsql.tables);
        Object.assign(storeToTable, extension.dsql.storeToTable);
    }

    return { tables, storeToTable };
}

// ============ CORE SCHEMA ============

/** Core SQLite schema for game-agnostic entity tables. */
const CORE_SQLITE_SCHEMA: SQLiteSchemaExtension = {
    tables: {
        accounts: accountsSqliteTable,
        friends: friendsSqliteTable,
        matches: matchesSqliteTable,
        users: usersSqliteTable,
        userPresence: userPresenceSqliteTable,
        campaigns: campaignsSqliteTable,
        campaignParticipants: campaignParticipantsSqliteTable,
        syncStatus: syncStatusSqliteTable,
    },
    storeToTable: {
        account: accountsSqliteTable,
        friend: friendsSqliteTable,
        match: matchesSqliteTable,
        user: usersSqliteTable,
        userPresence: userPresenceSqliteTable,
        campaign: campaignsSqliteTable,
        campaignParticipant: campaignParticipantsSqliteTable,
        fileSyncStatus: syncStatusSqliteTable,
    },
};

/** Core DSQL (Drizzle) schema for game-agnostic entity tables. */
const CORE_DSQL_SCHEMA: DSQLSchemaExtension = {
    tables: {
        accounts: accountsTable,
        friends: friendsTable,
        matches: matchesTable,
        users: usersTable,
        userPresence: userPresenceTable,
        campaigns: campaignsTable,
        campaignParticipants: campaignParticipantsTable,
        syncStatus: syncStatusTable,
    },
    storeToTable: {
        account: accountsTable,
        friend: friendsTable,
        match: matchesTable,
        user: usersTable,
        userPresence: userPresenceTable,
        campaign: campaignsTable,
        campaignParticipant: campaignParticipantsTable,
        fileSyncStatus: syncStatusTable,
    },
};

/** Core schema extension combining all platform schemas. */
const CORE_SCHEMA: SchemaExtension = {
    sqlite: CORE_SQLITE_SCHEMA,
    dsql: CORE_DSQL_SCHEMA,
};

// Auto-register core schema at module load time.
registerSchemaExtension(CORE_SCHEMA);
