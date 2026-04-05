/**
 * @requirements
 * - Standalone Drizzle table definitions for the campaigns service
 * - Used exclusively by drizzle-kit for schema introspection and migrations
 * - Must NOT import from the DAO package's `@/` path aliases (drizzle-kit cannot resolve them)
 * - Table definitions must stay in sync with the canonical definitions in the DAO layer
 */

import { boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** Drizzle table mapping for campaign entities. */
export const campaignsTable = pgTable(
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
export const campaignParticipantsTable = pgTable(
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
