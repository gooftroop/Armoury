import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { FactionData } from '../../models/FactionData.ts';
import { FactionDAO } from '../FactionDAO.ts';
import { FACTION_MAP } from '../../config/factionMap.ts';

/** DAO for Adeptus Titanicus faction data. */
export class AdeptusTitanicusDAO {
    private readonly factionDAO: FactionDAO;

    /** Creates an Adeptus Titanicus DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['adeptus-titanicus']);
    }

    /** Loads Adeptus Titanicus faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of Adeptus Titanicus faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }
}
