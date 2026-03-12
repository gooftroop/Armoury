import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { GitHubFileInfo, IGitHubClient } from '@armoury/clients-github';
import { GitHubClient } from '@armoury/clients-github';
import { wh40k10eSystem } from '../src/system.js';
import { MockDatabaseAdapter } from '../src/__mocks__/MockDatabaseAdapter.js';
import { SpaceMarinesDAO } from '../src/dao/factions/SpaceMarinesDAO.js';
import { BloodAngelsDAO } from '../src/dao/factions/BloodAngelsDAO.js';
import { FactionDAO } from '../src/dao/FactionDAO.js';
import { CoreRulesDAO } from '../src/dao/CoreRulesDAO.js';
import { FACTION_MAP } from '../src/config/factionMap.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HAS_TOKEN = Boolean(GITHUB_TOKEN);

/** Wraps a real GitHubClient and counts API calls per method. */
class CountingGitHubClient implements IGitHubClient {
    private readonly client: GitHubClient;
    downloadFileCalls = 0;
    listFilesCalls = 0;
    getFileShaCalls = 0;
    checkForUpdatesCalls = 0;

    constructor(token?: string) {
        this.client = new GitHubClient({ token });
    }

    async listFiles(owner: string, repo: string, path: string): Promise<GitHubFileInfo[]> {
        this.listFilesCalls += 1;

        return this.client.listFiles(owner, repo, path);
    }

    async getFileSha(owner: string, repo: string, path: string): Promise<string> {
        this.getFileShaCalls += 1;

        return this.client.getFileSha(owner, repo, path);
    }

    async downloadFile(owner: string, repo: string, path: string): Promise<string> {
        this.downloadFileCalls += 1;

        return this.client.downloadFile(owner, repo, path);
    }

    async checkForUpdates(owner: string, repo: string, path: string, knownSha: string): Promise<boolean> {
        this.checkForUpdatesCalls += 1;

        return this.client.checkForUpdates(owner, repo, path, knownSha);
    }
}

async function createAdapter(): Promise<MockDatabaseAdapter> {
    const adapter = new MockDatabaseAdapter();
    await adapter.initialize();

    return adapter;
}

/**
 * Sync DAO integration tests against real BSData.
 *
 * Groups share adapters and loaded data via `beforeAll` to minimize GitHub API
 * calls. Only the multi-catalogue test needs its own adapter (fresh
 * CountingGitHubClient for call-count assertions).
 */
describe.skipIf(!HAS_TOKEN)('wh40k10e sync DAOs (real BSData)', () => {
    beforeAll(() => {
        wh40k10eSystem.register();
    });

    describe('FactionDAO sync (Space Marines)', { timeout: 120_000 }, () => {
        let smAdapter: MockDatabaseAdapter;
        let smDAO: SpaceMarinesDAO;
        let smFirst: Awaited<ReturnType<SpaceMarinesDAO['load']>>;

        beforeAll(async () => {
            smAdapter = await createAdapter();
            const smGithubClient = new CountingGitHubClient(GITHUB_TOKEN);
            smDAO = new SpaceMarinesDAO(smAdapter, smGithubClient);
            smFirst = await smDAO.load();
        });

        afterAll(async () => {
            await smAdapter?.close();
        });

        it('fetches from GitHub on first load and parses catalogue', async () => {
            const syncKey = `factionModel:${FACTION_MAP['space-marines'].id}`;
            const syncStatus = await smAdapter.getSyncStatus(syncKey);

            expect(syncStatus).not.toBeNull();
            expect(smFirst.weapons.length).toBeGreaterThan(0);
            expect(smFirst.abilities.length).toBeGreaterThan(0);
        });

        it('memoizes load() without re-fetching', async () => {
            const second = await smDAO.load();

            expect(second).toBe(smFirst);
        });
    });

    describe('FactionDAO sync (Blood Angels — stores to adapter)', { timeout: 120_000 }, () => {
        let baAdapter: MockDatabaseAdapter;

        beforeAll(async () => {
            baAdapter = await createAdapter();
            const githubClient = new CountingGitHubClient(GITHUB_TOKEN);
            const dao = new BloodAngelsDAO(baAdapter, githubClient);
            await dao.load();
        });

        afterAll(async () => {
            await baAdapter?.close();
        });

        it('stores units, weapons, and abilities in the adapter', async () => {
            const units = await baAdapter.getAll('unit');
            const weapons = await baAdapter.getAll('weapon');
            const abilities = await baAdapter.getAll('ability');

            expect(units.length).toBeGreaterThan(0);
            expect(weapons.length).toBeGreaterThan(0);
            expect(abilities.length).toBeGreaterThan(0);
        });
    });

    describe('FactionDAO sync (multi-catalogue)', { timeout: 120_000 }, () => {
        it('downloads and merges multiple catalogues', async () => {
            const adapter = await createAdapter();
            const githubClient = new CountingGitHubClient(GITHUB_TOKEN);
            const config = FACTION_MAP['black-templars'];
            const dao = new FactionDAO(adapter, githubClient, config);

            const model = await dao.load();

            expect(model.sourceFiles).toEqual(expect.arrayContaining(config.files));
            expect(model.sourceFiles.length).toBe(config.files.length);
            expect(githubClient.downloadFileCalls).toBe(config.files.length);

            await adapter.close();
        });
    });

    describe('CoreRulesDAO sync', { timeout: 120_000 }, () => {
        let crAdapter: MockDatabaseAdapter;
        let crGithubClient: CountingGitHubClient;
        let coreRules: Awaited<ReturnType<CoreRulesDAO['load']>>;

        beforeAll(async () => {
            crAdapter = await createAdapter();
            crGithubClient = new CountingGitHubClient(GITHUB_TOKEN);
            const dao = new CoreRulesDAO(crAdapter, crGithubClient);
            coreRules = await dao.load();
        });

        afterAll(async () => {
            await crAdapter?.close();
        });

        it('fetches the .gst file from GitHub and parses core rules', () => {
            expect(crGithubClient.downloadFileCalls).toBeGreaterThan(0);
            expect(coreRules.sourceFile).toBe('Warhammer%2040%2C000.gst');
        });

        it('discoverFactions writes faction records to the adapter', async () => {
            const factions = await crAdapter.getAll('faction');

            expect(factions.length).toBeGreaterThan(0);
        });

        it('stores faction records with correct catalogue file paths', async () => {
            const factions = await crAdapter.getAll('faction');
            const allHavePaths = factions.every(
                (faction) =>
                    faction.catalogueFile.endsWith('.cat') &&
                    faction.sourceFile === faction.catalogueFile &&
                    faction.sourceSha.length > 0,
            );

            expect(factions.length).toBeGreaterThan(0);
            expect(allHavePaths).toBe(true);
        });

        it('exposes profile types, categories, and shared rules', () => {
            expect(coreRules.profileTypes.length).toBeGreaterThan(0);
            expect(coreRules.categories.length).toBeGreaterThan(0);
            expect(coreRules.sharedRules.length).toBeGreaterThan(0);
        });
    });
});
