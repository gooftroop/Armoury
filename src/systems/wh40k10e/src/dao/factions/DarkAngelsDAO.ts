import type { DatabaseAdapter } from '@data/adapter.js';
import type { IGitHubClient } from '@clients-github/types.js';
import type { FactionData } from '@wh40k10e/models/FactionData.js';
import { FACTION_MAP } from '@wh40k10e/config/factionMap.js';
import { FactionDAO } from '@wh40k10e/dao/FactionDAO.js';
import { SpaceMarinesDAO } from '@wh40k10e/dao/factions/SpaceMarinesDAO.js';

/** DAO for Dark Angels faction data (Space Marines chapter). */
export class DarkAngelsDAO extends SpaceMarinesDAO {
    private readonly chapterFactionDAO: FactionDAO;

    /** Creates a Dark Angels DAO instance. */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient) {
        super(adapter, githubClient);
        this.chapterFactionDAO = new FactionDAO(adapter, githubClient, FACTION_MAP['dark-angels']);
    }

    /** Loads Dark Angels faction data merged with Space Marines base data. */
    override async load(): Promise<FactionData> {
        const [baseData, chapterData] = await Promise.all([super.load(), this.chapterFactionDAO.load()]);

        return this.mergeFactionData(baseData, chapterData);
    }

    /** Forces a re-sync of Dark Angels data and merges with Space Marines base data. */
    override async refresh(): Promise<FactionData> {
        const [baseData, chapterData] = await Promise.all([super.refresh(), this.chapterFactionDAO.refresh()]);

        return this.mergeFactionData(baseData, chapterData);
    }
}
