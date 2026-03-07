import type { DatabaseAdapter } from '@data/adapter.js';
import type { IGitHubClient } from '@clients-github/types.js';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import { FactionDAO } from '@wh40k10e/dao/FactionDAO.js';
import { FACTION_MAP } from '@wh40k10e/config/factionMap.js';

/** DAO for Emperor's Children faction data. */
export class EmperorsChildrenDAO {
    private readonly factionDAO: FactionDAO;

    /** Creates an Emperor's Children DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['emperors-children']);
    }

    /** Loads Emperor's Children faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of Emperor's Children faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }
}
