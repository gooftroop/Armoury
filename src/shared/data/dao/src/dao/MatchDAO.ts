import type { DatabaseAdapter } from '@/adapter.js';
import { BaseDAO } from '@/dao/BaseDAO.js';
import type { Match } from '@armoury/models';
import { pgTable, text } from 'drizzle-orm/pg-core';
import * as sl from 'drizzle-orm/sqlite-core';

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

/** Drizzle SQLite table mapping for match entities. */
export const matchesSqliteTable = sl.sqliteTable('matches', {
    id: sl
        .text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    systemId: sl.text('system_id').notNull(),
    players: sl.text('players').notNull(),
    turn: sl.text('turn').notNull(),
    score: sl.text('score'),
    outcome: sl.text('outcome').notNull(),
    campaignId: sl.text('campaign_id'),
    matchData: sl.text('match_data'),
    notes: sl.text('notes').notNull(),
    playedAt: sl.text('played_at'),
    createdAt: sl.text('created_at').notNull(),
    updatedAt: sl.text('updated_at').notNull(),
});

/** DAO for managing core match entities. */
export class MatchDAO extends BaseDAO<Match> {
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'match');
    }

    /** Lists matches for a given game system. */
    public async listBySystem(systemId: string): Promise<Match[]> {
        const results = await this.adapter.getByField(this.getStore(), 'systemId' as never, systemId);

        return results as Match[];
    }

    /**
     * Lists matches that include a specific player.
     * Filters in-memory since the adapter has no JSON-contains query for TEXT-serialized arrays of objects.
     */
    public async listByPlayer(playerId: string): Promise<Match[]> {
        const matches = (await this.adapter.getAll(this.getStore())) as Match[];

        return matches.filter((match) => match.players.some((p) => p.playerId === playerId));
    }

    /** Lists matches belonging to a specific campaign. */
    public async listByCampaign(campaignId: string): Promise<Match[]> {
        const results = await this.adapter.getByField(this.getStore(), 'campaignId' as never, campaignId);

        return results as Match[];
    }
}
