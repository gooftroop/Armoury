import type { DatabaseAdapter } from '@armoury/data-dao';
import type { IGitHubClient } from '@armoury/clients-github';
import { BSDataBaseDAO } from '@armoury/data-dao';

const BSDATA_OWNER = 'BSData';
const BSDATA_REPO = 'wh40k-10e';

/**
 * Base DAO for Warhammer 40K 10th Edition BSData-backed entities.
 * Extends BSDataBaseDAO with default BSData owner and repository for wh40k-10e.
 */
abstract class BaseDAO<T> extends BSDataBaseDAO<T> {
    /**
     * Creates a Warhammer 40K BSData DAO with default BSData repository settings.
     * @param adapter - Database adapter instance
     * @param githubClient - GitHub client for BSData access
     * @param owner - GitHub repository owner (defaults to 'BSData')
     * @param repo - GitHub repository name (defaults to 'wh40k-10e')
     */
    constructor(
        adapter: DatabaseAdapter,
        githubClient: IGitHubClient,
        owner: string = BSDATA_OWNER,
        repo: string = BSDATA_REPO,
    ) {
        super(adapter, githubClient, owner, repo);
    }
}

export { BaseDAO, BSDATA_OWNER, BSDATA_REPO };
