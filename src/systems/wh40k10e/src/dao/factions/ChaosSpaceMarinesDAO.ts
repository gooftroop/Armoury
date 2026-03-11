import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { FactionData } from '@/models/FactionData.js';
import { FactionDAO } from '@/dao/FactionDAO.js';
import { FACTION_MAP } from '@/config/factionMap.js';

/** DAO for Chaos Space Marines faction data. */
export class ChaosSpaceMarinesDAO {
    private readonly factionDAO: FactionDAO;

    /** Creates a Chaos Space Marines DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['chaos-space-marines']);
    }

    /** Loads Chaos Space Marines faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of Chaos Space Marines faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }
}
