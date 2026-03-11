import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { FactionData } from '@/models/FactionData.js';
import { FactionDAO } from '@/dao/FactionDAO.js';
import { FACTION_MAP } from '@/config/factionMap.js';

/** DAO for World Eaters faction data. */
export class WorldEatersDAO {
    private readonly factionDAO: FactionDAO;

    /** Creates a World Eaters DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['world-eaters']);
    }

    /** Loads World Eaters faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of World Eaters faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }
}
