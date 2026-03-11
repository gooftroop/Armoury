import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { FactionData } from '../../models/FactionData.ts';
import { FactionDAO } from '../FactionDAO.ts';
import { FACTION_MAP } from '../../config/factionMap.ts';

/** DAO for Orks faction data. */
export class OrksDAO {
    private readonly factionDAO: FactionDAO;

    /** Creates an Orks DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        this.factionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['orks']);
    }

    /** Loads Orks faction data, syncing from BSData if needed. */
    async load(): Promise<FactionData> {
        return this.factionDAO.load();
    }

    /** Forces a re-sync of Orks faction data from BSData. */
    async refresh(): Promise<FactionData> {
        return this.factionDAO.refresh();
    }
}
