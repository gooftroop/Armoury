/**
 * @requirements
 * - Standalone Drizzle table definitions for the matches service
 * - Used exclusively by drizzle-kit for schema introspection and migrations
 * - Must NOT import from the DAO package's `@/` path aliases (drizzle-kit cannot resolve them)
 * - Table definitions must stay in sync with the canonical definitions in the DAO layer
 */

import { pgTable, text } from 'drizzle-orm/pg-core';

/** Drizzle table mapping for match entities. */
export const matchesTable = pgTable('matches', {
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
