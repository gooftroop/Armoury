import type { DatabaseAdapter } from '@armoury/data-dao/adapter';
import type { IGitHubClient } from '@armoury/clients-github/types';
import type { FactionData } from '@/models/FactionData.js';
import { FACTION_MAP } from '@/config/factionMap.js';
import { FactionDAO } from '@/dao/FactionDAO.js';
import { SpaceMarinesDAO } from '@/dao/factions/SpaceMarinesDAO.js';

/** DAO for Space Wolves faction data (Space Marines chapter). */
export class SpaceWolvesDAO extends SpaceMarinesDAO {
    private readonly chapterFactionDAO: FactionDAO;

    /** Creates a Space Wolves DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        super(adapter, githubClient);
        this.chapterFactionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['space-wolves']);
    }

    /** Loads Space Wolves faction data merged with Space Marines base data. */
    override async load(): Promise<FactionData> {
        const [baseData, chapterData] = await Promise.all([super.load(), this.chapterFactionDAO.load()]);

        return this.mergeFactionData(baseData, chapterData);
    }

    /** Forces a re-sync of Space Wolves data and merges with Space Marines base data. */
    override async refresh(): Promise<FactionData> {
        const [baseData, chapterData] = await Promise.all([super.refresh(), this.chapterFactionDAO.refresh()]);

        return this.mergeFactionData(baseData, chapterData);
    }
}
