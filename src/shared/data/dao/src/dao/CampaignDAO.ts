import type { DatabaseAdapter } from '@/adapter.js';
import { BaseDAO } from '@/dao/BaseDAO.js';
import type { Campaign, CampaignStatus } from '@armoury/models';
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import * as sl from 'drizzle-orm/sqlite-core';

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

export const campaignsSqliteTable = sl.sqliteTable('campaigns', {
    id: sl
        .text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: sl.text('name').notNull(),
    type: sl.text('type').notNull(),
    organizerId: sl.text('organizer_id').notNull(),
    narrative: sl.text('narrative'),
    campaignData: sl.text('campaign_data'),
    startDate: sl.text('start_date').notNull(),
    endDate: sl.text('end_date'),
    status: sl.text('status').notNull(),
    phases: sl.text('phases'),
    customRules: sl.text('custom_rules'),
    rankings: sl.text('rankings'),
    participantIds: sl.text('participant_ids'),
    matchIds: sl.text('match_ids'),
    createdAt: sl.text('created_at').notNull(),
    updatedAt: sl.text('updated_at').notNull(),
});

/**
 * DAO for managing core campaign entities.
 */
export class CampaignDAO extends BaseDAO<Campaign> {
    /**
     * Creates a DAO instance for campaign operations.
     * @param adapter - Database adapter used to execute operations.
     */
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'campaign');
    }

    /**
     * Lists campaigns by their type discriminator.
     * @param type - Campaign type to filter by.
     * @returns Array of campaigns matching the specified type.
     */
    public async listByType(type: string): Promise<Campaign[]> {
        const results = await this.adapter.getByField(this.getStore(), 'type' as never, type);

        return results as Campaign[];
    }

    /**
     * Lists campaigns created by a specific organizer.
     * @param organizerId - Organizer account identifier to filter by.
     * @returns Array of campaigns organized by the specified user.
     */
    public async listByOrganizer(organizerId: string): Promise<Campaign[]> {
        const results = await this.adapter.getByField(this.getStore(), 'organizerId' as never, organizerId);

        return results as Campaign[];
    }

    /**
     * Lists campaigns filtered by lifecycle status.
     * @param status - Campaign status to filter by.
     * @returns Array of campaigns matching the specified status.
     */
    public async listByStatus(status: CampaignStatus): Promise<Campaign[]> {
        const results = await this.adapter.getByField(this.getStore(), 'status' as never, status);

        return results as Campaign[];
    }
}
