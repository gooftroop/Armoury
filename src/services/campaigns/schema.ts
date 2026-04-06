/**
 * @requirements
 * - Standalone Drizzle table definitions for the campaigns service
 * - Used exclusively by drizzle-kit for schema introspection and migrations
 * - Must NOT import from the DAO package's `@/` path aliases (drizzle-kit cannot resolve them)
 * - Table definitions must stay in sync with the canonical definitions in the DAO layer
 * - Tables must be schema-qualified when DB_SCHEMA is set to a non-public schema,
 *   so that drizzle-kit's schemaFilter includes them in the desired snapshot
 */

import { boolean, index, integer, pgSchema, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { PgTableFn } from 'drizzle-orm/pg-core';

/**
 * Builds a table constructor that targets the correct Postgres schema.
 * When DB_SCHEMA is a custom schema (e.g. 'pr_33'), tables are created under
 * that schema via pgSchema().table(). When unset or 'public', plain pgTable()
 * is used (pgSchema('public') throws in drizzle-orm).
 */
const dbSchema = process.env['DB_SCHEMA'];
const table: PgTableFn = dbSchema && dbSchema !== 'public' ? pgSchema(dbSchema).table : pgTable;

/** Drizzle table mapping for campaign entities. */
export const campaignsTable = table(
    'campaigns',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        name: text('name').notNull(),
        type: text('type').notNull(),
        organizerId: text('organizer_id').notNull(),
        narrative: text('narrative'),
        campaignData: text('campaign_data'),
        startDate: text('start_date').notNull(),
        endDate: text('end_date'),
        status: text('status').notNull(),
        phases: text('phases'),
        customRules: text('custom_rules'),
        rankings: text('rankings'),
        participantIds: text('participant_ids'),
        matchIds: text('match_ids'),
        createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        organizerIdIdx: index('idx_campaigns_organizer_id').on(table.organizerId),
        typeIdx: index('idx_campaigns_type').on(table.type),
    }),
);

/** Drizzle table mapping for campaign participant junction records. */
export const campaignParticipantsTable = table(
    'campaign_participants',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        campaignId: text('campaign_id').notNull(),
        userId: text('user_id').notNull(),
        displayName: text('display_name').notNull(),
        isOrganizer: boolean('is_organizer').notNull(),
        armyId: text('army_id').notNull(),
        armyName: text('army_name').notNull(),
        currentPhaseId: text('current_phase_id').notNull(),
        matchesInCurrentPhase: integer('matches_in_current_phase').notNull(),
        participantData: text('participant_data'),
        matchIds: text('match_ids'),
        joinedAt: timestamp('joined_at', { mode: 'string' }).notNull(),
        updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    },
    (table) => ({
        campaignIdIdx: index('idx_campaign_participants_campaign_id').on(table.campaignId),
        userIdIdx: index('idx_campaign_participants_user_id').on(table.userId),
    }),
);
