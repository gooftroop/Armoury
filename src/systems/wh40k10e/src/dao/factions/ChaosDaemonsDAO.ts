import type { DatabaseAdapter } from '@data/adapter.js';
import type { IGitHubClient } from '@clients-github/types.js';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import { FactionDAO } from '@wh40k10e/dao/FactionDAO.js';
import { FACTION_MAP } from '@wh40k10e/config/factionMap.js';

/** DAO for Chaos Daemons faction data. */
export class ChaosDaemonsDAO {
    private readonly factionDAO: FactionDAO;

    /** Creates a Chaos Daemons DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['chaos-daemons']);
    }

    /** Loads Chaos Daemons faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of Chaos Daemons faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }
}
