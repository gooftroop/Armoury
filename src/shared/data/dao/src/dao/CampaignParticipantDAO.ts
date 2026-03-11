import type { DatabaseAdapter } from '../adapter.ts';
import { BaseDAO } from './BaseDAO.ts';
import type { CampaignParticipant } from '@armoury/models/CampaignModel';

type ColumnBuilder = {
    primaryKey: () => ColumnBuilder;
    notNull: () => ColumnBuilder;
    $defaultFn: (fn: () => unknown) => ColumnBuilder;
};

type IndexBuilder = {
    on: (...columns: ColumnBuilder[]) => unknown;
};

type TableBuilder = (
    name: string,
    columns: Record<string, ColumnBuilder>,
    extraConfig?: (table: Record<string, ColumnBuilder>) => Record<string, unknown>,
) => Record<string, ColumnBuilder>;

type PgCoreModule = {
    pgTable: TableBuilder;
    text: (...args: unknown[]) => ColumnBuilder;
    integer: (...args: unknown[]) => ColumnBuilder;
    boolean: (...args: unknown[]) => ColumnBuilder;
    timestamp: (...args: unknown[]) => ColumnBuilder;
    index: (...args: unknown[]) => IndexBuilder;
};

type SqliteCoreModule = {
    sqliteTable: TableBuilder;
    text: (...args: unknown[]) => ColumnBuilder;
    integer: (...args: unknown[]) => ColumnBuilder;
    index: (...args: unknown[]) => IndexBuilder;
};

const pgCoreModule = (await import('drizzle-orm/pg-core')) as unknown as PgCoreModule;
const { pgTable, text, integer, boolean, timestamp, index } = pgCoreModule;
const sl = (await import('drizzle-orm/sqlite-core')) as unknown as SqliteCoreModule;

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

export const campaignParticipantsSqliteTable = sl.sqliteTable('campaign_participants', {
    id: sl
        .text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    campaignId: sl.text('campaign_id').notNull(),
    userId: sl.text('user_id').notNull(),
    displayName: sl.text('display_name').notNull(),
    isOrganizer: sl.integer('is_organizer', { mode: 'boolean' }).notNull(),
    armyId: sl.text('army_id').notNull(),
    armyName: sl.text('army_name').notNull(),
    currentPhaseId: sl.text('current_phase_id').notNull(),
    matchesInCurrentPhase: sl.integer('matches_in_current_phase').notNull(),
    participantData: sl.text('participant_data'),
    matchIds: sl.text('match_ids'),
    joinedAt: sl.text('joined_at').notNull(),
    updatedAt: sl.text('updated_at').notNull(),
});

/**
 * DAO for managing campaign participant junction records.
 */
export class CampaignParticipantDAO extends BaseDAO<CampaignParticipant> {
    /**
     * Creates a DAO instance for campaign participant operations.
     * @param adapter - Database adapter used to execute operations.
     */
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'campaignParticipant');
    }

    /**
     * Lists all participants for a given campaign.
     * @param campaignId - Campaign identifier to filter by.
     * @returns Array of participant records for the campaign.
     */
    public async listByCampaign(campaignId: string): Promise<CampaignParticipant[]> {
        const results = await this.adapter.getByField(this.getStore(), 'campaignId' as never, campaignId);

        return results as CampaignParticipant[];
    }

    /**
     * Lists all campaigns a user is participating in.
     * @param userId - User identifier to filter by.
     * @returns Array of participant records for the user.
     */
    public async listByUser(userId: string): Promise<CampaignParticipant[]> {
        const results = await this.adapter.getByField(this.getStore(), 'userId' as never, userId);

        return results as CampaignParticipant[];
    }
}
