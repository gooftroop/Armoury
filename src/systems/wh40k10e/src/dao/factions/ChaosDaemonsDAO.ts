import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { FactionData } from '../../models/FactionData.ts';
import { FactionDAO } from '../FactionDAO.ts';
import { FACTION_MAP } from '../../config/factionMap.ts';

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
