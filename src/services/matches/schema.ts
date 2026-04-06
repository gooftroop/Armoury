/**
 * @requirements
 * - Standalone Drizzle table definitions for the matches service
 * - Used exclusively by drizzle-kit for schema introspection and migrations
 * - Must NOT import from the DAO package's `@/` path aliases (drizzle-kit cannot resolve them)
 * - Table definitions must stay in sync with the canonical definitions in the DAO layer
 * - Tables must be schema-qualified when DB_SCHEMA is set to a non-public schema,
 *   so that drizzle-kit's schemaFilter includes them in the desired snapshot
 */

import { pgSchema, pgTable, text } from 'drizzle-orm/pg-core';
import type { PgTableFn } from 'drizzle-orm/pg-core';

/**
 * Builds a table constructor that targets the correct Postgres schema.
 * When DB_SCHEMA is a custom schema (e.g. 'pr_33'), tables are created under
 * that schema via pgSchema().table(). When unset or 'public', plain pgTable()
 * is used (pgSchema('public') throws in drizzle-orm).
 */
const dbSchema = process.env['DB_SCHEMA'];
const table: PgTableFn<string | undefined> = dbSchema && dbSchema !== 'public' ? pgSchema(dbSchema).table : pgTable;

/** Drizzle table mapping for match entities. */
export const matchesTable = table('matches', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    systemId: text('system_id').notNull(),
    players: text('players').notNull(),
    turn: text('turn').notNull(),
    score: text('score'),
    outcome: text('outcome').notNull(),
    campaignId: text('campaign_id'),
    matchData: text('match_data'),
    notes: text('notes').notNull(),
    playedAt: text('played_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
});
