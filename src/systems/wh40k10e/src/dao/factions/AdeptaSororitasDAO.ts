import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { FactionData } from '@/models/FactionData.js';
import { FactionDAO } from '@/dao/FactionDAO.js';
import { FACTION_MAP } from '@/config/factionMap.js';

/** DAO for Adepta Sororitas faction data. */
export class AdeptaSororitasDAO {
    private readonly factionDAO: FactionDAO;

    /** Creates an Adepta Sororitas DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['adepta-sororitas']);
    }

    /** Loads Adepta Sororitas faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of Adepta Sororitas faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }
}
