/**
 * Abstract base DAO for BSData-backed entities.
 *
 * Extends RemoteDataDAO with Git SHA-based sync status tracking
 * and GitHub update checks via the BSData repository.
 * Subclasses provide entity-specific store keys, file paths, and parsing logic.
 *
 * @module BSDataBaseDAO
 *
 * @requirements
 * 1. Must extend RemoteDataDAO for shared load/sync infrastructure.
 * 2. Must check for updates via githubClient.getFileLastCommitDate() using date comparison.
 * 3. Must store both remote SHA and lastModified as sync status after successful fetch.
 * 4. Must provide getRemoteFilePath() defaulting to getSyncFileKey().
 * 5. Must provide getRemoteSha() for retrieving the current remote SHA.
 * 6. Must accept (adapter, githubClient, owner, repo) in constructor.
 */

import type { DatabaseAdapter } from '@/adapter.js';
import type { IGitHubClient } from '@armoury/clients-github';
import { RemoteDataDAO } from '@/dao/RemoteDataDAO.js';

/**
 * Abstract base DAO for BSData-backed entities.
 * Extends RemoteDataDAO with Git SHA-based sync status tracking
 * and GitHub update checks via the BSData repository.
 */
abstract class BSDataBaseDAO<T> extends RemoteDataDAO<T> {
    /** GitHub client for BSData repository access and update checks. */
    protected readonly githubClient: IGitHubClient;

    /** GitHub repository owner (e.g., 'BSData'). */
    protected readonly owner: string;

    /** GitHub repository name (e.g., 'wh40k-10e'). */
    protected readonly repo: string;

    /**
     * Creates a BSData-backed DAO.
     * @param adapter - Database adapter instance
     * @param githubClient - GitHub client for BSData access
     * @param owner - GitHub repository owner
     * @param repo - GitHub repository name
     */
    constructor(adapter: DatabaseAdapter, githubClient: IGitHubClient, owner: string, repo: string) {
        super(adapter);
        this.githubClient = githubClient;
        this.owner = owner;
        this.repo = repo;
    }

    /**
     * Returns the remote file path used for GitHub update checks.
     * Defaults to the sync file key.
     */
    protected getRemoteFilePath(): string {
        return this.getSyncFileKey();
    }

    /**
     * Returns the remote SHA for the BSData file.
     * Used after fetch to store the current SHA as sync status.
     */
    protected async getRemoteSha(): Promise<string> {
        return this.githubClient.getFileSha(this.owner, this.repo, this.getRemoteFilePath());
    }

    /**
     * Returns the ISO 8601 date of the last commit that modified the remote BSData file.
     * Used for date-based staleness comparison.
     */
    protected async getRemoteLastCommitDate(): Promise<string> {
        return this.githubClient.getFileLastCommitDate(this.owner, this.repo, this.getRemoteFilePath());
    }

    /**
     * Checks if the remote file has updates compared to local sync status.
     * Compares the local lastSyncedAt timestamp with the remote file's last commit date.
     * Returns true if no sync status exists, no lastModified is stored, or if the
     * remote commit date is newer than the local lastModified. Falls open on error.
     */
    protected override async needsSync(): Promise<boolean> {
        const status = await this.adapter.getSyncStatus(this.getSyncFileKey());

        if (!status) {
            return true;
        }

        if (!status.lastModified) {
            return true;
        }

        try {
            const remoteDate = await this.getRemoteLastCommitDate();

            return new Date(remoteDate).getTime() > new Date(status.lastModified).getTime();
        } catch {
            return true;
        }
    }

    /**
     * Updates sync status with the remote SHA and last commit date after a successful fetch.
     * Retrieves both the current SHA and last commit date from GitHub.
     */
    protected override async onPostFetch(_data: T): Promise<void> {
        const [sha, lastModified] = await Promise.all([this.getRemoteSha(), this.getRemoteLastCommitDate()]);

        await this.adapter.setSyncStatus(this.getSyncFileKey(), sha, undefined, lastModified);
    }
}

export { BSDataBaseDAO };
