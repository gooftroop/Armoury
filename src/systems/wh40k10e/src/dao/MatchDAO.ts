import type { DatabaseAdapter } from '@data/adapter.js';
import type { Match as CoreMatch } from '@models/MatchModel.js';
import { BaseDAO } from '@data/dao/BaseDAO.js';
import type { MatchData } from '@wh40k10e/models/MatchData.js';
import { Match } from '@wh40k10e/models/Match.js';

/**
 * DAO for 40K match records. Wraps core match persistence and returns
 * typed {@link Match} class instances via {@link Match.fromMatch}.
 */
export class MatchDAO extends BaseDAO<CoreMatch<MatchData>> {
    public constructor(adapter: DatabaseAdapter) {
        super(adapter, 'match');
    }

    /** Retrieves a match by ID and wraps it as a typed 40K Match, or null. */
    public async getTyped(id: string): Promise<Match | null> {
        const raw = await this.get(id);

        return raw ? Match.fromMatch(raw) : null;
    }

    /** Lists all 40K matches as typed Match instances. */
    public async listTyped(): Promise<Match[]> {
        const raw = await this.list();

        return raw.filter((m) => m.matchData?.systemId === 'wh40k10e').map((m) => Match.fromMatch(m));
    }

    /** Lists 40K matches that include a specific player. */
    public async listByPlayer(playerId: string): Promise<Match[]> {
        const all = await this.listTyped();

        return all.filter((m) => m.players.some((p) => p.playerId === playerId));
    }

    /** Lists matches belonging to a specific campaign. */
    public async listByCampaign(campaignId: string): Promise<Match[]> {
        const results = await this.adapter.getByField(this.getStore(), 'campaignId' as never, campaignId);

        return (results as unknown as CoreMatch<MatchData>[])
            .filter((m) => m.matchData?.systemId === 'wh40k10e')
            .map((m) => Match.fromMatch(m));
    }
}
